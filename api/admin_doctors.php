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
// 1. GET - Fetch doctors
// -------------------------------------------------------------
if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $query = "SELECT id, name, department, specialization, experience, created_at FROM doctors";
    $params = [];
    $types = "";

    if (!empty($search)) {
        $like = "%" . $search . "%";
        $query .= " WHERE (name LIKE ? OR department LIKE ? OR specialization LIKE ?)";
        $params = [$like, $like, $like];
        $types = "sss";
    }

    $query .= " ORDER BY id ASC";
    $stmt = $conn->prepare($query);
    if (!empty($types)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $res = $stmt->get_result();

    $doctors = [];
    while ($row = $res->fetch_assoc()) {
        $doctors[] = [
            "id" => (int)$row['id'],
            "name" => $row['name'],
            "department" => $row['department'],
            "specialization" => $row['specialization'],
            "experience" => $row['experience'],
            "createdAt" => $row['created_at']
        ];
    }
    $stmt->close();

    echo json_encode([
        "success" => true,
        "count" => count($doctors),
        "doctors" => $doctors
    ]);
    exit;
}

// -------------------------------------------------------------
// 2. POST - Add new doctor
// -------------------------------------------------------------
if ($method === 'POST') {
    $name = trim($input['name'] ?? '');
    $department = trim($input['department'] ?? '');
    $specialization = trim($input['specialization'] ?? '');
    $experience = trim($input['experience'] ?? '');

    if (empty($name) || empty($department) || empty($specialization) || empty($experience)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Please fill in all doctor details."]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO doctors (name, department, specialization, experience) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $department, $specialization, $experience);

    if ($stmt->execute()) {
        $newId = $stmt->insert_id;
        $stmt->close();
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Dr. {$name} added successfully.",
            "doctor_id" => $newId
        ]);
    } else {
        $err = $stmt->error;
        $stmt->close();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to add doctor: " . $err]);
    }
    exit;
}

// -------------------------------------------------------------
// 3. PUT - Update doctor details
// -------------------------------------------------------------
if ($method === 'PUT' || $method === 'PATCH') {
    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $name = trim($input['name'] ?? '');
    $department = trim($input['department'] ?? '');
    $specialization = trim($input['specialization'] ?? '');
    $experience = trim($input['experience'] ?? '');

    if ($id <= 0 || empty($name) || empty($department) || empty($specialization) || empty($experience)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Doctor ID and all profile fields are required."]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE doctors SET name = ?, department = ?, specialization = ?, experience = ? WHERE id = ?");
    $stmt->bind_param("ssssi", $name, $department, $specialization, $experience, $id);

    if ($stmt->execute()) {
        $stmt->close();
        echo json_encode([
            "success" => true,
            "message" => "Dr. {$name} profile updated successfully."
        ]);
    } else {
        $err = $stmt->error;
        $stmt->close();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to update doctor: " . $err]);
    }
    exit;
}

// -------------------------------------------------------------
// 4. DELETE - Delete doctor
// -------------------------------------------------------------
if ($method === 'DELETE') {
    $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Valid doctor ID is required."]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM doctors WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $stmt->close();
            echo json_encode([
                "success" => true,
                "message" => "Doctor record #{$id} deleted successfully."
            ]);
        } else {
            $stmt->close();
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Doctor #{$id} not found."]);
        }
    } else {
        $err = $stmt->error;
        $stmt->close();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to delete doctor: " . $err]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Method not allowed."]);
?>
