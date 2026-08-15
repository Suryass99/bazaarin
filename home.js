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
