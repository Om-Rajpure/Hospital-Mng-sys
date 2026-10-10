<?php
require_once "db.php";

if (!$conn || $conn->connect_error) {
    $err = $conn ? $conn->connect_error : "Could not connect to database server.";
    http_response_code(500);
    echo "Database Connection Failed: " . htmlspecialchars($err) . "\n";
    exit;
}

echo "✅ Database Connected Successfully!\n";
echo "Database: " . htmlspecialchars($database) . "\n";

$tables = [];
$res = $conn->query("SHOW TABLES");
if ($res) {
    while ($row = $res->fetch_array()) {
        $tables[] = $row[0];
    }
}

echo "Tables (" . count($tables) . "): " . implode(", ", $tables) . "\n";

foreach ($tables as $t) {
    $cRes = $conn->query("SELECT COUNT(*) as cnt FROM `$t`");
    $cnt = $cRes ? $cRes->fetch_assoc()['cnt'] : 0;
    echo " - Table `$t`: $cnt rows\n";
}
?>