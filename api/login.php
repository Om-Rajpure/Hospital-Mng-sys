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

// Support identifier as either username or email
$identifier = trim($input['identifier'] ?? $input['email'] ?? $input['username'] ?? '');
$password = $input['password'] ?? '';

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please provide both username/email and password."]);
    exit;
}

// Find user by either email or username
$stmt = $conn->prepare("SELECT id, username, full_name, email, mobile, age, gender, role, password FROM users WHERE email = ? OR username = ? LIMIT 1");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
    exit;
}

$stmt->bind_param("ss", $identifier, $identifier);
$stmt->execute();
$result = $stmt->get_result();

if ($result && ($user = $result->fetch_assoc())) {
    if (password_verify($password, $user['password'])) {
        $userRole = !empty($user['role']) ? $user['role'] : 'patient';
        
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['user_name'] = $user['full_name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $userRole;

        $userData = [
            "id" => (int)$user['id'],
            "username" => $user['username'] ?? '',
            "fullName" => $user['full_name'],
            "email" => $user['email'],
            "mobile" => $user['mobile'],
            "age" => (int)$user['age'],
            "gender" => $user['gender'],
            "role" => $userRole
        ];

        $stmt->close();
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Login successful!",
            "user" => $userData
        ]);
        exit;
    }
}

if ($stmt) {
    $stmt->close();
}

http_response_code(401);
echo json_encode(["success" => false, "message" => "Invalid credentials. Please verify username/email and password."]);
?>
