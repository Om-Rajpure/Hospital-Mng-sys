<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . "/../db.php";

$dbConnected = false;
$dbError = null;

if ($conn && !$conn->connect_error) {
    // Perform a lightweight check
    $test = @$conn->query("SELECT 1");
    if ($test) {
        $dbConnected = true;
    } else {
        $dbError = $conn->error;
    }
} else {
    $dbError = $conn ? $conn->connect_error : "Connection failed";
}

$status = $dbConnected ? "healthy" : "degraded";
$statusCode = $dbConnected ? 200 : 503;

http_response_code($statusCode);

echo json_encode([
    "status" => $status,
    "timestamp" => date('c'),
    "service" => "Hospital Appointment System API",
    "version" => "1.0.0",
    "database" => [
        "connected" => $dbConnected,
        "engine" => "MySQL (mysqli)"
    ]
]);
?>
