// DOM Elements
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const locationInput = document.getElementById('locationInput');
const categoryButtons = document.querySelectorAll('.category-card');
const sortSelect = document.getElementById('sortSelect');
const noResults = document.getElementById('noResults');
const nearMeBtn = document.getElementById('nearMeBtn');
const proximityStatus = document.getElementById('proximityStatus');

// State - seeded from the URL so links like shop.html?category=Laptops land pre-filtered
const urlParams = new URLSearchParams(window.location.search);
let currentCategory = urlParams.get('category') || 'all';
let currentSearch = urlParams.get('search') || '';
let currentLocation = urlParams.get('location') || '';
let currentSort = 'newest';

// Proximity origin — set either via the browser's geolocation or by picking
// a city from the location autocomplete. Distances are computed locally
// against the city coordinate table in geo.js.
let originCoords = null;
let originLabel = '';

function setOrigin(coords, label) {
    originCoords = coords;
    originLabel = label;
    proximityStatus.textContent = `📍 Showing distance from ${label}`;
    proximityStatus.classList.remove('hidden');
}

function distanceForProduct(product) {
    if (!originCoords) return null;
    const coords = coordsForLocation(product.location);
    if (!coords) return null;
    return haversineKm(originCoords.lat, originCoords.lng, coords.lat, coords.lng);
}

// Initialization
function init() {
    searchInput.value = currentSearch;
    locationInput.value = currentLocation;
    categoryButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === currentCategory);
    });

    attachAutocomplete(searchInput, productSuggestions, (value) => {
        currentSearch = value;
        renderProducts();
    });
    attachAutocomplete(locationInput, locationSuggestions, (value) => {
        currentLocation = value;
        const coords = coordsForLocation(value);
        if (coords) setOrigin(coords, value);
        renderProducts();
    });

    renderProducts();
    setupEventListeners();
}

// Render Products
function renderProducts() {
    // Filter
    // When sorting by proximity, the location box is the *origin* rather than
    // a strict text filter — otherwise picking "Kochi" would hide every
    // nearby-but-not-Kochi listing, defeating the point of "nearest first".
    let filtered = products.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.title.toLowerCase().includes(currentSearch.toLowerCase());
        const matchesLocation = currentSort === 'nearest'
            ? true
            : p.location.toLowerCase().includes(currentLocation.toLowerCase());
        return matchesCategory && matchesSearch && matchesLocation;
    });

    // Sort
    filtered.sort((a, b) => {
        if (currentSort === 'price-low') return a.price - b.price;
        if (currentSort === 'price-high') return b.price - a.price;
        if (currentSort === 'nearest' && originCoords) {
            const da = distanceForProduct(a);
            const db = distanceForProduct(b);
            return (da === null ? Infinity : da) - (db === null ? Infinity : db);
        }
        return 0; // Newest
    });

    // Clear Grid
    productGrid.innerHTML = '';

    if (filtered.length === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        filtered.forEach(product => {
            const card = document.createElement('a');
            card.href = `product.html?id=${product.id}`;
            card.className = 'product-card';
            card.style.textDecoration = 'none';
            card.style.color = 'inherit';

            const dist = currentSort === 'nearest' ? distanceForProduct(product) : null;
            const distanceBadge = dist !== null ? `<div class="product-distance">${Math.round(dist)} km away</div>` : '';

            card.innerHTML = `
                <img src="${getProductThumbnail(product)}" alt="${product.title}" class="product-image">
                <div class="product-details">
                    <div class="product-meta">
                        <span class="product-condition">${formatDuration(product.monthsUsed)} Used</span>
                        <span class="product-location">📍 ${product.location}</span>
                    </div>
                    ${distanceBadge}
                    <h4 class="product-title">${product.title}</h4>
                    <div class="product-footer">
                        <div class="price-container">
                            <span class="current-price">₹${product.price}</span>
                        </div>
                        <button class="add-btn" aria-label="View details">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            `;
            productGrid.appendChild(card);
        });
    }
}

// Event Listeners
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderProducts();
    });

    // Location
    locationInput.addEventListener('input', (e) => {
        currentLocation = e.target.value;
        renderProducts();
    });

    // Categories
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            currentCategory = target.dataset.category;
            renderProducts();
        });
    });

    // Sort
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        if (currentSort === 'nearest' && !originCoords) {
            proximityStatus.textContent = '📍 Pick "Use My Location" or type a city in Location to sort by proximity.';
            proximityStatus.classList.remove('hidden');
        }
        renderProducts();
    });

    // Near Me
    nearMeBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            proximityStatus.textContent = "Geolocation isn't supported by this browser — try picking a city in Location instead.";
            proximityStatus.classList.remove('hidden');
            return;
        }
        nearMeBtn.textContent = '📍 Locating…';
        nearMeBtn.disabled = true;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'your current location');
                currentSort = 'nearest';
                sortSelect.value = 'nearest';
                nearMeBtn.textContent = '📍 Use My Location';
                nearMeBtn.disabled = false;
                renderProducts();
            },
            () => {
                proximityStatus.textContent = "Couldn't access your location — pick a city in Location to sort by proximity instead.";
                proximityStatus.classList.remove('hidden');
                nearMeBtn.textContent = '📍 Use My Location';
                nearMeBtn.disabled = false;
            },
            { timeout: 8000 }
        );
    });
}

// Start app
document.addEventListener('DOMContentLoaded', init);

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
