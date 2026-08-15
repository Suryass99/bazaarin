const adminRoot = document.getElementById('adminRoot');

function renderSignInGate() {
    adminRoot.innerHTML = `
        <div class="sell-gate">
            <h2>Staff Sign In Required</h2>
            <p class="hero-subtitle">The Admin area is only available to Bazaarin staff accounts.</p>
            <a href="admin-login.html" class="btn-primary large" style="display:inline-block; margin-top:16px;">Staff Sign In</a>
        </div>
    `;
}

function renderWrongAccountGate(user) {
    const accountLabel = user.accountType === 'seller' ? 'Seller' : 'Customer';
    adminRoot.innerHTML = `
        <div class="sell-gate">
            <h2>This is a staff-only area</h2>
            <p class="hero-subtitle">You're signed in as ${user.name} (${accountLabel} account). Sign in with a staff account to continue.</p>
            <button type="button" id="switchToStaffBtn" class="btn-primary large" style="margin-top:16px;">Switch to Staff Account</button>
        </div>
    `;
    document.getElementById('switchToStaffBtn').addEventListener('click', () => {
        logout();
        window.location.href = 'admin-login.html';
    });
}

const deptLabels = {
    stats: 'Stats & Analytics',
    techsupport: 'Tech Support',
    finance: 'Finance Department'
};

function distinctSellerCount() {
    return new Set(products.map(p => p.sellerName)).size;
}

// There's no backend/user registry in this static demo, so registered-user
// count can't be derived from real data the way sellers/products/feedback
// can — it's a fixed, clearly-labeled demo figure standing in for one.
const DEMO_TOTAL_USERS = 8624;

function renderStats(user) {
    const totalFeedback = getQueries().length;
    adminRoot.innerHTML = `
        <span class="admin-dept-badge">${deptLabels[user.department]}</span>
        <h2 class="section-title">Platform Stats</h2>
        <p class="hero-subtitle" style="margin-bottom:24px;">Signed in as ${user.name}.</p>
        <div class="admin-stats-grid">
            <div class="stat-card">
                <span class="stat-value">${DEMO_TOTAL_USERS.toLocaleString('en-IN')}</span>
                <span class="stat-label">Registered Users</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${distinctSellerCount()}</span>
                <span class="stat-label">Active Sellers</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${products.length}</span>
                <span class="stat-label">Listed Products</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${totalFeedback}</span>
                <span class="stat-label">Buyer Feedback / Queries</span>
            </div>
        </div>
        <p class="form-hint">Registered Users is a simulated platform-wide figure — this demo has no real backend or user registry. Sellers, Products, and Feedback are computed live from this session's catalog and query data.</p>
    `;
}

function renderTechSupport(user) {
    const allQueries = getQueries().slice().sort((a, b) => b.timestamp - a.timestamp);
    adminRoot.innerHTML = `
        <span class="admin-dept-badge">${deptLabels[user.department]}</span>
        <h2 class="section-title">Tech Support Queue</h2>
        <p class="hero-subtitle" style="margin-bottom:24px;">Signed in as ${user.name}.</p>
        <div class="sell-section">
            <h3>All Buyer Queries (${allQueries.length})</h3>
            ${allQueries.length === 0 ? `
                <p class="no-results" style="padding:24px 0;">No queries yet.</p>
            ` : `
                <div id="queriesList">
                    ${allQueries.map(q => `
                        <div class="query-item">
                            <div class="query-meta">
                                <strong>${q.buyerName}</strong> asked <strong>${q.sellerName}</strong> about <a href="product.html?id=${q.productId}">${q.productTitle}</a>
                                <span class="form-hint">${formatRelativeTime(q.timestamp)}</span>
                            </div>
                            <p class="query-message">"${q.message}"</p>
                            ${q.answered
                                ? '<span class="query-answered">✓ Resolved</span>'
                                : `<button type="button" class="btn-secondary query-reply-btn" data-query-id="${q.id}">Mark Resolved</button>`
                            }
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
    document.querySelectorAll('.query-reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            markQueryReplied(btn.dataset.queryId);
            renderTechSupport(user);
        });
    });
}

function renderFinance(user) {
    const laptops = products.filter(p => p.category === 'Laptops');
    const mobiles = products.filter(p => p.category === 'Mobiles');
    const totalValue = products.reduce((sum, p) => sum + p.price, 0);
    const laptopValue = laptops.reduce((sum, p) => sum + p.price, 0);
    const mobileValue = mobiles.reduce((sum, p) => sum + p.price, 0);
    const emiEligible = products.filter(p => p.price >= 20000);
    const avgEmi1yr = emiEligible.length
        ? Math.round(emiEligible.reduce((sum, p) => sum + calculateEMI(p.price, 6, 12), 0) / emiEligible.length)
        : 0;

    adminRoot.innerHTML = `
        <span class="admin-dept-badge">${deptLabels[user.department]}</span>
        <h2 class="section-title">Finance Overview</h2>
        <p class="hero-subtitle" style="margin-bottom:24px;">Signed in as ${user.name}.</p>
        <div class="admin-stats-grid">
            <div class="stat-card">
                <span class="stat-value">₹${totalValue.toLocaleString('en-IN')}</span>
                <span class="stat-label">Total Catalog Value</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">₹${laptopValue.toLocaleString('en-IN')}</span>
                <span class="stat-label">Laptop Value (${laptops.length})</span>
                <div class="stat-bar"><span style="width:${Math.round(laptopValue / totalValue * 100)}%"></span></div>
                <span class="stat-note">${Math.round(laptopValue / totalValue * 100)}% of total</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">₹${mobileValue.toLocaleString('en-IN')}</span>
                <span class="stat-label">Mobile Value (${mobiles.length})</span>
                <div class="stat-bar amber"><span style="width:${Math.round(mobileValue / totalValue * 100)}%"></span></div>
                <span class="stat-note">${Math.round(mobileValue / totalValue * 100)}% of total</span>
            </div>
            <div class="stat-card accent">
                <span class="stat-value">${emiEligible.length}</span>
                <span class="stat-label">EMI-Eligible Listings (&ge;₹20k)</span>
                <span class="stat-note">${Math.round(emiEligible.length / products.length * 100)}% of all listings</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">₹${avgEmi1yr.toLocaleString('en-IN')}/mo</span>
                <span class="stat-label">Avg. 1-Year EMI (6% p.a.)</span>
            </div>
        </div>
        <p class="form-hint">Figures are computed live from this session's product catalog.</p>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) { renderSignInGate(); return; }
    if (user.accountType !== 'admin') { renderWrongAccountGate(user); return; }

    if (user.department === 'techsupport') renderTechSupport(user);
    else if (user.department === 'finance') renderFinance(user);
    else renderStats(user);
});

// Dropdown Menu Logic
function toggleMenu() {
    document.getElementById("myDropdown").classList.toggle("show");
}
window.onclick = function(event) {
    if (!event.target.closest('.kebab-menu')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
