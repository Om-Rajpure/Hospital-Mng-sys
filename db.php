<?php
// Database configuration - preserving original credentials
$host = getenv('DB_HOST') ?: "localhost";
$user = getenv('DB_USER') ?: "root";
$password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : "";
$database = getenv('DB_NAME') ?: "hospital_db";
$port = getenv('DB_PORT') ? (int)getenv('DB_PORT') : 3306;

// Suppress default mysqli exception throwing to allow custom error handling
mysqli_report(MYSQLI_REPORT_OFF);

// Attempt database connection
$conn = @new mysqli($host, $user, $password, $database, $port);

if ($conn && $conn->connect_errno === 1049) {
    // Database does not exist yet; connect to MySQL server to create it
    $serverConn = @new mysqli($host, $user, $password, "", $port);
    if ($serverConn && !$serverConn->connect_error) {
        $escapedDb = $serverConn->real_escape_string($database);
        $serverConn->query("CREATE DATABASE IF NOT EXISTS `{$escapedDb}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $serverConn->close();
        // Reconnect to the newly created database
        $conn = @new mysqli($host, $user, $password, $database, $port);
    }
}

if ($conn && !$conn->connect_error) {
    $conn->set_charset("utf8mb4");
    init_db_schema($conn);
}

/**
 * Initializes required database tables and initial seed data if they do not exist.
 */
function init_db_schema($conn) {
    if (!$conn || $conn->connect_error) {
        return;
    }

    $usersTable = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        mobile VARCHAR(15) NOT NULL,
        age INT NOT NULL,
        gender VARCHAR(10) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    $doctorsTable = "CREATE TABLE IF NOT EXISTS doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        specialization VARCHAR(255) NOT NULL,
        experience VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    $appointmentsTable = "CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        patient_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        mobile VARCHAR(15) NOT NULL,
        department VARCHAR(100) NOT NULL,
        doctor VARCHAR(100) NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time VARCHAR(20) NOT NULL,
        symptoms TEXT NULL,
        status VARCHAR(50) DEFAULT 'Confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (email),
        INDEX (appointment_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    @$conn->query($usersTable);
    @$conn->query($doctorsTable);
    @$conn->query($appointmentsTable);

    // Seed doctors if empty
    $docCheck = @$conn->query("SELECT COUNT(*) as count FROM doctors");
    if ($docCheck && ($row = $docCheck->fetch_assoc()) && (int)$row['count'] === 0) {
        $seedSql = "INSERT INTO doctors (id, name, department, specialization, experience) VALUES
        (1, 'Dr. Raj Sharma', 'Cardiology', 'Heart Diseases, ECG, BP Treatment', '15+ Years'),
        (2, 'Dr. Amit Patil', 'Orthopedics', 'Bone Fracture, Joint Pain', '12+ Years'),
        (3, 'Dr. Imran Khan', 'Neurology', 'Brain & Nerve Disorders', '10+ Years'),
        (4, 'Dr. Priya Mehta', 'Dermatology', 'Skin, Hair & Allergy Treatment', '8+ Years'),
        (5, 'Dr. Vivek Joshi', 'Pediatrics', 'Child Health & Vaccination', '9+ Years'),
        (6, 'Dr. Sneha Kulkarni', 'Gynecology', 'Women\'s Health & Pregnancy Care', '11+ Years')";
        @$conn->query($seedSql);
    }
}
?>