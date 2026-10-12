<?php
require_once __DIR__ . "/auth_middleware.php";
require_admin_auth();

require_once __DIR__ . "/../db.php";

if (!$conn || $conn->connect_error) {
    http_response_code(503);
    echo json_encode(["success" => false, "message" => "Database unavailable."]);
    exit;
}

// 1. KPI Counts
$totalPatients = 0;
$res = $conn->query("SELECT COUNT(*) as cnt FROM users WHERE role = 'patient'");
if ($res && $row = $res->fetch_assoc()) $totalPatients = (int)$row['cnt'];

$totalDoctors = 0;
$res = $conn->query("SELECT COUNT(*) as cnt FROM doctors");
if ($res && $row = $res->fetch_assoc()) $totalDoctors = (int)$row['cnt'];

$totalAppointments = 0;
$res = $conn->query("SELECT COUNT(*) as cnt FROM appointments");
if ($res && $row = $res->fetch_assoc()) $totalAppointments = (int)$row['cnt'];

$todayAppointments = 0;
$res = $conn->query("SELECT COUNT(*) as cnt FROM appointments WHERE appointment_date = CURDATE()");
if ($res && $row = $res->fetch_assoc()) $todayAppointments = (int)$row['cnt'];

$pendingAppointments = 0;
$res = $conn->query("SELECT COUNT(*) as cnt FROM appointments WHERE status = 'Pending'");
if ($res && $row = $res->fetch_assoc()) $pendingAppointments = (int)$row['cnt'];

$confirmedAppointments = 0;
$res = $conn->query("SELECT COUNT(*) as cnt FROM appointments WHERE status = 'Confirmed'");
if ($res && $row = $res->fetch_assoc()) $confirmedAppointments = (int)$row['cnt'];

$completedAppointments = 0;
$res = $conn->query("SELECT COUNT(*) as cnt FROM appointments WHERE status = 'Completed'");
if ($res && $row = $res->fetch_assoc()) $completedAppointments = (int)$row['cnt'];

$cancelledAppointments = 0;
$res = $conn->query("SELECT COUNT(*) as cnt FROM appointments WHERE status = 'Cancelled'");
if ($res && $row = $res->fetch_assoc()) $cancelledAppointments = (int)$row['cnt'];

// 2. Department Breakdown
$departmentStats = [];
$res = $conn->query("SELECT department, COUNT(*) as count FROM appointments GROUP BY department ORDER BY count DESC");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $departmentStats[] = [
            "department" => $row['department'],
            "count" => (int)$row['count']
        ];
    }
}

// 3. Status Breakdown
$statusStats = [
    "Confirmed" => $confirmedAppointments,
    "Pending" => $pendingAppointments,
    "Completed" => $completedAppointments,
    "Cancelled" => $cancelledAppointments
];

// 4. Appointments timeline (last 7 recorded dates)
$timelineStats = [];
$res = $conn->query("SELECT appointment_date, COUNT(*) as count FROM appointments GROUP BY appointment_date ORDER BY appointment_date DESC LIMIT 7");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $timelineStats[] = [
            "date" => $row['appointment_date'],
            "count" => (int)$row['count']
        ];
    }
    $timelineStats = array_reverse($timelineStats);
}

// 5. Recent Appointments
$recentAppointments = [];
$res = $conn->query("SELECT id, patient_name, doctor, department, appointment_date, appointment_time, status, created_at FROM appointments ORDER BY id DESC LIMIT 5");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $recentAppointments[] = [
            "id" => (int)$row['id'],
            "patientName" => $row['patient_name'],
            "doctor" => $row['doctor'],
            "department" => $row['department'],
            "date" => $row['appointment_date'],
            "time" => $row['appointment_time'],
            "status" => $row['status'],
            "createdAt" => $row['created_at']
        ];
    }
}

// 6. Recent Patients
$recentPatients = [];
$res = $conn->query("SELECT id, full_name, email, mobile, age, gender, created_at FROM users WHERE role = 'patient' ORDER BY id DESC LIMIT 5");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $recentPatients[] = [
            "id" => (int)$row['id'],
            "fullName" => $row['full_name'],
            "email" => $row['email'],
            "mobile" => $row['mobile'],
            "age" => (int)$row['age'],
            "gender" => $row['gender'],
            "createdAt" => $row['created_at']
        ];
    }
}

http_response_code(200);
echo json_encode([
    "success" => true,
    "summary" => [
        "totalPatients" => $totalPatients,
        "totalDoctors" => $totalDoctors,
        "totalAppointments" => $totalAppointments,
        "todayAppointments" => $todayAppointments,
        "pendingAppointments" => $pendingAppointments,
        "confirmedAppointments" => $confirmedAppointments,
        "completedAppointments" => $completedAppointments,
        "cancelledAppointments" => $cancelledAppointments
    ],
    "departments" => $departmentStats,
    "statusDistribution" => $statusStats,
    "timeline" => $timelineStats,
    "recentAppointments" => $recentAppointments,
    "recentPatients" => $recentPatients
]);
?>
