# 🏥 City Hospital - Management & Appointment System

A modern, responsive Hospital Appointment and Patient Management System built with native HTML5, CSS3, JavaScript (ES6+), PHP 8.x, and MySQL.

---

## 🚀 Quick Setup & Run (Works on Any Laptop)

### Option 1: Using XAMPP / WampServer / Laragon (Recommended for Beginners)

1. **Clone or Copy the Project**:
   Place this project folder inside your web server root:
   - **XAMPP**: `C:\xampp\htdocs\HospitalAppointmentSystem`
   - **Laragon**: `C:\laragon\www\HospitalAppointmentSystem`
   - **WampServer**: `C:\wamp64\www\HospitalAppointmentSystem`

2. **Start Services**:
   - Open the **XAMPP Control Panel** (or Laragon/Wamp).
   - Click **Start** for **Apache** and **MySQL**.

3. **Open the Application**:
   - Open your browser and navigate to:
     `http://localhost/HospitalAppointmentSystem/`

> **Note**: Database `hospital_db`, tables (`users`, `doctors`, `appointments`), and specialist doctor records are **automatically created on first visit**! No manual SQL import is needed.

---

### Option 2: Using PHP Built-In Web Server

1. **Start your local MySQL service** (e.g., via XAMPP MySQL or standalone MySQL).
2. **Open Terminal / PowerShell** inside this project folder:
   ```bash
   php -S 127.0.0.1:8000
   ```
3. **Open the Browser**:
   Navigate to `http://127.0.0.1:8000/`

---

## 🔑 Database Credentials & Configuration

Default settings in `db.php`:
| Parameter | Default Value | Notes |
| :--- | :--- | :--- |
| **Host** | `localhost` (auto-falls back to `127.0.0.1`) | Standard local MySQL host |
| **Port** | `3306` | Standard MySQL port |
| **User** | `root` | Default XAMPP/local user |
| **Password** | `""` (empty string) | Default XAMPP/local password |
| **Database** | `hospital_db` | Auto-created if it doesn't exist |

*If you use custom MySQL credentials, you can either set environment variables (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`) or edit `db.php`.*

---

## 🛠️ Verification & Health Checks

- **Database Test**: Visit `http://localhost/HospitalAppointmentSystem/test_db.php` or `http://127.0.0.1:8000/test_db.php`
- **API Health Check**: Visit `http://localhost/HospitalAppointmentSystem/api/health.php` or `http://127.0.0.1:8000/api/health.php`
- **Manual Database Schema (Optional)**: If you prefer manual import, run the queries in `schema.sql` inside phpMyAdmin or MySQL CLI.

---

## ✨ Features

- 📅 **Online Appointment Booking**: Select department, specialist doctor, date, and preferred time slot.
- 👨‍⚕️ **Specialist Doctors Directory**: Explore doctor profiles with specialties, experience, and direct booking links.
- 🔐 **Patient Registration & Login**: Secure account creation with bcrypt password hashing and session management.
- 📋 **Appointment History Dashboard**: View live booked appointments with confirmation status.
- 📱 **Fully Responsive UI**: Mobile navigation drawer, interactive FAQ accordion, and scroll reveal animations.
