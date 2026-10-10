// Hospital Appointment System - Frontend Integration Script

document.addEventListener("DOMContentLoaded", function () {
    initAuthNav();
    initAppointmentPage();
    initRegisterPage();
    initLoginPage();
});

/**
 * Handles authentication state in navigation across all pages
 */
function initAuthNav() {
    const currentUserJson = localStorage.getItem("currentUser");
    let currentUser = null;

    if (currentUserJson) {
        try {
            currentUser = JSON.parse(currentUserJson);
        } catch (e) {
            localStorage.removeItem("currentUser");
        }
    }

    const navRegister = document.getElementById("navRegister");
    const navLogin = document.getElementById("navLogin");
    const navUser = document.getElementById("navUser");
    const userNameBadge = document.getElementById("userNameBadge");
    const logoutBtn = document.getElementById("logoutBtn");

    if (currentUser && currentUser.fullName) {
        if (navRegister) navRegister.style.display = "none";
        if (navLogin) navLogin.style.display = "none";
        if (navUser) {
            navUser.style.display = "inline-flex";
            navUser.style.alignItems = "center";
        }
        if (userNameBadge) {
            userNameBadge.textContent = "👤 " + currentUser.fullName.split(" ")[0];
        }
    } else {
        if (navRegister) navRegister.style.display = "";
        if (navLogin) navLogin.style.display = "";
        if (navUser) navUser.style.display = "none";
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            fetch("api/logout.php", { method: "POST" })
                .catch(function () {})
                .finally(function () {
                    localStorage.removeItem("currentUser");
                    window.location.href = "login.html";
                });
        });
    }
}

/**
 * Initializes the appointment booking page
 */
function initAppointmentPage() {
    const appointmentForm = document.getElementById("appointmentForm");
    if (!appointmentForm) return;

    const result = document.getElementById("result");
    const dateInput = document.getElementById("appointmentDate");
    const nameInput = document.getElementById("patientName");
    const emailInput = document.getElementById("patientEmail");
    const mobileInput = document.getElementById("patientMobile");
    const deptSelect = document.getElementById("department");
    const docSelect = document.getElementById("doctor");
    const bookSubmitBtn = document.getElementById("bookSubmitBtn");

    // Set minimum appointment date to today
    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        dateInput.min = `${year}-${month}-${day}`;
    }

    // Auto-fill logged-in user information
    const currentUserJson = localStorage.getItem("currentUser");
    let currentUser = null;
    if (currentUserJson) {
        try {
            currentUser = JSON.parse(currentUserJson);
            if (nameInput && !nameInput.value) nameInput.value = currentUser.fullName || "";
            if (emailInput && !emailInput.value) emailInput.value = currentUser.email || "";
            if (mobileInput && !mobileInput.value) mobileInput.value = currentUser.mobile || "";
        } catch (e) {}
    }

    // Parse URL parameters (e.g. ?doctor=Dr.+Raj+Sharma&department=Cardiology)
    const urlParams = new URLSearchParams(window.location.search);
    const doctorParam = urlParams.get("doctor");
    const deptParam = urlParams.get("department");

    if (deptParam && deptSelect) {
        for (let i = 0; i < deptSelect.options.length; i++) {
            if (deptSelect.options[i].value.toLowerCase() === deptParam.toLowerCase()) {
                deptSelect.selectedIndex = i;
                break;
            }
        }
    }

    if (doctorParam && docSelect) {
        for (let i = 0; i < docSelect.options.length; i++) {
            if (docSelect.options[i].value.toLowerCase().includes(doctorParam.toLowerCase()) ||
                doctorParam.toLowerCase().includes(docSelect.options[i].value.toLowerCase())) {
                docSelect.selectedIndex = i;
                break;
            }
        }
    }

    // Load existing appointments
    loadAppointments();

    // Handle Appointment Form Submission
    appointmentForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const appointmentData = {
            patientName: nameInput ? nameInput.value.trim() : "",
            email: emailInput ? emailInput.value.trim() : "",
            mobile: mobileInput ? mobileInput.value.trim() : "",
            department: deptSelect ? deptSelect.value : "",
            doctor: docSelect ? docSelect.value : "",
            date: dateInput ? dateInput.value : "",
            time: document.getElementById("appointmentTime") ? document.getElementById("appointmentTime").value : "",
            symptoms: document.getElementById("symptoms") ? document.getElementById("symptoms").value.trim() : "",
            userId: currentUser ? currentUser.id : null
        };

        if (!appointmentData.patientName || !appointmentData.email || !appointmentData.mobile ||
            !appointmentData.department || !appointmentData.doctor || !appointmentData.date || !appointmentData.time) {
            showMessage(result, "Please fill in all required fields.", "red");
            return;
        }

        if (!/^[0-9]{10}$/.test(appointmentData.mobile)) {
            showMessage(result, "Please enter a valid 10-digit mobile number.", "red");
            return;
        }

        if (bookSubmitBtn) {
            bookSubmitBtn.disabled = true;
            bookSubmitBtn.textContent = "Booking...";
        }

        try {
            const response = await fetch("api/book_appointment.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(appointmentData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showMessage(result, `✅ ${data.message} (Appointment #${data.appointment ? data.appointment.id : ''})`, "green");
                appointmentForm.reset();
                if (currentUser) {
                    if (nameInput) nameInput.value = currentUser.fullName || "";
                    if (emailInput) emailInput.value = currentUser.email || "";
                    if (mobileInput) mobileInput.value = currentUser.mobile || "";
                }
                loadAppointments();
            } else {
                showMessage(result, `❌ ${data.message || "Failed to book appointment."}`, "red");
            }
        } catch (error) {
            showMessage(result, "❌ Server connection error. Please verify backend is running.", "red");
        } finally {
            if (bookSubmitBtn) {
                bookSubmitBtn.disabled = false;
                bookSubmitBtn.textContent = "Confirm Appointment";
            }
        }
    });
}

/**
 * Loads appointments list from backend
 */
async function loadAppointments() {
    const listContainer = document.getElementById("appointmentsList");
    if (!listContainer) return;

    try {
        const currentUserJson = localStorage.getItem("currentUser");
        let url = "api/get_appointments.php";
        if (currentUserJson) {
            try {
                const user = JSON.parse(currentUserJson);
                if (user && user.email) {
                    url += "?email=" + encodeURIComponent(user.email);
                }
            } catch (e) {}
        }

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.success && Array.isArray(data.appointments)) {
            if (data.appointments.length === 0) {
                listContainer.innerHTML = `<p style="text-align: center; color: #777; padding: 15px;">No appointments found.</p>`;
                return;
            }

            let html = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #0d6efd; color: white; text-align: left;">
                            <th style="padding: 10px; border: 1px solid #ddd;">#</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Patient</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Doctor</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Department</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Date</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Time</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.appointments.forEach(function (apt, idx) {
                const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8f9fa";
                html += `
                    <tr style="background-color: ${rowBg};">
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${apt.id}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(apt.patientName)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(apt.doctor)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(apt.department)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(apt.date)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(apt.time)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;"><span style="background-color: #d1e7dd; color: #0f5132; padding: 3px 8px; border-radius: 4px; font-weight: bold;">${escapeHtml(apt.status || 'Confirmed')}</span></td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            listContainer.innerHTML = html;
        } else {
            listContainer.innerHTML = `<p style="text-align: center; color: #888;">Unable to load appointments at this time.</p>`;
        }
    } catch (err) {
        listContainer.innerHTML = `<p style="text-align: center; color: #888;">Appointments list unavailable (backend offline).</p>`;
    }
}

/**
 * Initializes Patient Registration form
 */
function initRegisterPage() {
    const registerForm = document.getElementById("registerForm");
    if (!registerForm) return;

    const result = document.getElementById("regResult");
    const submitBtn = document.getElementById("regSubmitBtn");

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const fullName = document.getElementById("regFullName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const mobile = document.getElementById("regMobile").value.trim();
        const age = document.getElementById("regAge").value.trim();
        const gender = document.getElementById("regGender").value;
        const password = document.getElementById("regPassword").value;
        const confirmPassword = document.getElementById("regConfirmPassword").value;

        if (!fullName || !email || !mobile || !age || !gender || !password) {
            showMessage(result, "Please fill in all required fields.", "red");
            return;
        }

        if (!/^[0-9]{10}$/.test(mobile)) {
            showMessage(result, "Please enter a valid 10-digit mobile number.", "red");
            return;
        }

        if (parseInt(age, 10) < 1 || parseInt(age, 10) > 120) {
            showMessage(result, "Please enter a valid age between 1 and 120.", "red");
            return;
        }

        if (password.length < 6) {
            showMessage(result, "Password must be at least 6 characters long.", "red");
            return;
        }

        if (password !== confirmPassword) {
            showMessage(result, "Passwords do not match.", "red");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Registering...";
        }

        try {
            const response = await fetch("api/register.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: fullName,
                    email: email,
                    mobile: mobile,
                    age: parseInt(age, 10),
                    gender: gender,
                    password: password,
                    confirmPassword: confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showMessage(result, `✅ ${data.message}`, "green");
                registerForm.reset();
                setTimeout(function () {
                    window.location.href = "login.html";
                }, 1500);
            } else {
                showMessage(result, `❌ ${data.message || "Registration failed."}`, "red");
            }
        } catch (error) {
            showMessage(result, "❌ Server connection error. Please verify backend is running.", "red");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Register";
            }
        }
    });
}

/**
 * Initializes Patient Login form
 */
function initLoginPage() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    const result = document.getElementById("loginResult");
    const submitBtn = document.getElementById("loginSubmitBtn");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || !password) {
            showMessage(result, "Please enter both email and password.", "red");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Logging in...";
        }

        try {
            const response = await fetch("api/login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, password: password })
            });

            const data = await response.json();

            if (response.ok && data.success && data.user) {
                localStorage.setItem("currentUser", JSON.stringify(data.user));
                showMessage(result, `✅ ${data.message}`, "green");
                setTimeout(function () {
                    window.location.href = "appointment.html";
                }, 1000);
            } else {
                showMessage(result, `❌ ${data.message || "Invalid credentials."}`, "red");
            }
        } catch (error) {
            showMessage(result, "❌ Server connection error. Please verify backend is running.", "red");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Login";
            }
        }
    });
}

/**
 * Utility function to display messages
 */
function showMessage(element, text, color) {
    if (!element) {
        alert(text);
        return;
    }
    element.textContent = text;
    element.style.color = color;
    element.style.display = "block";
}

/**
 * Utility function to escape HTML special characters
 */
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
