// Shared "compare list" state (localStorage-backed) used across shop.html,
// product.html, and compare.html — lets a shopper mark a few listings and
// see their specs side by side.
const COMPARE_KEY = 'bazaarin_compare';
const COMPARE_LIMIT = 3;

function getCompareIds() {
    try {
        return JSON.parse(localStorage.getItem(COMPARE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveCompareIds(ids) {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
    renderCompareBar();
}

function isInCompare(id) {
    return getCompareIds().includes(id);
}

// Returns true if added, false if the compare list is already full.
function addToCompare(id) {
    const ids = getCompareIds();
    if (ids.includes(id)) return true;
    if (ids.length >= COMPARE_LIMIT) return false;
    ids.push(id);
    saveCompareIds(ids);
    return true;
}

function removeFromCompare(id) {
    saveCompareIds(getCompareIds().filter(x => x !== id));
}

// Floating bar pinned to the bottom of the viewport, shown on any page that
// loads this script whenever the compare list isn't empty.
function renderCompareBar() {
    const ids = getCompareIds();
    let bar = document.getElementById('compareBar');

    if (ids.length === 0) {
        if (bar) bar.remove();
        return;
    }

    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'compareBar';
        bar.className = 'compare-bar';
        document.body.appendChild(bar);
    }

    const items = ids.map(id => products.find(p => p.id === id)).filter(Boolean);
    bar.innerHTML = `
        <div class="compare-bar-items">
            ${items.map(p => `
                <div class="compare-bar-item">
                    <span>${p.title}</span>
                    <button data-id="${p.id}" class="compare-bar-remove" aria-label="Remove ${p.title} from compare">&times;</button>
                </div>
            `).join('')}
        </div>
        <a href="compare.html" class="btn-primary compare-bar-btn">Compare (${items.length})</a>
    `;
    bar.querySelectorAll('.compare-bar-remove').forEach(btn => {
        btn.addEventListener('click', () => removeFromCompare(parseInt(btn.dataset.id)));
    });
}

// Only does anything on compare.html (checks for #compareContent).
function renderComparePage() {
    const container = document.getElementById('compareContent');
    if (!container) return;

    const ids = getCompareIds();
    const items = ids.map(id => products.find(p => p.id === id)).filter(Boolean);

    if (items.length === 0) {
        container.innerHTML = `<p class="no-results">No products selected yet. Head to the <a href="shop.html">shop</a> and tap "Add to Compare" on a couple of listings.</p>`;
        return;
    }

    const specKeys = Array.from(new Set(items.flatMap(p => Object.keys(p.specs))));
    const rows = [
        { label: 'Price', render: p => `₹${p.price}` },
        { label: 'Condition', render: p => `${formatDuration(p.monthsUsed)} used` },
        { label: 'Location', render: p => p.location },
        ...specKeys.map(key => ({ label: key, render: p => p.specs[key] || '—' })),
        { label: 'Reason for Selling', render: p => `"${p.reasonForSelling}"` },
        { label: 'Seller', render: p => `${p.sellerName} (${p.sellerHistory} sales)` }
    ];

    container.innerHTML = `
        <div class="compare-table-wrap">
            <table class="compare-table">
                <thead>
                    <tr>
                        <th></th>
                        ${items.map(p => `
                            <th>
                                <img src="${getProductThumbnail(p)}" alt="${p.title}" class="compare-thumb">
                                <div class="compare-title">${p.title}</div>
                                <div class="compare-th-actions">
                                    <a href="product.html?id=${p.id}" class="nav-link">View</a>
                                    <button class="compare-remove-btn" data-id="${p.id}">Remove</button>
                                </div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            <td class="compare-row-label">${row.label}</td>
                            ${items.map(p => `<td>${row.render(p)}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.querySelectorAll('.compare-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            removeFromCompare(parseInt(btn.dataset.id));
            renderComparePage();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderCompareBar();
    renderComparePage();
});

// Dropdown Menu Logic (duplicated per-page pattern used across this site)
function toggleMenu() {
    const el = document.getElementById("myDropdown");
    if (el) el.classList.toggle("show");
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
