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

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please provide both email and password."]);
    exit;
}

$stmt = $conn->prepare("SELECT id, full_name, email, mobile, age, gender, password FROM users WHERE email = ? LIMIT 1");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result && ($user = $result->fetch_assoc())) {
    if (password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['user_name'] = $user['full_name'];
        $_SESSION['user_email'] = $user['email'];

        $userData = [
            "id" => (int)$user['id'],
            "fullName" => $user['full_name'],
            "email" => $user['email'],
            "mobile" => $user['mobile'],
            "age" => (int)$user['age'],
            "gender" => $user['gender']
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
echo json_encode(["success" => false, "message" => "Invalid email or password."]);
?>
