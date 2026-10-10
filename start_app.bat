@echo off
TITLE City Hospital - Local Development Server
COLOR 0A
echo ===================================================
echo     CITY HOSPITAL APPOINTMENT SYSTEM - STARTUP
echo ===================================================
echo.

echo [1/3] Checking PHP installation...
php -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PHP is not found in your system PATH.
    echo Please install PHP or add C:\xampp\php to your PATH.
    pause
    exit /b 1
)
echo [OK] PHP detected.
echo.

echo [2/3] Checking Database connectivity...
php test_db.php
echo.

echo [3/3] Launching Local Application Server...
echo.
echo Application URLs:
echo  - Apache / XAMPP: http://localhost/HospitalAppointmentSystem/
echo  - PHP Server:     http://127.0.0.1:8000/
echo  - phpMyAdmin:     http://localhost/phpmyadmin/
echo.
echo Starting development server on http://127.0.0.1:8000 ...
echo Press Ctrl+C anytime to stop the server.
echo.

start "" "http://localhost/HospitalAppointmentSystem/"
php -S 127.0.0.1:8000
