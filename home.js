// The landing page IS the login gate: signed-out visitors pick Buyer or
// Seller and go through signin.html; a signed-in Buyer lands on the usual
// "shop laptops or mobiles" chooser; a signed-in Seller/Admin is sent
// straight to their dashboard, since there's nothing for them to do here.
const heroContent = document.getElementById('heroContent');

function renderLoginPrompt() {
    heroContent.innerHTML = `
        <span class="badge">Sign In to Bazaarin</span>
        <h2 class="hero-title">Are You Buying,<br><span class="text-gradient">Or Selling?</span></h2>
        <p class="hero-subtitle">Choose how you'd like to use Bazaarin — buy certified refurbished electronics, or list your own to sell.</p>
        <div class="hero-actions">
            <a href="signin.html?role=customer" class="btn-dark-green large">I'm a Buyer</a>
            <a href="signin.html?role=seller" class="btn-pale-green large">I'm a Seller</a>
        </div>
    `;
}

function renderBuyerHero(user) {
    heroContent.innerHTML = `
        <span class="badge">Welcome back, ${user.name}!</span>
        <h2 class="hero-title">Build for India,<br><span class="text-gradient">Priced for Everyone.</span></h2>
        <p class="hero-subtitle">From Mumbai to Kochi, shop certified secondhand laptops and phones from sellers across the country. Save money and reduce e-waste with India's most trusted refurbished marketplace.</p>
        <div class="hero-actions">
            <a href="shop.html?category=Laptops" class="btn-dark-green large">Shop Laptops</a>
            <a href="shop.html?category=Mobiles" class="btn-pale-green large">Shop Mobiles</a>
        </div>
    `;
}

const homeUser = getCurrentUser();
if (!homeUser) {
    renderLoginPrompt();
} else if (homeUser.accountType === 'seller') {
    window.location.href = 'seller.html';
} else if (homeUser.accountType === 'admin') {
    window.location.href = 'admin.html';
} else {
    renderBuyerHero(homeUser);
}

// --- Drift field --------------------------------------------------------
// Line-art laptops and phones crossing the violet panel. The two types run
// diagonally opposite paths — laptops south-east, phones north-west — so the
// field reads as two streams passing through each other. Each drifter is one
// element running two composited animations (transform + opacity); the CSS
// keyframes translate by +/- --dx/--dy, which this file publishes on the
// panel from its measured size.
const driftPanel = document.getElementById('driftPanel');

const DRIFT_PER_TYPE = 11;
const DRIFT_LAPTOP = `<svg width="42" height="31" viewBox="0 0 24 18" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="1" width="20" height="12" rx="1.5"/><path d="M1 16h22l-1.6 2.4a1 1 0 0 1-.9.6H3.5a1 1 0 0 1-.9-.6L1 16z"/></svg>`;
const DRIFT_MOBILE = `<svg width="23" height="34" viewBox="0 0 16 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="1" width="12" height="22" rx="2.5"/><line x1="6.5" y1="19.5" x2="9.5" y2="19.5"/></svg>`;

function buildDrift() {
    if (!driftPanel) return;
    let html = '';
    for (let i = 0; i < DRIFT_PER_TYPE * 2; i++) {
        const laptop = i % 2 === 0;
        const n = i >> 1;
        // A golden-ratio walk spreads the icons over the panel without the
        // clumps a random scatter leaves and without landing on a grid.
        const x = 6 + ((n * 0.6180339887 + (laptop ? 0.13 : 0.61)) % 1) * 78;
        const y = 6 + ((n * 0.7548776662 + (laptop ? 0.37 : 0.05)) % 1) * 78;
        const dur = 24 + (n % 5) * 4;
        // Delays spread across a full cycle, so the panel is never empty and
        // the end-of-run fades never pulse in unison.
        const delay = -(dur * n) / DRIFT_PER_TYPE - (laptop ? 0 : dur / 7);
        html += `<span class="drift${laptop ? '' : ' drift-up'}" style="` +
            `--drift-x:${x.toFixed(1)}%;--drift-y:${y.toFixed(1)}%;` +
            `--drift-dur:${dur}s;--drift-delay:${delay.toFixed(2)}s">` +
            `${laptop ? DRIFT_LAPTOP : DRIFT_MOBILE}</span>`;
    }
    driftPanel.innerHTML = html;
    sizeDrift();
}

// Travel is half the sweep in each axis. It lives on the panel rather than on
// each drifter so one write rescales the whole field, and it has to be in px:
// a percentage translate resolves against the icon's own box, not the panel's.
function sizeDrift() {
    if (!driftPanel) return;
    const rect = driftPanel.getBoundingClientRect();
    driftPanel.style.setProperty('--dx', Math.round(rect.width * 0.34) + 'px');
    driftPanel.style.setProperty('--dy', Math.round(rect.height * 0.42) + 'px');
}

buildDrift();

if (driftPanel && window.ResizeObserver) {
    new ResizeObserver(sizeDrift).observe(driftPanel);
} else {
    window.addEventListener('resize', sizeDrift);
}

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
