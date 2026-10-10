<?php
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

// Support both JSON body and standard Form POST
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !is_array($input)) {
    $input = $_POST;
}

$fullName = trim($input['fullName'] ?? $input['full_name'] ?? '');
$email = trim($input['email'] ?? '');
$mobile = trim($input['mobile'] ?? $input['phone'] ?? '');
$age = isset($input['age']) ? (int)$input['age'] : 0;
$gender = trim($input['gender'] ?? '');
$password = $input['password'] ?? '';
$confirmPassword = $input['confirmPassword'] ?? $input['confirm_password'] ?? '';

// Validation
if (empty($fullName) || empty($email) || empty($mobile) || empty($age) || empty($gender) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
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

if ($age < 1 || $age > 120) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please enter a valid age between 1 and 120."]);
    exit;
}

if (!in_array($gender, ['Male', 'Female', 'Other'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please select a valid gender."]);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Password must be at least 6 characters long."]);
    exit;
}

if (!empty($confirmPassword) && $password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Passwords do not match."]);
    exit;
}

// Check if email already registered
$checkStmt = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
if (!$checkStmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database query error: " . $conn->error]);
    exit;
}

$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult && $checkResult->num_rows > 0) {
    $checkStmt->close();
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "Email is already registered. Please login instead."]);
    exit;
}
$checkStmt->close();

// Hash password and insert
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$insertStmt = $conn->prepare("INSERT INTO users (full_name, email, mobile, age, gender, password) VALUES (?, ?, ?, ?, ?, ?)");

if (!$insertStmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database prepare error: " . $conn->error]);
    exit;
}

$insertStmt->bind_param("sssiss", $fullName, $email, $mobile, $age, $gender, $passwordHash);

if ($insertStmt->execute()) {
    $newUserId = $insertStmt->insert_id;
    $insertStmt->close();
    
    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Registration successful! Please login with your credentials.",
        "user_id" => $newUserId
    ]);
} else {
    $err = $insertStmt->error;
    $insertStmt->close();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to register user: " . $err]);
}
?>
