-- Hospital Appointment System Database Schema
CREATE DATABASE IF NOT EXISTS hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

-- Patients / Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mobile VARCHAR(15) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(10) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Specialist Doctors
INSERT IGNORE INTO doctors (id, name, department, specialization, experience) VALUES
(1, 'Dr. Raj Sharma', 'Cardiology', 'Heart Diseases, ECG, BP Treatment', '15+ Years'),
(2, 'Dr. Amit Patil', 'Orthopedics', 'Bone Fracture, Joint Pain', '12+ Years'),
(3, 'Dr. Imran Khan', 'Neurology', 'Brain & Nerve Disorders', '10+ Years'),
(4, 'Dr. Priya Mehta', 'Dermatology', 'Skin, Hair & Allergy Treatment', '8+ Years'),
(5, 'Dr. Vivek Joshi', 'Pediatrics', 'Child Health & Vaccination', '9+ Years'),
(6, 'Dr. Sneha Kulkarni', 'Gynecology', 'Women\'s Health & Pregnancy Care', '11+ Years');
