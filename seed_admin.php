<?php
// Standalone Seed Script for Local Development Administrator
require_once __DIR__ . "/db.php";

if (!$conn || $conn->connect_error) {
    echo "❌ Database connection failed: " . ($conn ? $conn->connect_error : "Unknown error") . "\n";
    exit(1);
}

echo "=== Hospital Appointment System - Admin Account Seeder ===\n";

// Ensure columns exist
$roleCheck = $conn->query("SHOW COLUMNS FROM users LIKE 'role'");
if ($roleCheck && $roleCheck->num_rows === 0) {
    $conn->query("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'patient' AFTER gender");
    echo "✔ Added 'role' column to users table.\n";
}

$usernameCheck = $conn->query("SHOW COLUMNS FROM users LIKE 'username'");
if ($usernameCheck && $usernameCheck->num_rows === 0) {
    $conn->query("ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL UNIQUE AFTER id");
    echo "✔ Added 'username' column to users table.\n";
}

// Check if admin user already exists
$adminQuery = $conn->query("SELECT id, username, email, role FROM users WHERE username = 'admin' OR email = 'admin@hospital.com' LIMIT 1");

if ($adminQuery && $adminQuery->num_rows > 0) {
    $existing = $adminQuery->fetch_assoc();
    echo "ℹ Administrator account already exists (ID: {$existing['id']}, Role: {$existing['role']}).\n";
    if ($existing['role'] !== 'admin') {
        $conn->query("UPDATE users SET role = 'admin' WHERE id = " . (int)$existing['id']);
        echo "✔ Updated account role to 'admin'.\n";
    }
    // Verify or reset password to requested dev password
    $hash = password_hash('admin@123', PASSWORD_BCRYPT);
    $upStmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $upStmt->bind_param("si", $hash, $existing['id']);
    $upStmt->execute();
    $upStmt->close();
    echo "✔ Development credentials verified and synced: Username 'admin', Password 'admin@123'.\n";
} else {
    $hash = password_hash('admin@123', PASSWORD_BCRYPT);
    $stmt = $conn->prepare("INSERT INTO users (username, full_name, email, mobile, age, gender, role, password) VALUES ('admin', 'System Administrator', 'admin@hospital.com', '9999999999', 35, 'Other', 'admin', ?)");
    if ($stmt) {
        $stmt->bind_param("s", $hash);
        if ($stmt->execute()) {
            echo "✔ Administrator account created successfully!\n";
            echo "  - Username: admin\n";
            echo "  - Password: [CONFIGURED IN SEEDER]\n";
            echo "  - Role: admin\n";
        } else {
            echo "❌ Failed to create admin: " . $stmt->error . "\n";
        }
        $stmt->close();
    }
}

echo "=== Seeder Complete ===\n";
?>
