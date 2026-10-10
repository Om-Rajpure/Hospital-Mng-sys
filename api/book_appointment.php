<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed. Use POST."]);
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

$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !is_array($input)) {
    $input = $_POST;
}

$patientName = trim($input['patientName'] ?? $input['patient_name'] ?? '');
$email = trim($input['email'] ?? $input['patientEmail'] ?? '');
$mobile = trim($input['mobile'] ?? $input['patientMobile'] ?? '');
$department = trim($input['department'] ?? '');
$doctor = trim($input['doctor'] ?? '');
$date = trim($input['date'] ?? $input['appointmentDate'] ?? '');
$time = trim($input['time'] ?? $input['appointmentTime'] ?? '');
$symptoms = trim($input['symptoms'] ?? '');
$userId = isset($input['userId']) ? (int)$input['userId'] : ($_SESSION['user_id'] ?? null);

// Validation
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

if (!preg_match('/^[0-9]{10}$/', $mobile)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please enter a valid 10-digit mobile number."]);
    exit;
}

// Verify date format (YYYY-MM-DD)
$dateObj = DateTime::createFromFormat('Y-m-d', $date);
if (!$dateObj || $dateObj->format('Y-m-d') !== $date) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid appointment date format. Use YYYY-MM-DD."]);
    exit;
}

$today = new DateTime('today');
if ($dateObj < $today) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Appointment date cannot be in the past."]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO appointments (user_id, patient_name, email, mobile, department, doctor, appointment_date, appointment_time, symptoms, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database prepare error: " . $conn->error]);
    exit;
}

$stmt->bind_param("issssssss", $userId, $patientName, $email, $mobile, $department, $doctor, $date, $time, $symptoms);

if ($stmt->execute()) {
    $appointmentId = $stmt->insert_id;
    $stmt->close();

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Appointment booked successfully!",
        "appointment" => [
            "id" => $appointmentId,
            "patientName" => $patientName,
            "email" => $email,
            "mobile" => $mobile,
            "department" => $department,
            "doctor" => $doctor,
            "date" => $date,
            "time" => $time,
            "symptoms" => $symptoms,
            "status" => "Confirmed"
        ]
    ]);
} else {
    $err = $stmt->error;
    $stmt->close();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to book appointment: " . $err]);
}
?>
