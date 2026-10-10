# City Hospital - PowerShell Startup Script
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    CITY HOSPITAL APPOINTMENT SYSTEM - STARTUP    " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Test Database
Write-Host "[1/2] Verifying Database Connection..." -ForegroundColor Yellow
php test_db.php
Write-Host ""

# 2. Display URLs
Write-Host "[2/2] Access URLs:" -ForegroundColor Yellow
Write-Host " - XAMPP / Apache: " -NoNewline; Write-Host "http://localhost/HospitalAppointmentSystem/" -ForegroundColor Green
Write-Host " - PHP Server:     " -NoNewline; Write-Host "http://127.0.0.1:8000/" -ForegroundColor Green
Write-Host " - phpMyAdmin:     " -NoNewline; Write-Host "http://localhost/phpmyadmin/" -ForegroundColor Green
Write-Host ""
Write-Host "Launching default browser and starting server on http://127.0.0.1:8000..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost/HospitalAppointmentSystem/"
php -S 127.0.0.1:8000
