<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . "/../db.php";

if (!$conn || $conn->connect_error) {
    http_response_code(503);
    echo json_encode([
        "success" => false,
        "message" => "Database service unavailable. Please check database connection."
    ]);
    exit;
}

$email = trim($_GET['email'] ?? '');
$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : ($_SESSION['user_id'] ?? null);

$query = "SELECT id, user_id, patient_name, email, mobile, department, doctor, appointment_date, appointment_time, symptoms, status, created_at FROM appointments";
$params = [];
$types = "";

if (!empty($userId)) {
    $query .= " WHERE user_id = ?";
    $params[] = $userId;
    $types .= "i";
} elseif (!empty($email)) {
    $query .= " WHERE email = ?";
    $params[] = $email;
    $types .= "s";
}

$query .= " ORDER BY appointment_date DESC, appointment_time DESC";

$stmt = $conn->prepare($query);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database query error: " . $conn->error]);
    exit;
}

if (!empty($types)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$appointments = [];
if ($result) {
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
}

$stmt->close();

http_response_code(200);
echo json_encode([
    "success" => true,
    "count" => count($appointments),
    "appointments" => $appointments
]);
?>
