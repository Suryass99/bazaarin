// Homepage search bar just hands off to the shop page — the listing grid
// no longer lives here.
const searchInput = document.getElementById('searchInput');
const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');

function goToShop() {
    const query = searchInput.value.trim();
    const location = locationInput.value.trim();
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (location) params.set('location', location);
    const qs = params.toString();
    window.location.href = qs ? `shop.html?${qs}` : 'shop.html';
}

searchBtn.addEventListener('click', goToShop);
[searchInput, locationInput].forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') goToShop();
    });
});

attachAutocomplete(searchInput, productSuggestions, () => {});
attachAutocomplete(locationInput, locationSuggestions, () => {});

// Scroll-linked parallax on top of the wave's own idle drift (in CSS) — the
// two layers move at different rates so it reads as water shifting, not a
// flat image sliding with the page.
const heroCurve = document.querySelector('.hero-curve');
if (heroCurve && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    function updateHeroParallax() {
        const y = window.scrollY;
        heroCurve.style.transform = `translate(${y * 0.12}px, ${y * 0.3}px) rotate(${y * 0.015}deg)`;
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHeroParallax);
            ticking = true;
        }
    }, { passive: true });
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
