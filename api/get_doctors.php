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

$fallbackDoctors = [
    ["id" => 1, "name" => "Dr. Raj Sharma", "department" => "Cardiology", "specialization" => "Heart Diseases, ECG, BP Treatment", "experience" => "15+ Years"],
    ["id" => 2, "name" => "Dr. Amit Patil", "department" => "Orthopedics", "specialization" => "Bone Fracture, Joint Pain", "experience" => "12+ Years"],
    ["id" => 3, "name" => "Dr. Imran Khan", "department" => "Neurology", "specialization" => "Brain & Nerve Disorders", "experience" => "10+ Years"],
    ["id" => 4, "name" => "Dr. Priya Mehta", "department" => "Dermatology", "specialization" => "Skin, Hair & Allergy Treatment", "experience" => "8+ Years"],
    ["id" => 5, "name" => "Dr. Vivek Joshi", "department" => "Pediatrics", "specialization" => "Child Health & Vaccination", "experience" => "9+ Years"],
    ["id" => 6, "name" => "Dr. Sneha Kulkarni", "department" => "Gynecology", "specialization" => "Women's Health & Pregnancy Care", "experience" => "11+ Years"]
];

$doctors = [];
if ($conn && !$conn->connect_error) {
    $res = @$conn->query("SELECT id, name, department, specialization, experience FROM doctors ORDER BY id ASC");
    if ($res && $res->num_rows > 0) {
        while ($row = $res->fetch_assoc()) {
            $doctors[] = [
                "id" => (int)$row['id'],
                "name" => $row['name'],
                "department" => $row['department'],
                "specialization" => $row['specialization'],
                "experience" => $row['experience']
            ];
        }
    }
}

if (empty($doctors)) {
    $doctors = $fallbackDoctors;
}

http_response_code(200);
echo json_encode([
    "success" => true,
    "doctors" => $doctors
]);
?>
