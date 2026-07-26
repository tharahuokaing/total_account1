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
        { username: "mek", password: "mek", role: "Customer", requires2FA: false },
        { username: "kuo", password: "kuo", role: "Customer", requires2FA: false },
        { username: "test", password: "test", role: "Test User", requires2FA: false },
        { username: "test4", password: "test4", role: "Test Customer", requires2FA: false },
        { username: "thorn", password: "thorn", role: "Customer", requires2FA: false },
        { username: "sansopheata", password: "sansopheata", role: "Chief Executive Officer", requires2FA: false },
        { username: "chansamnang", password: "chansamnang", role: "Customer", requires2FA: false },
        { username: "huo", password: "huo", role: "Mr. Huo (Vice President)", requires2FA: false },
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
        { username: "sengchhat1", password: "sengchhat1", role: "Credit Officer", requires2FA: true },
        { username: "sengchhat", password: "sengchhat", role: "Director", requires2FA: true }
    ];

    /* =========================================================
       MOCK TRANSACTION SOURCE DATA
    ========================================================= */
    const MOCK_TRANSACTIONS = [
        { id: "TXN-90214", account: "Acc...8841 (Thorn)", type: "Bakong Transfer", amount: "$0", time: "00:00:00", status: "Success" },
        { id: "TXN-90215", account: "Acc...1092 (Vanneat)", type: "Interbank Pay", amount: "$0", time: "00:00:00", status: "Success" },
        { id: "TXN-90216", account: "Acc...4412 (Mengly)", type: "ATM Cash Deposit", amount: "$0", time: "00:00:00", status: "Success" },
        { id: "TXN-90217", account: "Acc...0029 (Leyu)", type: "Clearing Settlement", amount: "$0", time: "00:00:00", status: "Pending" }
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
            document.getElementById("accountCount").textContent = "0";
            document.getElementById("depositTotal").textContent = "$0";
            document.getElementById("txCount").textContent = "0";
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
                    <a href="https://tharahuokaing.github.io/total_account/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="total_account.jpg" alt="Accounts Icon" class="card-icon" style="width:150px; height:150px;">
                        <h3 id="accountCount">$15,000</h3>
                        <p>Total Accounts</p>
                        <span class="card-link">View Details</span>
                    </a>
                </div>

                <!-- Card 2: Total Deposits -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/deposit/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="total_deposit.jpg" alt="Deposits Icon" class="card-icon" style="width:150px; height:150px;">
                        <h3 id="depositTotal">$700,050,000</h3>
                        <p>Total Deposits</p>
                        <span class="card-link">View Details</span>
                    </a>
                </div>

                <!-- Card 3: Transaction Volumes -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/transaction/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="transaction_volumn.jpg" alt="Transactions Icon" class="card-icon" style="width:150px; height:150px;">
                        <h3 id="txCount">$0.00</h3>
                        <p>Transactions Processed</p>
                        <span class="card-link">View Log</span>
                    </a>
                </div>

                <!-- Card 4: QR Code Scanner -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/qr_scanner/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="qr.jpg" alt="QR Scanner Icon" class="card-icon" style="width:150px; height:150px; object-fit: cover; border-radius: 50%;">
                        <h3>QR Code</h3>
                        <p>QR Scanner & Upload</p>
                        <span class="card-link">Open Module</span>
                    </a>
                </div>

                <!-- Card 5: Legend Cinema Portal -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/cinema/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="cinema.jpg" alt="Cinema Icon" class="card-icon" style="width:150px; height:150px; object-fit: cover; border-radius: 50%;">
                        <h3>Cinema</h3>
                        <p>Legend Booking & Pay</p>
                        <span class="card-link">Open Module</span>
                    </a>
                </div>

                <!-- Card 6: Withdrawal -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/withdrawal_bank/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="withdrawal.jpg" alt="Withdrawal Icon" class="card-icon" style="width:150px; height:150px; object-fit: cover; border-radius: 50%;">
                        <h3>Withdrawal</h3>
                        <p>Secure Withdrawal</p>
                        <span class="card-link">Open Module</span>
                    </a>
                </div>

                <!-- Card 7: Cryptocurrency Market Overview -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/cryptocurrency/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="cryptocurrency.jpg" alt="Crypto Exchange Icon" class="card-icon" style="width:150px; height:150px; object-fit: cover; border-radius: 12px;">
                        <h3 style="color: #f0b90b;">Live Markets</h3>
                        <p>Crypto Exchange Overview</p>
                        <span class="card-link" style="color: #0ecb81;">View 30 Assets</span>
                    </a>
                </div>


                <!-- Card 8: Global Currency Calculator -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/calculator/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="calculator.jpg" alt="Calculator Icon" class="card-icon" style="width:150px; height:150px; object-fit: cover; border-radius: 50%;">
                        <h3>Calculator</h3>
                        <p>Global Rate Converter</p>
                        <span class="card-link">Open Module</span>
                    </a>
                </div>


                <!-- Card 9: System Phases -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/total_phase/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="system_phase.jpg" alt="Phases Icon" class="card-icon" style="width:150px; height:150px;">
                        <h3>21</h3>
                        <p>Total Phases</p>
                        <span class="card-link">View Phase Map</span>
                    </a>
                </div>

                <!-- Card 10: Financial Compliance -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/financial_compliance/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="financial_complaint.jpg" alt="Compliance Icon" class="card-icon" style="width:150px; height:150px;">
                        <h3>ISO 20022</h3>
                        <p>Compliance Status</p>
                        <span class="card-link">View Documents</span>
                    </a>
                </div>

                <!-- Card 11: Interbank Network -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/interbank_network/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="interbank_network.jpg" alt="Bakong Icon" class="card-icon" style="width:150px; height:150px;">
                        <h3>Bakong</h3>
                        <p>Connected Gateways</p>
                        <span class="card-link">Gateway Status</span>
                    </a>
                </div>

                <!-- Card 12: Security Architecture -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/security_architecture/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="security_architecture.jpg" alt="SOC Icon" class="card-icon" style="width:150px; height:150px;">
                        <h3>SOC</h3>
                        <p>Monitoring Nodes</p>
                        <span class="card-link">Live Alerts</span>
                    </a>
                </div>

                <!-- Card 13: Pending Clearings -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/pending_clearing/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="pending_clearing.jpg" alt="Clearing Icon" class="card-icon" style="width:150px; height:150px;">
                        <h3>0</h3>
                        <p>Pending Clearings</p>
                        <span class="card-link">Clear Queue</span>
                    </a>
                </div>

                <!-- Card 14: Active Audits -->
                <div class="dashboard-card">
                    <a href="https://tharahuokaing.github.io/active_audit/" style="text-decoration: none; color: inherit; display: block; height: 100%; width: 100%;">
                        <img src="active_audit.jpg" alt="Audits Icon" class="card-icon" style="width:150px; height:150px;">
                        <h3>Passed</h3>
                        <p>System Audits</p>
                        <span class="card-link">Report Vault</span>
                    </a>
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
