(() => {
    "use strict";

    /* =========================================================
       CONFIGURATION
    ========================================================= */
    const CONFIG = {
        SESSION_KEY: "HT_SESSION",
        ATTEMPT_KEY: "HT_ATTEMPTS",
        MAX_ATTEMPTS: 5,
        LOCKOUT_MINUTES: 5,
        SESSION_TIMEOUT_MINUTES: 30
    };

    /* =========================================================
       USERS MOCK DATABASE
    ========================================================= */
    const USERS = [
        { username: "huokaingthara", password: "huokaingthara", role: "Cybersecurity", requires2FA: false },
        { username: "thorn", password: "thorn", role: "Customer", requires2FA: false },
        { username: "test", password: "test", role: "Test User", requires2FA: false },
        { username: "sansopheata", password: "sansopheata", role: "Chief Executive Officer", requires2FA: false },
        { username: "chansamnang", password: "chansamnang", role: "Customer", requires2FA: false },
        { username: "raem", password: "raem", role: "Customer", requires2FA: false },
        { username: "sengviseynea", password: "sengviseynea", role: "Chief Executive Officer", requires2FA: false },
        { username: "somsodavin", password: "somsodavin", role: "Chief Executive Officer", requires2FA: false },
        { username: "svaymetrey", password: "svaymetrey", role: "Chief Executive Officer", requires2FA: false },
        { username: "chornrothanak", password: "chornrothanak", role: "Chief Executive Officer", requires2FA: true },
        { username: "longlain", password: "longlain", role: "Chief Executive Officer", requires2FA: true },
        { username: "chumchanrothanak", password: "chumchanrothanak", role: "Chief Executive Officer", requires2FA: true },
        { username: "phaychanrothana", password: "phaychanrothana", role: "Chief Executive Officer", requires2FA: true },
        { username: "vanneat", password: "vanneat", role: "Customer", requires2FA: true },
        { username: "mengly", password: "mengly", role: "Customer", requires2FA: true },
        { username: "leyu", password: "leyu", role: "Customer", requires2FA: true },
        { username: "huy", password: "huy", role: "Customer", requires2FA: true },
        { username: "sengchhat", password: "sengchhat", role: "VIP Customer", requires2FA: true }
    ];

    /* =========================================================
       MOCK TRANSACTION SOURCE DATA
    ========================================================= */
    const MOCK_TRANSACTIONS = [
        { id: "TXN-90214", account: "Acc...8841 (Thorn)", type: "Bakong Transfer", amount: "$1,250.00", time: "16:31:02", status: "Success" },
        { id: "TXN-90215", account: "Acc...1092 (Vanneat)", type: "Interbank Pay", amount: "$320.50", time: "16:32:15", status: "Success" },
        { id: "TXN-90216", account: "Acc...4412 (Mengly)", type: "ATM Cash Deposit", amount: "$5,000.00", time: "16:34:00", status: "Success" },
        { id: "TXN-90217", account: "Acc...0029 (Leyu)", type: "Clearing Settlement", amount: "$12,450.00", time: "16:35:48", status: "Pending" }
    ];
   
    /* =========================================================
       UTILITIES & SESSION HANDLING
    ========================================================= */
    function log(message) {
        console.log(`[AUTH ${new Date().toLocaleTimeString()}] ${message}`);
    }

    function saveSession(session) {
        sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
    }

    function loadSession() {
        const raw = sessionStorage.getItem(CONFIG.SESSION_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    }

    function destroySession() {
        sessionStorage.removeItem(CONFIG.SESSION_KEY);
    }

    /* =========================================================
       LOCKOUT & RATE-LIMIT CONTROL
    ========================================================= */
    function getAttempts() {
        return JSON.parse(localStorage.getItem(CONFIG.ATTEMPT_KEY)) || { count: 0, lockUntil: null };
    }

    function saveAttempts(data) {
        localStorage.setItem(CONFIG.ATTEMPT_KEY, JSON.stringify(data));
    }

    function clearAttempts() {
        localStorage.removeItem(CONFIG.ATTEMPT_KEY);
    }

    function isLocked() {
        const data = getAttempts();
        if (!data.lockUntil) return false;
        if (Date.now() > data.lockUntil) {
            clearAttempts();
            return false;
        }
        return true;
    }

    /* =========================================================
       AUTHENTICATION LOGIC
    ========================================================= */
    async function handleLogin(username, password) {
        const msg = document.getElementById("loginMessage");
        if (msg) msg.textContent = "";

        if (!username || !password) {
            if (msg) msg.textContent = "Please enter username and password.";
            return;
        }

        if (isLocked()) {
            if (msg) msg.textContent = "Account temporarily locked.";
            return;
        }

        const user = USERS.find(u => u.username === username && u.password === password);

        if (!user) {
            const data = getAttempts();
            data.count++;
            if (data.count >= CONFIG.MAX_ATTEMPTS) {
                data.lockUntil = Date.now() + (CONFIG.LOCKOUT_MINUTES * 60000);
                saveAttempts(data);
                if (msg) msg.textContent = "Too many failed logins.";
                return;
            }
            saveAttempts(data);
            if (msg) msg.textContent = `Invalid credentials (${data.count}/${CONFIG.MAX_ATTEMPTS})`;
            return;
        }

        clearAttempts();
        finalizeLogin(user);
    }

    function finalizeLogin(user) {
        const session = {
            username: user.username,
            role: user.role,
            token: crypto.randomUUID()
        };
        saveSession(session);
        renderDashboard(session);
    }

    /* =========================================================
       DASHBOARD & VIEW CONTROLLER
    ========================================================= */
    function renderDashboard(session) {
        const login = document.getElementById("loginContainer");
        const dashboard = document.getElementById("summaryBox");

        if (login) login.style.display = "none";
        if (dashboard) dashboard.style.display = "block";

        updateAIStatus(session);
        renderDashboardCards();
        initializeDashboardData();
        renderTransactionLedger();
        renderPhaseList();
    }

    function initializeDashboardData() {
        log("Dashboard active. Injecting financial records into DOM nodes...");
        if (document.getElementById("accountCount")) {
            document.getElementById("accountCount").textContent = "15,000";
            document.getElementById("depositTotal").textContent = "$252,910,000";
            document.getElementById("txCount").textContent = "40,000";
        }
    }

    function updateAIStatus(session) {
        const bubble = document.getElementById("aiStatusBubble");
        if (!bubble) return;
        bubble.innerHTML = `AI CORE ONLINE • USER: ${session.username} • ROLE: ${session.role}`;
    }

    function renderDashboardCards() {
        const container = document.getElementById("searchContainer");
        if (!container) return;
        
        container.innerHTML = `
            <div class="dashboard-grid">
                
                <!-- Card 1: Total Accounts -->
                <div class="dashboard-card">
                    <img src="" alt="" class="card-icon" style="width:24px; height:24px; border:0;">
                    <h3 id="accountCount">--</h3>
                    <p>Total Accounts</p>
                    <a href="#" class="card-link">View Details</a>
                </div>

                <!-- Card 2: Total Deposits -->
                <div class="dashboard-card">
                    <img src="" alt="" class="card-icon" style="width:24px; height:24px; border:0;">
                    <h3 id="depositTotal">--</h3>
                    <p>Total Deposits</p>
                    <a href="#" class="card-link">View Details</a>
                </div>

                <!-- Card 3: Transaction Volumes -->
                <div class="dashboard-card">
                    <img src="" alt="" class="card-icon" style="width:24px; height:24px; border:0;">
                    <h3 id="txCount">--</h3>
                    <p>Transactions Processed</p>
                    <a href="#" class="card-link">View Log</a>
                </div>

                <!-- Card 4: System Phases -->
                <div class="dashboard-card">
                    <img src="" alt="" class="card-icon" style="width:24px; height:24px; border:0;">
                    <h3>18</h3>
                    <p>Total Phases</p>
                    <a href="#" class="card-link">View Phase Map</a>
                </div>

                <!-- Card 5: Financial Compliance -->
                <div class="dashboard-card">
                    <img src="" alt="" class="card-icon" style="width:24px; height:24px; border:0;">
                    <h3>ISO 20022</h3>
                    <p>Compliance Status</p>
                    <a href="#" class="card-link">View Documents</a>
                </div>

                <!-- Card 6: Interbank Network -->
                <div class="dashboard-card">
                    <img src="" alt="" class="card-icon" style="width:24px; height:24px; border:0;">
                    <h3>Bakong</h3>
                    <p>Connected Gateways</p>
                    <a href="#" class="card-link">Gateway Status</a>
                </div>

                <!-- Card 7: Security Architecture -->
                <div class="dashboard-card">
                    <img src="" alt="" class="card-icon" style="width:24px; height:24px; border:0;">
                    <h3>SOC</h3>
                    <p>Monitoring Nodes</p>
                    <a href="#" class="card-link">Live Alerts</a>
                </div>

                <!-- Card 8: Pending Clearings -->
                <div class="dashboard-card">
                    <img src="" alt="" class="card-icon" style="width:24px; height:24px; border:0;">
                    <h3>1</h3>
                    <p>Pending Clearings</p>
                    <a href="#" class="card-link">Clear Queue</a>
                </div>

                <!-- Card 9: Active Audits -->
                <div class="dashboard-card">
                    <img src="" alt="" class="card-icon" style="width:24px; height:24px; border:0;">
                    <h3>Passed</h3>
                    <p>System Audits</p>
                    <a href="#" class="card-link">Report Vault</a>
                </div>

                <!-- Card 10: AI Core Status -->
                <div class="dashboard-card">
                    <img src="" alt="" class="card-icon" style="width:24px; height:24px; border:0;">
                    <h3>Operational</h3>
                    <p>AI Core Systems</p>
                    <a href="#" class="card-link">Core Logs</a>
                </div>

            </div>
        `;
    }

    function renderTransactionLedger() {
        const tbody = document.getElementById("transactionLogBody");
        if (!tbody) return;

        tbody.innerHTML = MOCK_TRANSACTIONS.map(txn => `
            <tr>
                <td style="font-weight:600; color:#38bdf8;">${txn.id}</td>
                <td>${txn.account}</td>
                <td>${txn.type}</td>
                <td style="font-weight:600;">${txn.amount}</td>
                <td style="color:#9ca3af;">${txn.time}</td>
                <td>
                    <span class="status-badge ${txn.status.toLowerCase()}">${txn.status}</span>
                </td>
            </tr>
        `).join("");
    }

    function renderPhaseList() {
        const list = document.getElementById("phasesList");
        if (!list) return;

        // Custom Fallback mock logic if window.PhaseRegistry isn't ready
        const phases = (window.PhaseRegistry && typeof window.PhaseRegistry.getAll === "function") 
            ? window.PhaseRegistry.getAll() 
            : [{ name: "Core Settlement Module", status: "Active" }, { name: "Bakong Link v2", status: "Synchronized" }];

        list.innerHTML = "";
        phases.forEach(phase => {
            const li = document.createElement("li");
            li.className = "phase-item";
            li.innerHTML = `${phase.name} <span>${phase.status}</span>`;
            list.appendChild(li);
        });
    }

    /* =========================================================
       LIFE CYCLE MANAGEMENT
    ========================================================= */
    function logout() {
        destroySession();
        location.reload();
    }

    function restoreSession() {
        const session = loadSession();
        if (session) renderDashboard(session);
    }

    function startSessionTimer() {
        let timeout;
        const reset = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                alert("Session expired.");
                logout();
            }, CONFIG.SESSION_TIMEOUT_MINUTES * 60000);
        };
        document.addEventListener("mousemove", reset);
        document.addEventListener("keypress", reset);
        reset();
    }

    /* =========================================================
       INITIALIZATION ENTRY POINT
    ========================================================= */
    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("loginForm");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const userVal = document.getElementById("usernameInput")?.value.trim();
                const passVal = document.getElementById("passwordInput")?.value.trim();
                handleLogin(userVal, passVal);
            });
        }

        restoreSession();
        startSessionTimer();

        document.getElementById("logoutBtn")?.addEventListener("click", logout);
    });

    /* =========================================================
       GLOBAL NAMESPACES
    ========================================================= */
    window.logout = logout;
    window.handleLogin = handleLogin;

})();
