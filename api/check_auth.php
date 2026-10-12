<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!empty($_SESSION['user_id'])) {
    echo json_encode([
        "authenticated" => true,
        "user" => [
            "id" => (int)$_SESSION['user_id'],
            "name" => $_SESSION['user_name'] ?? '',
            "email" => $_SESSION['user_email'] ?? '',
            "role" => $_SESSION['user_role'] ?? 'patient'
        ]
    ]);
} else {
    echo json_encode([
        "authenticated" => false,
        "user" => null
    ]);
}
?>
