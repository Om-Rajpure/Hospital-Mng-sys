// Hospital Appointment System - Interactive Frontend & Administration Script

document.addEventListener("DOMContentLoaded", function () {
    initAuthNav();
    initNavbarEffects();
    initScrollAnimations();
    initFaqAccordion();
    initBackToTop();
    initStatsCounter();
    initAppointmentPage();
    initRegisterPage();
    initLoginPage();
    initAdminDashboard();
});

/**
 * Handles sticky navbar styling and mobile navigation toggle
 */
function initNavbarEffects() {
    const nav = document.getElementById("mainNav") || document.querySelector("nav");
    const mobileToggle = document.getElementById("mobileToggle");
    const navLinksContainer = document.getElementById("navLinksContainer");

    // Scroll effect
    window.addEventListener("scroll", function () {
        if (!nav) return;
        if (window.scrollY > 30) {
            nav.classList.add("scrolled");
        } else {
            nav.classList.remove("scrolled");
        }
    });

    // Mobile menu toggle
    if (mobileToggle && navLinksContainer) {
        mobileToggle.addEventListener("click", function () {
            navLinksContainer.classList.toggle("open");
        });

        navLinksContainer.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navLinksContainer.classList.remove("open");
            });
        });
    }
}

/**
 * Scroll Reveal Animations via IntersectionObserver
 */
function initScrollAnimations() {
    const revealElements = document.querySelectorAll(".reveal");
    if (!revealElements.length) return;

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            function (entries, observerInstance) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("active");
                        observerInstance.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        revealElements.forEach(function (el) {
            observer.observe(el);
        });
    } else {
        revealElements.forEach(function (el) {
            el.classList.add("active");
        });
    }
}

/**
 * Interactive FAQ Accordion
 */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(function (item) {
        const question = item.querySelector(".faq-question");
        if (question) {
            question.addEventListener("click", function () {
                const isActive = item.classList.contains("active");
                faqItems.forEach(function (otherItem) {
                    otherItem.classList.remove("active");
                });
                if (!isActive) {
                    item.classList.add("active");
                }
            });
        }
    });
}

/**
 * Back to Top button
 */
function initBackToTop() {
    const backBtn = document.getElementById("backToTop");
    if (!backBtn) return;

    backBtn.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

/**
 * Animated number counter for stats
 */
function initStatsCounter() {
    const statNumbers = document.querySelectorAll(".stat-number[data-target]");
    if (!statNumbers.length) return;

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            function (entries, observerInstance) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        const target = parseInt(entry.target.getAttribute("data-target"), 10);
                        if (!isNaN(target)) {
                            animateValue(entry.target, 0, target, 1500);
                        }
                        observerInstance.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        statNumbers.forEach(function (num) {
            observer.observe(num);
        });
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const isK = end >= 1000;
    const step = function (timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = Math.floor(progress * (end - start) + start);
        if (isK) {
            obj.textContent = currentVal.toLocaleString() + "+";
        } else if (end === 99) {
            obj.textContent = (currentVal + 0.8) + "%";
        } else {
            obj.textContent = currentVal + "+";
        }
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

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
    const navAdmin = document.getElementById("navAdmin");
    const navAdminItem = document.getElementById("navAdminItem");
    const userNameBadge = document.getElementById("userNameBadge");
    const logoutBtn = document.getElementById("logoutBtn");

    if (currentUser && (currentUser.fullName || currentUser.username)) {
        if (navRegister) navRegister.style.display = "none";
        if (navLogin) navLogin.style.display = "none";
        if (navUser) {
            navUser.style.display = "inline-flex";
            navUser.style.alignItems = "center";
        }
        
        const isUserAdmin = currentUser.role === "admin";
        
        if (userNameBadge) {
            if (isUserAdmin) {
                userNameBadge.textContent = "🛡️ Admin (" + (currentUser.username || "admin") + ")";
            } else {
                userNameBadge.textContent = "👤 " + (currentUser.fullName ? currentUser.fullName.split(" ")[0] : "Patient");
            }
        }

        // Show Admin button if user is an administrator
        if (navAdmin) {
            navAdmin.style.display = isUserAdmin ? "inline-block" : "none";
        }
        if (navAdminItem) {
            navAdminItem.style.display = isUserAdmin ? "inline-block" : "none";
        }
    } else {
        if (navRegister) navRegister.style.display = "";
        if (navLogin) navLogin.style.display = "";
        if (navUser) navUser.style.display = "none";
        if (navAdmin) navAdmin.style.display = "none";
        if (navAdminItem) navAdminItem.style.display = "none";
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

    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        dateInput.min = `${year}-${month}-${day}`;
    }

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

    loadAppointments();

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
                listContainer.innerHTML = `<p style="text-align: center; color: #777; padding: 15px;">No appointments booked yet.</p>`;
                return;
            }

            let html = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                    <thead>
                        <tr style="background: var(--primary); color: white; text-align: left;">
                            <th style="padding: 12px; border: 1px solid #ddd;">#</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Patient</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Doctor</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Department</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Date</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Time</th>
                            <th style="padding: 12px; border: 1px solid #ddd;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.appointments.forEach(function (apt, idx) {
                const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
                const statusClass = (apt.status || "confirmed").toLowerCase();
                html += `
                    <tr style="background-color: ${rowBg};">
                        <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${apt.id}</td>
                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${escapeHtml(apt.patientName)}</td>
                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${escapeHtml(apt.doctor)}</td>
                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${escapeHtml(apt.department)}</td>
                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${escapeHtml(apt.date)}</td>
                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${escapeHtml(apt.time)}</td>
                        <td style="padding: 10px; border: 1px solid #e2e8f0;"><span class="status-badge ${statusClass}">${escapeHtml(apt.status || 'Confirmed')}</span></td>
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
 * Initializes Login form with support for username/email and role redirect
 */
function initLoginPage() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    const result = document.getElementById("loginResult");
    const submitBtn = document.getElementById("loginSubmitBtn");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailInput = document.getElementById("loginEmail");
        const identifier = emailInput ? emailInput.value.trim() : "";
        const password = document.getElementById("loginPassword").value;

        if (!identifier || !password) {
            showMessage(result, "Please enter both username/email and password.", "red");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Signing in...";
        }

        try {
            const response = await fetch("api/login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: identifier, password: password })
            });

            const data = await response.json();

            if (response.ok && data.success && data.user) {
                localStorage.setItem("currentUser", JSON.stringify(data.user));
                showMessage(result, `✅ ${data.message}`, "green");
                
                setTimeout(function () {
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get("redirect");
                    if (redirect) {
                        window.location.href = redirect;
                    } else if (data.user.role === "admin") {
                        window.location.href = "admin.html";
                    } else {
                        window.location.href = "appointment.html";
                    }
                }, 1000);
            } else {
                showMessage(result, `❌ ${data.message || "Invalid credentials."}`, "red");
            }
        } catch (error) {
            showMessage(result, "❌ Server connection error. Please verify backend is running.", "red");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Sign In";
            }
        }
    });
}

// =========================================================================
// ==================== ADMIN DASHBOARD IMPLEMENTATION =====================
// =========================================================================

let globalDoctorsList = [];

/**
 * Initializes the Admin Dashboard if present on the current page
 */
function initAdminDashboard() {
    const overviewPane = document.getElementById("tabOverview");
    if (!overviewPane) return;

    // Server-side authentication guard check
    fetch("api/check_auth.php")
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data.authenticated || !data.user || data.user.role !== "admin") {
                alert("🔒 Access Denied: You must be logged in with an Administrator account.");
                window.location.href = "login.html?redirect=admin.html";
                return;
            }

            // Valid administrator verified
            setupAdminTabs();
            loadAdminStats();
            loadAdminAppointments();
            loadAdminDoctors();
            loadAdminPatients();
            setupAdminModalsAndForms();

            const btnRefresh = document.getElementById("btnRefreshStats");
            if (btnRefresh) {
                btnRefresh.addEventListener("click", function () {
                    loadAdminStats();
                    loadAdminAppointments();
                    loadAdminDoctors();
                    loadAdminPatients();
                    showAdminToast("System data refreshed successfully.", "success");
                });
            }
        })
        .catch(function () {
            window.location.href = "login.html?redirect=admin.html";
        });
}

/**
 * Tab Navigation in Admin Dashboard
 */
function setupAdminTabs() {
    const tabBtns = document.querySelectorAll(".admin-tab-btn");
    tabBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const tabId = btn.getAttribute("data-tab");
            switchAdminTab(tabId);
        });
    });
}

function switchAdminTab(tabId) {
    document.querySelectorAll(".admin-tab-btn").forEach(function (b) {
        b.classList.remove("active");
        if (b.getAttribute("data-tab") === tabId) b.classList.add("active");
    });

    document.querySelectorAll(".admin-tab-pane").forEach(function (pane) {
        pane.classList.remove("active");
    });

    const targetPane = document.getElementById(tabId);
    if (targetPane) {
        targetPane.classList.add("active");
    }
}

/**
 * Fetches and displays real database metrics and analytics
 */
async function loadAdminStats() {
    try {
        const response = await fetch("api/admin_stats.php");
        const data = await response.json();

        if (response.ok && data.success && data.summary) {
            const s = data.summary;
            document.getElementById("statTotalPatients").textContent = s.totalPatients;
            document.getElementById("statTotalDoctors").textContent = s.totalDoctors;
            document.getElementById("statTotalAppointments").textContent = s.totalAppointments;
            document.getElementById("statPendingAppointments").textContent = s.pendingAppointments;
            document.getElementById("statConfirmedAppointments").textContent = s.confirmedAppointments;
            document.getElementById("statCompletedAppointments").textContent = s.completedAppointments;

            // Render Department breakdown chart
            renderDepartmentChart(data.departments, s.totalAppointments);

            // Render Status breakdown chart
            renderStatusChart(data.statusDistribution, s.totalAppointments);

            // Render Recent Bookings Table
            renderRecentAppointmentsTable(data.recentAppointments);

            // Render Recent Patients Table
            renderRecentPatientsTable(data.recentPatients);
        }
    } catch (err) {
        console.error("Failed to load admin stats:", err);
    }
}

function renderDepartmentChart(departments, total) {
    const container = document.getElementById("deptChartContainer");
    if (!container) return;

    if (!departments || departments.length === 0) {
        container.innerHTML = `<p style="color:var(--gray-600); text-align:center; padding:15px;">No department appointments recorded yet.</p>`;
        return;
    }

    let html = "";
    departments.forEach(function (d) {
        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
        html += `
            <div class="chart-bar-item">
                <div class="chart-bar-labels">
                    <span>${escapeHtml(d.department)}</span>
                    <span>${d.count} visits (${pct}%)</span>
                </div>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width: ${pct}%; background: var(--primary-gradient);"></div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderStatusChart(statuses, total) {
    const container = document.getElementById("statusChartContainer");
    if (!container) return;

    const colors = {
        "Confirmed": "#10b981",
        "Pending": "#f59e0b",
        "Completed": "#0284c7",
        "Cancelled": "#ef4444"
    };

    let html = "";
    Object.keys(statuses).forEach(function (status) {
        const count = statuses[status];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = colors[status] || "#64748b";
        html += `
            <div class="chart-bar-item">
                <div class="chart-bar-labels">
                    <span style="font-weight:700;">${status}</span>
                    <span>${count} (${pct}%)</span>
                </div>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width: ${pct}%; background: ${color};"></div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderRecentAppointmentsTable(list) {
    const tbody = document.getElementById("recentAppointmentsTable");
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--gray-600);">No appointments recorded.</td></tr>`;
        return;
    }

    let html = "";
    list.forEach(function (apt) {
        const statusClass = (apt.status || "confirmed").toLowerCase();
        html += `
            <tr>
                <td style="font-weight:bold;">#${apt.id}</td>
                <td>${escapeHtml(apt.patientName)}</td>
                <td>${escapeHtml(apt.doctor)}</td>
                <td>${escapeHtml(apt.date)} <span style="color:var(--gray-600); font-size:12px;">${escapeHtml(apt.time)}</span></td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(apt.status)}</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function renderRecentPatientsTable(list) {
    const tbody = document.getElementById("recentPatientsTable");
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--gray-600);">No patients registered.</td></tr>`;
        return;
    }

    let html = "";
    list.forEach(function (p) {
        html += `
            <tr>
                <td style="font-weight:bold;">${escapeHtml(p.fullName)}</td>
                <td>${escapeHtml(p.email)}<br><span style="color:var(--gray-600); font-size:12px;">${escapeHtml(p.mobile)}</span></td>
                <td>${escapeHtml(p.createdAt ? p.createdAt.split(" ")[0] : "Recent")}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

/**
 * Appointments Manager: fetch, filter, status change, delete
 */
async function loadAdminAppointments() {
    const tbody = document.getElementById("adminAppointmentsTbody");
    if (!tbody) return;

    const search = document.getElementById("aptSearchInput") ? document.getElementById("aptSearchInput").value.trim() : "";
    const status = document.getElementById("aptStatusFilter") ? document.getElementById("aptStatusFilter").value : "All";
    const dept = document.getElementById("aptDeptFilter") ? document.getElementById("aptDeptFilter").value : "All";

    let url = `api/admin_appointments.php?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&department=${encodeURIComponent(dept)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.appointments)) {
            if (data.appointments.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--gray-600);">No matching appointments found.</td></tr>`;
                return;
            }

            let html = "";
            data.appointments.forEach(function (apt) {
                const statusClass = (apt.status || "confirmed").toLowerCase();
                html += `
                    <tr>
                        <td style="font-weight:bold;">#${apt.id}</td>
                        <td>
                            <b>${escapeHtml(apt.patientName)}</b>
                            <div style="font-size:12px; color:var(--gray-600);">${escapeHtml(apt.email)}</div>
                        </td>
                        <td>${escapeHtml(apt.mobile)}</td>
                        <td><span style="font-weight:600;">${escapeHtml(apt.department)}</span></td>
                        <td>${escapeHtml(apt.doctor)}</td>
                        <td>
                            <b>${escapeHtml(apt.date)}</b>
                            <div style="font-size:12px; color:var(--gray-600);">${escapeHtml(apt.time)}</div>
                        </td>
                        <td>
                            <select onchange="updateAppointmentStatus(${apt.id}, this.value)" class="admin-filter-select" style="padding:6px 10px; font-size:12px;">
                                <option value="Pending" ${apt.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Confirmed" ${apt.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="Completed" ${apt.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                <option value="Cancelled" ${apt.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                        <td>
                            <div class="action-btn-group">
                                <button class="btn-table-action btn-table-edit" onclick='openEditAppointmentModal(${JSON.stringify(apt)})'>✏️ Edit</button>
                                <button class="btn-table-action btn-table-delete" onclick="deleteAppointment(${apt.id})">🗑️ Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Failed to load appointments.</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Server error connecting to appointments API.</td></tr>`;
    }
}

/**
 * Quick status update on appointment
 */
async function updateAppointmentStatus(aptId, newStatus) {
    try {
        const response = await fetch("api/admin_appointments.php", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: aptId, status: newStatus })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showAdminToast(data.message, "success");
            loadAdminStats();
        } else {
            showAdminToast(data.message || "Failed to update status", "error");
            loadAdminAppointments();
        }
    } catch (e) {
        showAdminToast("Connection error updating status.", "error");
    }
}

/**
 * Delete appointment
 */
async function deleteAppointment(aptId) {
    if (!confirm(`Are you sure you want to delete Appointment #${aptId}? This action cannot be undone.`)) {
        return;
    }

    try {
        const res = await fetch(`api/admin_appointments.php?id=${aptId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
            showAdminToast(data.message, "success");
            loadAdminAppointments();
            loadAdminStats();
        } else {
            showAdminToast(data.message || "Failed to delete appointment.", "error");
        }
    } catch (e) {
        showAdminToast("Error deleting appointment.", "error");
    }
}

/**
 * Doctors Directory: fetch, search, add, edit, delete
 */
async function loadAdminDoctors() {
    const tbody = document.getElementById("adminDoctorsTbody");
    if (!tbody) return;

    const search = document.getElementById("docSearchInput") ? document.getElementById("docSearchInput").value.trim() : "";
    const url = `api/admin_doctors.php?search=${encodeURIComponent(search)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.doctors)) {
            globalDoctorsList = data.doctors;
            populateDoctorSelectOptions(data.doctors);

            if (data.doctors.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--gray-600);">No doctors found.</td></tr>`;
                return;
            }

            let html = "";
            data.doctors.forEach(function (doc) {
                html += `
                    <tr>
                        <td style="font-weight:bold;">#${doc.id}</td>
                        <td><b>${escapeHtml(doc.name)}</b></td>
                        <td><span style="color:var(--primary); font-weight:700;">${escapeHtml(doc.department)}</span></td>
                        <td>${escapeHtml(doc.specialization)}</td>
                        <td>${escapeHtml(doc.experience)}</td>
                        <td>
                            <div class="action-btn-group">
                                <button class="btn-table-action btn-table-edit" onclick='openEditDoctorModal(${JSON.stringify(doc)})'>✏️ Edit</button>
                                <button class="btn-table-action btn-table-delete" onclick="deleteDoctor(${doc.id}, '${escapeHtml(doc.name)}')">🗑️ Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Failed to load doctors.</td></tr>`;
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Server error connecting to doctors API.</td></tr>`;
    }
}

function populateDoctorSelectOptions(doctors) {
    const aptDocSelect = document.getElementById("aptFormDoctor");
    if (!aptDocSelect) return;

    aptDocSelect.innerHTML = `<option value="">Select Doctor</option>`;
    doctors.forEach(function (doc) {
        aptDocSelect.innerHTML += `<option value="${escapeHtml(doc.name)}">${escapeHtml(doc.name)} (${escapeHtml(doc.department)})</option>`;
    });
}

async function deleteDoctor(docId, docName) {
    if (!confirm(`Are you sure you want to remove Dr. ${docName} from the specialist directory?`)) {
        return;
    }

    try {
        const res = await fetch(`api/admin_doctors.php?id=${docId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
            showAdminToast(data.message, "success");
            loadAdminDoctors();
            loadAdminStats();
        } else {
            showAdminToast(data.message || "Failed to delete doctor.", "error");
        }
    } catch (e) {
        showAdminToast("Connection error deleting doctor.", "error");
    }
}

/**
 * Patients Registry: fetch, search, add, edit, delete
 */
async function loadAdminPatients() {
    const tbody = document.getElementById("adminPatientsTbody");
    if (!tbody) return;

    const search = document.getElementById("patientSearchInput") ? document.getElementById("patientSearchInput").value.trim() : "";
    const url = `api/admin_patients.php?search=${encodeURIComponent(search)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.patients)) {
            if (data.patients.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--gray-600);">No registered patients found.</td></tr>`;
                return;
            }

            let html = "";
            data.patients.forEach(function (p) {
                html += `
                    <tr>
                        <td style="font-weight:bold;">#${p.id}</td>
                        <td><b>${escapeHtml(p.fullName)}</b></td>
                        <td>${escapeHtml(p.email)}</td>
                        <td>${escapeHtml(p.mobile)}</td>
                        <td>${p.age} yrs / ${escapeHtml(p.gender)}</td>
                        <td><span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:9999px; font-weight:700; font-size:12px;">${p.totalAppointments} visits</span></td>
                        <td>${escapeHtml(p.createdAt ? p.createdAt.split(" ")[0] : "N/A")}</td>
                        <td>
                            <div class="action-btn-group">
                                <button class="btn-table-action btn-table-edit" onclick='openEditPatientModal(${JSON.stringify(p)})'>✏️ Edit</button>
                                <button class="btn-table-action btn-table-delete" onclick="deletePatient(${p.id}, '${escapeHtml(p.fullName)}')">🗑️ Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Failed to load patients.</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Server error connecting to patients API.</td></tr>`;
    }
}

async function deletePatient(patientId, patientName) {
    if (!confirm(`Are you sure you want to delete patient '${patientName}' (#${patientId})?`)) {
        return;
    }

    try {
        const res = await fetch(`api/admin_patients.php?id=${patientId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
            showAdminToast(data.message, "success");
            loadAdminPatients();
            loadAdminStats();
        } else {
            showAdminToast(data.message || "Failed to delete patient.", "error");
        }
    } catch (e) {
        showAdminToast("Connection error deleting patient.", "error");
    }
}

/**
 * Modals and Form Submissions setup
 */
function setupAdminModalsAndForms() {
    // 1. Doctor Modal
    const btnOpenAddDoc = document.getElementById("btnOpenAddDoctorModal");
    if (btnOpenAddDoc) {
        btnOpenAddDoc.addEventListener("click", function () {
            document.getElementById("docFormId").value = "";
            document.getElementById("docFormName").value = "";
            document.getElementById("docFormDept").selectedIndex = 0;
            document.getElementById("docFormSpec").value = "";
            document.getElementById("docFormExp").value = "";
            document.getElementById("doctorModalTitle").textContent = "Add Specialist Doctor";
            openModal("doctorModal");
        });
    }

    const doctorForm = document.getElementById("doctorForm");
    if (doctorForm) {
        doctorForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const id = document.getElementById("docFormId").value;
            const payload = {
                id: id ? parseInt(id, 10) : undefined,
                name: document.getElementById("docFormName").value.trim(),
                department: document.getElementById("docFormDept").value,
                specialization: document.getElementById("docFormSpec").value.trim(),
                experience: document.getElementById("docFormExp").value.trim()
            };

            const method = id ? "PUT" : "POST";
            try {
                const res = await fetch("api/admin_doctors.php", {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    showAdminToast(data.message, "success");
                    closeModal("doctorModal");
                    loadAdminDoctors();
                    loadAdminStats();
                } else {
                    showAdminToast(data.message || "Error saving doctor", "error");
                }
            } catch (err) {
                showAdminToast("Server error saving doctor", "error");
            }
        });
    }

    // 2. Appointment Modal
    const btnOpenNewApt = document.getElementById("btnOpenNewAptModal");
    if (btnOpenNewApt) {
        btnOpenNewApt.addEventListener("click", function () {
            document.getElementById("aptFormId").value = "";
            document.getElementById("aptFormPatient").value = "";
            document.getElementById("aptFormEmail").value = "";
            document.getElementById("aptFormMobile").value = "";
            document.getElementById("aptFormDept").selectedIndex = 0;
            document.getElementById("aptFormDoctor").selectedIndex = 0;
            
            const today = new Date().toISOString().split("T")[0];
            document.getElementById("aptFormDate").value = today;
            document.getElementById("aptFormTime").value = "10:00";
            document.getElementById("aptFormStatus").value = "Confirmed";
            document.getElementById("aptFormSymptoms").value = "";
            document.getElementById("aptModalTitle").textContent = "Schedule New Appointment";
            openModal("appointmentModal");
        });
    }

    const adminAptForm = document.getElementById("adminAptForm");
    if (adminAptForm) {
        adminAptForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const id = document.getElementById("aptFormId").value;
            const payload = {
                id: id ? parseInt(id, 10) : undefined,
                patientName: document.getElementById("aptFormPatient").value.trim(),
                email: document.getElementById("aptFormEmail").value.trim(),
                mobile: document.getElementById("aptFormMobile").value.trim(),
                department: document.getElementById("aptFormDept").value,
                doctor: document.getElementById("aptFormDoctor").value,
                date: document.getElementById("aptFormDate").value,
                time: document.getElementById("aptFormTime").value,
                status: document.getElementById("aptFormStatus").value,
                symptoms: document.getElementById("aptFormSymptoms").value.trim()
            };

            const method = id ? "PUT" : "POST";
            try {
                const res = await fetch("api/admin_appointments.php", {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    showAdminToast(data.message, "success");
                    closeModal("appointmentModal");
                    loadAdminAppointments();
                    loadAdminStats();
                } else {
                    showAdminToast(data.message || "Error saving appointment", "error");
                }
            } catch (err) {
                showAdminToast("Server error saving appointment", "error");
            }
        });
    }

    // 3. Patient Modal
    const btnOpenAddPatient = document.getElementById("btnOpenAddPatientModal");
    if (btnOpenAddPatient) {
        btnOpenAddPatient.addEventListener("click", function () {
            document.getElementById("patientFormId").value = "";
            document.getElementById("patientFormName").value = "";
            document.getElementById("patientFormEmail").value = "";
            document.getElementById("patientFormMobile").value = "";
            document.getElementById("patientFormAge").value = "30";
            document.getElementById("patientFormGender").value = "Male";
            document.getElementById("patientModalTitle").textContent = "Register New Patient";
            openModal("patientModal");
        });
    }

    const adminPatientForm = document.getElementById("adminPatientForm");
    if (adminPatientForm) {
        adminPatientForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const id = document.getElementById("patientFormId").value;
            const payload = {
                id: id ? parseInt(id, 10) : undefined,
                fullName: document.getElementById("patientFormName").value.trim(),
                email: document.getElementById("patientFormEmail").value.trim(),
                mobile: document.getElementById("patientFormMobile").value.trim(),
                age: parseInt(document.getElementById("patientFormAge").value, 10),
                gender: document.getElementById("patientFormGender").value
            };

            const method = id ? "PUT" : "POST";
            try {
                const res = await fetch("api/admin_patients.php", {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    showAdminToast(data.message, "success");
                    closeModal("patientModal");
                    loadAdminPatients();
                    loadAdminStats();
                } else {
                    showAdminToast(data.message || "Error saving patient record", "error");
                }
            } catch (err) {
                showAdminToast("Server error saving patient", "error");
            }
        });
    }

    // Search and Filter Listeners
    const aptSearch = document.getElementById("aptSearchInput");
    if (aptSearch) aptSearch.addEventListener("input", debounce(loadAdminAppointments, 300));

    const aptStatus = document.getElementById("aptStatusFilter");
    if (aptStatus) aptStatus.addEventListener("change", loadAdminAppointments);

    const aptDept = document.getElementById("aptDeptFilter");
    if (aptDept) aptDept.addEventListener("change", loadAdminAppointments);

    const docSearch = document.getElementById("docSearchInput");
    if (docSearch) docSearch.addEventListener("input", debounce(loadAdminDoctors, 300));

    const patientSearch = document.getElementById("patientSearchInput");
    if (patientSearch) patientSearch.addEventListener("input", debounce(loadAdminPatients, 300));
}

function openEditDoctorModal(doc) {
    document.getElementById("docFormId").value = doc.id;
    document.getElementById("docFormName").value = doc.name;
    document.getElementById("docFormDept").value = doc.department;
    document.getElementById("docFormSpec").value = doc.specialization;
    document.getElementById("docFormExp").value = doc.experience;
    document.getElementById("doctorModalTitle").textContent = "Edit Doctor: " + doc.name;
    openModal("doctorModal");
}

function openEditAppointmentModal(apt) {
    document.getElementById("aptFormId").value = apt.id;
    document.getElementById("aptFormPatient").value = apt.patientName;
    document.getElementById("aptFormEmail").value = apt.email;
    document.getElementById("aptFormMobile").value = apt.mobile;
    document.getElementById("aptFormDept").value = apt.department;
    document.getElementById("aptFormDoctor").value = apt.doctor;
    document.getElementById("aptFormDate").value = apt.date;
    document.getElementById("aptFormTime").value = apt.time;
    document.getElementById("aptFormStatus").value = apt.status;
    document.getElementById("aptFormSymptoms").value = apt.symptoms || "";
    document.getElementById("aptModalTitle").textContent = "Edit Appointment #" + apt.id;
    openModal("appointmentModal");
}

function openEditPatientModal(p) {
    document.getElementById("patientFormId").value = p.id;
    document.getElementById("patientFormName").value = p.fullName;
    document.getElementById("patientFormEmail").value = p.email;
    document.getElementById("patientFormMobile").value = p.mobile;
    document.getElementById("patientFormAge").value = p.age;
    document.getElementById("patientFormGender").value = p.gender;
    document.getElementById("patientModalTitle").textContent = "Edit Patient #" + p.id;
    openModal("patientModal");
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("open");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("open");
}

function showAdminToast(message, type) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `admin-toast ${type || 'success'}`;
    toast.innerHTML = `<span>${type === 'error' ? '❌' : '✅'}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(function () {
        toast.style.opacity = "0";
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3500);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
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
