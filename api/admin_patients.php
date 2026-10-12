<?php
require_once __DIR__ . "/auth_middleware.php";
require_admin_auth();

require_once __DIR__ . "/../db.php";

if (!$conn || $conn->connect_error) {
    http_response_code(503);
    echo json_encode(["success" => false, "message" => "Database unavailable."]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !is_array($input)) {
    $input = $_POST;
}

// -------------------------------------------------------------
// 1. GET - Fetch patients with search & stats
// -------------------------------------------------------------
if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $query = "SELECT u.id, u.username, u.full_name, u.email, u.mobile, u.age, u.gender, u.role, u.created_at,
                     COUNT(a.id) as total_appointments
              FROM users u
              LEFT JOIN appointments a ON u.id = a.user_id OR u.email = a.email
              WHERE u.role = 'patient'";
    $params = [];
    $types = "";

    if (!empty($search)) {
        $like = "%" . $search . "%";
        $query .= " AND (u.full_name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ? OR u.id = ?)";
        $params = [$like, $like, $like, is_numeric($search) ? (int)$search : 0];
        $types = "sssi";
    }

    $query .= " GROUP BY u.id ORDER BY u.id DESC";

    $stmt = $conn->prepare($query);
    if (!empty($types)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $res = $stmt->get_result();

    $patients = [];
    while ($row = $res->fetch_assoc()) {
        $patients[] = [
            "id" => (int)$row['id'],
            "username" => $row['username'],
            "fullName" => $row['full_name'],
            "email" => $row['email'],
            "mobile" => $row['mobile'],
            "age" => (int)$row['age'],
            "gender" => $row['gender'],
            "totalAppointments" => (int)$row['total_appointments'],
            "createdAt" => $row['created_at']
        ];
    }
    $stmt->close();

    echo json_encode([
        "success" => true,
        "count" => count($patients),
        "patients" => $patients
    ]);
    exit;
}

// -------------------------------------------------------------
// 2. POST - Add new patient (Admin-side)
// -------------------------------------------------------------
if ($method === 'POST') {
    $fullName = trim($input['fullName'] ?? '');
    $email = trim($input['email'] ?? '');
    $mobile = trim($input['mobile'] ?? '');
    $age = isset($input['age']) ? (int)$input['age'] : 0;
    $gender = trim($input['gender'] ?? '');
    $password = $input['password'] ?? 'patient123';

    if (empty($fullName) || empty($email) || empty($mobile) || empty($age) || empty($gender)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Please fill in all required patient fields."]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Please enter a valid email address."]);
        exit;
    }

    // Check duplicate email
    $check = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $check->bind_param("s", $email);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        $check->close();
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Email is already registered."]);
        exit;
    }
    $check->close();

    $passHash = password_hash($password, PASSWORD_BCRYPT);
    $role = 'patient';

    $stmt = $conn->prepare("INSERT INTO users (full_name, email, mobile, age, gender, role, password) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssisss", $fullName, $email, $mobile, $age, $gender, $role, $passHash);

    if ($stmt->execute()) {
        $newId = $stmt->insert_id;
        $stmt->close();
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Patient '{$fullName}' registered successfully.",
            "patient_id" => $newId
        ]);
    } else {
        $err = $stmt->error;
        $stmt->close();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to add patient: " . $err]);
    }
    exit;
}

// -------------------------------------------------------------
// 3. PUT - Update patient information
// -------------------------------------------------------------
if ($method === 'PUT' || $method === 'PATCH') {
    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $fullName = trim($input['fullName'] ?? '');
    $email = trim($input['email'] ?? '');
    $mobile = trim($input['mobile'] ?? '');
    $age = isset($input['age']) ? (int)$input['age'] : 0;
    $gender = trim($input['gender'] ?? '');

    if ($id <= 0 || empty($fullName) || empty($email) || empty($mobile) || empty($age) || empty($gender)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Patient ID and all fields are required."]);
        exit;
    }

    // Prevent duplicate email with another user
    $check = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1");
    $check->bind_param("si", $email, $id);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        $check->close();
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Another user is already using this email."]);
        exit;
    }
    $check->close();

    $stmt = $conn->prepare("UPDATE users SET full_name = ?, email = ?, mobile = ?, age = ?, gender = ? WHERE id = ? AND role = 'patient'");
    $stmt->bind_param("sssisi", $fullName, $email, $mobile, $age, $gender, $id);

    if ($stmt->execute()) {
        $stmt->close();
        echo json_encode([
            "success" => true,
            "message" => "Patient record updated successfully."
        ]);
    } else {
        $err = $stmt->error;
        $stmt->close();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to update patient: " . $err]);
    }
    exit;
}

// -------------------------------------------------------------
// 4. DELETE - Delete patient record
// -------------------------------------------------------------
if ($method === 'DELETE') {
    $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Valid patient ID is required."]);
        exit;
    }

    // Protect administrator accounts
    $check = $conn->query("SELECT role FROM users WHERE id = {$id} LIMIT 1");
    if ($check && ($row = $check->fetch_assoc())) {
        if ($row['role'] === 'admin') {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Cannot delete an administrator account."]);
            exit;
        }
    }

    // Unlink appointments
    $conn->query("UPDATE appointments SET user_id = NULL WHERE user_id = {$id}");

    $stmt = $conn->prepare("DELETE FROM users WHERE id = ? AND role = 'patient'");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $stmt->close();
            echo json_encode([
                "success" => true,
                "message" => "Patient record #{$id} deleted successfully."
            ]);
        } else {
            $stmt->close();
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Patient not found."]);
        }
    } else {
        $err = $stmt->error;
        $stmt->close();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to delete patient: " . $err]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Method not allowed."]);
?>
