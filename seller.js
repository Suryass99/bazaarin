const sellerRoot = document.getElementById('sellerRoot');

function renderSignInGate() {
    sellerRoot.innerHTML = `
        <div class="sell-gate">
            <h2>Sign in as a Seller</h2>
            <p class="hero-subtitle">The Seller Dashboard is only available to Seller accounts.</p>
            <a href="signin.html?redirect=seller.html&role=seller" class="btn-primary large" style="display:inline-block; margin-top:16px;">Sign In as a Seller</a>
        </div>
    `;
}

function renderWrongAccountGate(user) {
    sellerRoot.innerHTML = `
        <div class="sell-gate">
            <h2>This is a seller-only area</h2>
            <p class="hero-subtitle">You're signed in as ${user.name} (Customer account). Bazaarin keeps Customer and Seller accounts separate — switch to a Seller account to see your dashboard.</p>
            <button type="button" id="switchToSellerBtn" class="btn-primary large" style="margin-top:16px;">Switch to Seller Account</button>
        </div>
    `;
    document.getElementById('switchToSellerBtn').addEventListener('click', () => {
        logout();
        window.location.href = 'signin.html?redirect=seller.html&role=seller';
    });
}

function renderDashboard(user) {
    const myListings = products.filter(p => p.sellerName === user.name);
    const myQueries = queriesForSeller(user.name);

    sellerRoot.innerHTML = `
        <h2 class="section-title">Seller Dashboard</h2>
        <p class="hero-subtitle">Welcome back, ${user.name}.</p>

        <div class="sell-section">
            <h3>Your Listings (${myListings.length})</h3>
            ${myListings.length === 0 ? `
                <p class="no-results" style="padding:24px 0;">You haven't listed anything yet. <a href="sell.html">List your first item</a>.</p>
            ` : `
                <div class="product-grid">
                    ${myListings.map(p => `
                        <a href="product.html?id=${p.id}" class="product-card" style="text-decoration:none; color:inherit;">
                            <img src="${getProductThumbnail(p)}" alt="${p.title}" class="product-image">
                            <div class="product-details">
                                <div class="product-meta">
                                    <span class="product-condition">${formatDuration(p.monthsUsed)} Used</span>
                                    <span class="product-location">📍 ${p.location}</span>
                                </div>
                                <h4 class="product-title">${p.title}</h4>
                                <div class="product-footer">
                                    <div class="price-container"><span class="current-price">₹${p.price}</span></div>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            `}
        </div>

        <div class="sell-section">
            <h3>Customer Queries (${myQueries.length})</h3>
            ${myQueries.length === 0 ? `
                <p class="no-results" style="padding:24px 0;">No customer messages yet.</p>
            ` : `
                <div id="queriesList">
                    ${myQueries.map(q => `
                        <div class="query-item">
                            <div class="query-meta">
                                <strong>${q.buyerName}</strong> asked about <a href="product.html?id=${q.productId}">${q.productTitle}</a>
                                <span class="form-hint">${formatRelativeTime(q.timestamp)}</span>
                            </div>
                            <p class="query-message">"${q.message}"</p>
                            ${q.answered
                                ? '<span class="query-answered">✓ Marked as replied</span>'
                                : `<button type="button" class="btn-secondary query-reply-btn" data-query-id="${q.id}">Mark as Replied</button>`
                            }
                        </div>
                    `).join('')}
                </div>
            `}
        </div>

        <div class="sell-section">
            <h3>Bazaarin Support for Sellers</h3>
            <p class="hero-subtitle" style="margin-bottom:16px; font-size:0.95rem;">Questions about your listings or the platform? Chat with us here.</p>
            <div class="chat-widget" style="max-width:500px; height:400px;">
                <div class="chat-body" id="sellerChatBody">
                    <div class="chat-message received support-msg">Hi ${user.name}, this is Bazaarin Support for sellers. How can we help?</div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="sellerChatInput" placeholder="Type a message...">
                    <button id="sellerChatSend" class="btn-primary">Send</button>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll('.query-reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            markQueryReplied(btn.dataset.queryId);
            renderDashboard(user);
        });
    });

    const chatBody = document.getElementById('sellerChatBody');
    const chatInput = document.getElementById('sellerChatInput');

    function sendSellerMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        chatBody.innerHTML += `<div class="chat-message sent">${text}</div>`;
        chatInput.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;
        setTimeout(() => {
            chatBody.innerHTML += `<div class="chat-message received support-msg">${getSupportReply(text)}</div>`;
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 1000);
    }

    document.getElementById('sellerChatSend').addEventListener('click', sendSellerMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendSellerMessage();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) { renderSignInGate(); return; }
    if (user.accountType !== 'seller') { renderWrongAccountGate(user); return; }
    renderDashboard(user);
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
