<?php
// Authorization helper for administrator access control

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Enforces that the current request is from an authenticated administrator.
 * Terminates with HTTP 401 or 403 JSON response if unauthorized.
 */
function require_admin_auth() {
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Authentication required. Please log in as an administrator.",
            "code" => "UNAUTHENTICATED"
        ]);
        exit;
    }

    if (empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Access denied. Administrator privileges are required to perform this action.",
            "code" => "FORBIDDEN"
        ]);
        exit;
    }
}
?>
