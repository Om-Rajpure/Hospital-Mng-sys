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

// Parse input body for POST, PUT, DELETE
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !is_array($input)) {
    $input = $_POST;
}

// -------------------------------------------------------------
// 1. GET - Fetch appointments with search, filter, pagination
// -------------------------------------------------------------
if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $status = trim($_GET['status'] ?? '');
    $department = trim($_GET['department'] ?? '');
    $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 50;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    $whereClauses = [];
    $params = [];
    $types = "";

    if (!empty($status) && $status !== 'All') {
        $whereClauses[] = "status = ?";
        $params[] = $status;
        $types .= "s";
    }

    if (!empty($department) && $department !== 'All') {
        $whereClauses[] = "department = ?";
        $params[] = $department;
        $types .= "s";
    }

    if (!empty($search)) {
        $like = "%" . $search . "%";
        $whereClauses[] = "(patient_name LIKE ? OR email LIKE ? OR doctor LIKE ? OR mobile LIKE ? OR id = ?)";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = is_numeric($search) ? (int)$search : 0;
        $types .= "ssssi";
    }

    $whereSql = !empty($whereClauses) ? " WHERE " . implode(" AND ", $whereClauses) : "";

    // Count total matching
    $countSql = "SELECT COUNT(*) as total FROM appointments" . $whereSql;
    $countStmt = $conn->prepare($countSql);
    if (!empty($types)) {
        $countStmt->bind_param($types, ...$params);
    }
    $countStmt->execute();
    $totalCount = $countStmt->get_result()->fetch_assoc()['total'];
    $countStmt->close();

    // Fetch records
    $query = "SELECT id, user_id, patient_name, email, mobile, department, doctor, appointment_date, appointment_time, symptoms, status, created_at FROM appointments"
           . $whereSql . " ORDER BY appointment_date DESC, appointment_time DESC LIMIT ? OFFSET ?";
    
    $fetchParams = $params;
    $fetchParams[] = $limit;
    $fetchParams[] = $offset;
    $fetchTypes = $types . "ii";

    $stmt = $conn->prepare($query);
    $stmt->bind_param($fetchTypes, ...$fetchParams);
    $stmt->execute();
    $result = $stmt->get_result();

    $appointments = [];
    while ($row = $result->fetch_assoc()) {
        $appointments[] = [
            "id" => (int)$row['id'],
            "userId" => $row['user_id'] ? (int)$row['user_id'] : null,
            "patientName" => $row['patient_name'],
            "email" => $row['email'],
            "mobile" => $row['mobile'],
            "department" => $row['department'],
            "doctor" => $row['doctor'],
            "date" => $row['appointment_date'],
            "time" => $row['appointment_time'],
            "symptoms" => $row['symptoms'],
            "status" => $row['status'],
            "createdAt" => $row['created_at']
        ];
    }
    $stmt->close();

    echo json_encode([
        "success" => true,
        "total" => (int)$totalCount,
        "count" => count($appointments),
        "appointments" => $appointments
    ]);
    exit;
}

// -------------------------------------------------------------
// 2. POST - Admin creates a new appointment
// -------------------------------------------------------------
if ($method === 'POST') {
    $patientName = trim($input['patientName'] ?? '');
    $email = trim($input['email'] ?? '');
    $mobile = trim($input['mobile'] ?? '');
    $department = trim($input['department'] ?? '');
    $doctor = trim($input['doctor'] ?? '');
    $date = trim($input['date'] ?? '');
    $time = trim($input['time'] ?? '');
    $symptoms = trim($input['symptoms'] ?? '');
    $status = trim($input['status'] ?? 'Confirmed');

    if (empty($patientName) || empty($email) || empty($mobile) || empty($department) || empty($doctor) || empty($date) || empty($time)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Please fill in all required appointment fields."]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Please enter a valid email address."]);
        exit;
    }

    $validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!in_array($status, $validStatuses)) {
        $status = 'Confirmed';
    }

    $stmt = $conn->prepare("INSERT INTO appointments (patient_name, email, mobile, department, doctor, appointment_date, appointment_time, symptoms, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssssss", $patientName, $email, $mobile, $department, $doctor, $date, $time, $symptoms, $status);

    if ($stmt->execute()) {
        $newId = $stmt->insert_id;
        $stmt->close();
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Appointment #{$newId} scheduled successfully.",
            "appointment_id" => $newId
        ]);
    } else {
        $err = $stmt->error;
        $stmt->close();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to create appointment: " . $err]);
    }
    exit;
}

// -------------------------------------------------------------
// 3. PUT / PATCH - Update appointment details or status
// -------------------------------------------------------------
if ($method === 'PUT' || $method === 'PATCH') {
    $id = isset($input['id']) ? (int)$input['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Valid appointment ID is required."]);
        exit;
    }

    // Check if appointment exists
    $check = $conn->query("SELECT id FROM appointments WHERE id = {$id} LIMIT 1");
    if (!$check || $check->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Appointment not found."]);
        exit;
    }

    // Check if quick status update only
    if (isset($input['status']) && count($input) <= 2) {
        $newStatus = trim($input['status']);
        $validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
        if (!in_array($newStatus, $validStatuses)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid appointment status."]);
            exit;
        }

        $stmt = $conn->prepare("UPDATE appointments SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $newStatus, $id);
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "message" => "Appointment #{$id} status updated to '{$newStatus}'."
        ]);
        exit;
    }

    // Full update
    $patientName = trim($input['patientName'] ?? '');
    $email = trim($input['email'] ?? '');
    $mobile = trim($input['mobile'] ?? '');
    $department = trim($input['department'] ?? '');
    $doctor = trim($input['doctor'] ?? '');
    $date = trim($input['date'] ?? '');
    $time = trim($input['time'] ?? '');
    $symptoms = trim($input['symptoms'] ?? '');
    $status = trim($input['status'] ?? 'Confirmed');

    if (empty($patientName) || empty($email) || empty($mobile) || empty($department) || empty($doctor) || empty($date) || empty($time)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "All required fields must be provided."]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE appointments SET patient_name = ?, email = ?, mobile = ?, department = ?, doctor = ?, appointment_date = ?, appointment_time = ?, symptoms = ?, status = ? WHERE id = ?");
    $stmt->bind_param("sssssssssi", $patientName, $email, $mobile, $department, $doctor, $date, $time, $symptoms, $status, $id);

    if ($stmt->execute()) {
        $stmt->close();
        echo json_encode([
            "success" => true,
            "message" => "Appointment #{$id} updated successfully."
        ]);
    } else {
        $err = $stmt->error;
        $stmt->close();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to update appointment: " . $err]);
    }
    exit;
}

// -------------------------------------------------------------
// 4. DELETE - Delete or cancel an appointment
// -------------------------------------------------------------
if ($method === 'DELETE') {
    $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Valid appointment ID is required."]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM appointments WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $stmt->close();
            echo json_encode([
                "success" => true,
                "message" => "Appointment #{$id} deleted successfully."
            ]);
        } else {
            $stmt->close();
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Appointment #{$id} not found."]);
        }
    } else {
        $err = $stmt->error;
        $stmt->close();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to delete appointment: " . $err]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Method not allowed."]);
?>
