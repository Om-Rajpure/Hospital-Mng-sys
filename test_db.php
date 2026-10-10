<?php
require_once "db.php";

if (!$conn || $conn->connect_error) {
    $err = $conn ? $conn->connect_error : "Could not connect to database server.";
    http_response_code(500);
    echo "Database Connection Failed: " . htmlspecialchars($err);
    exit;
}

echo "Database Connected Successfully! Database: " . htmlspecialchars($database);
?>