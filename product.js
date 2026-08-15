function buildEmiSectionHtml(price) {
    if (price < 20000) return '';
    const bodyRows = emiFinanciers.map(f => `
        <tr>
            <td>${f.name}<br><span class="spec-key">${f.rate}% p.a.</span></td>
            ${emiTenures.map(m => `<td>₹${calculateEMI(price, f.rate, m).toLocaleString('en-IN')}/mo</td>`).join('')}
        </tr>
    `).join('');
    return `
        <div class="emi-section">
            <h3>EMI Options</h3>
            <p class="form-hint" style="margin-bottom:12px;">Estimated monthly instalments for ₹${price.toLocaleString('en-IN')} across partnered financiers.</p>
            <div class="emi-table-wrap">
                <table class="emi-table">
                    <thead>
                        <tr><th>Financier</th><th>6 months</th><th>1 year</th><th>2 years</th></tr>
                    </thead>
                    <tbody>${bodyRows}</tbody>
                </table>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = products.find(p => p.id === productId);

    const productContent = document.getElementById('productContent');

    if (!product) {
        productContent.innerHTML = '<h2>Product not found</h2><a href="index.html" class="btn-primary" style="display:inline-block; margin-top:16px;">Go Back</a>';
        return;
    }

    let specsHtml = '';
    for (const [key, value] of Object.entries(product.specs)) {
        specsHtml += `<div class="spec-row"><span class="spec-key">${key}</span><span class="spec-val">${value}</span></div>`;
    }

    const images = getProductImages(product);
    const thumbsHtml = images.map((img, idx) => `
        <button class="product-thumbnail${idx === 0 ? ' active' : ''}" data-idx="${idx}" aria-label="${img.label}">
            <img src="${img.src}" alt="${img.label}">
        </button>
    `).join('');

    productContent.innerHTML = `
        <div class="product-main-col">
            <div class="product-image-large">
                <img id="mainProductImage" src="${images[0].src}" alt="${product.title} - ${images[0].label}">
            </div>
            <div class="product-thumbnails" id="productThumbnails">
                ${thumbsHtml}
            </div>

            <div class="product-info-card">
                <h2>${product.title}</h2>
                <div class="product-meta large">
                    <span class="product-condition">${formatDuration(product.monthsUsed)} Used</span>
                    <span class="product-location">📍 ${product.location}</span>
                </div>

                <div class="price-container large-price">
                    <span class="current-price">₹${product.price}</span>
                </div>

                <div class="product-actions">
                    <button id="buyBtn" class="btn-primary">Buy Now</button>
                    <button id="compareBtn" class="btn-secondary compare-btn">Add to Compare</button>
                </div>
                <form id="offerForm" class="offer-form hidden">
                    <p class="form-hint" style="margin-bottom:8px;">Give the seller a price range you're comfortable with — they'll pick a price within it.</p>
                    <div class="offer-range-fields">
                        <div class="form-field">
                            <label for="offerMin">Min (₹)</label>
                            <input type="number" id="offerMin" min="0" required>
                        </div>
                        <div class="form-field">
                            <label for="offerMax">Max (₹)</label>
                            <input type="number" id="offerMax" min="0" required>
                        </div>
                    </div>
                    <button type="submit" class="btn-primary">Send Offer to Seller</button>
                </form>
                <p id="buyConfirmation" class="buy-confirmation hidden"></p>

                <div class="specs-section">
                    <h3>Specifications</h3>
                    <div class="specs-grid">
                        ${specsHtml}
                    </div>
                </div>

                ${buildEmiSectionHtml(product.price)}

                <div class="reason-section">
                    <h3>Reason for Selling</h3>
                    <p>"${product.reasonForSelling}"</p>
                </div>
            </div>
        </div>

        <div class="product-sidebar">
            <div class="seller-card">
                <div class="seller-header">
                    <div class="seller-avatar">${product.sellerName.charAt(0)}</div>
                    <div>
                        <h3>${product.sellerName}</h3>
                        <p class="seller-history">Sold ${product.sellerHistory} items previously</p>
                    </div>
                </div>
            </div>

            <div class="chat-widget">
                <div class="chat-header">
                    <button class="chat-tab active" id="tabSeller">Chat with Seller</button>
                    <button class="chat-tab" id="tabSupport">Bazaarin Support</button>
                </div>
                <div id="sellerEscalation" class="escalation-banner hidden">
                    <p>It's been over a day since you messaged ${product.sellerName} with no reply.</p>
                    <button type="button" id="escalateBtn" class="btn-secondary">Get Help from Bazaarin Support</button>
                </div>
                <div class="chat-body" id="chatBody"></div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Type a message...">
                    <button id="sendBtn" class="btn-primary">Send</button>
                </div>
            </div>
        </div>
    `;

    // Buy / Compare Logic
    const buyBtn = document.getElementById('buyBtn');
    const compareBtn = document.getElementById('compareBtn');
    const buyConfirmation = document.getElementById('buyConfirmation');
    const offerForm = document.getElementById('offerForm');

    buyBtn.addEventListener('click', () => {
        buyBtn.disabled = true;
        offerForm.classList.remove('hidden');
    });

    function updateCompareBtn() {
        const added = isInCompare(product.id);
        compareBtn.textContent = added ? '✓ Added to Compare' : 'Add to Compare';
        compareBtn.classList.toggle('active', added);
    }
    updateCompareBtn();

    compareBtn.addEventListener('click', () => {
        if (isInCompare(product.id)) {
            removeFromCompare(product.id);
        } else if (!addToCompare(product.id)) {
            alert(`You can compare up to ${COMPARE_LIMIT} products at a time — remove one from the compare bar first.`);
        }
        updateCompareBtn();
    });

    // Gallery Logic
    const mainImage = document.getElementById('mainProductImage');
    document.querySelectorAll('.product-thumbnail').forEach(thumb => {
        thumb.addEventListener('click', () => {
            const idx = parseInt(thumb.dataset.idx);
            mainImage.src = images[idx].src;
            mainImage.alt = `${product.title} - ${images[idx].label}`;
            document.querySelectorAll('.product-thumbnail').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

    // --- Chat: two fully independent threads (seller / support), so
    // switching tabs never loses history or leaks a draft between them.
    const tabSeller = document.getElementById('tabSeller');
    const tabSupport = document.getElementById('tabSupport');
    const chatBody = document.getElementById('chatBody');
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    const sellerEscalation = document.getElementById('sellerEscalation');
    const escalateBtn = document.getElementById('escalateBtn');

    const sellerGreeting = { role: 'received', text: `Hi! I'm ${product.sellerName}. Feel free to ask me anything about the ${product.title}.` };
    const supportGreeting = { role: 'received support-msg', text: 'Hello! Bazaarin Support here. How can we help you with this transaction?' };
    let sellerThread = [sellerGreeting];
    let supportThread = [supportGreeting];
    let activeTab = 'seller';

    function renderChat() {
        const thread = activeTab === 'seller' ? sellerThread : supportThread;
        chatBody.innerHTML = thread.map(m => `<div class="chat-message ${m.role}">${m.text}</div>`).join('');
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function updateEscalation() {
        if (activeTab === 'seller' && hasStaleUnansweredQuery(product.id, 24)) {
            sellerEscalation.classList.remove('hidden');
        } else {
            sellerEscalation.classList.add('hidden');
        }
    }

    renderChat();
    updateEscalation();

    tabSeller.addEventListener('click', () => {
        activeTab = 'seller';
        tabSeller.classList.add('active');
        tabSupport.classList.remove('active');
        chatInput.value = '';
        renderChat();
        updateEscalation();
    });

    tabSupport.addEventListener('click', () => {
        activeTab = 'support';
        tabSupport.classList.add('active');
        tabSeller.classList.remove('active');
        chatInput.value = '';
        renderChat();
        updateEscalation();
    });

    escalateBtn.addEventListener('click', () => {
        tabSupport.click();
        chatInput.value = `I haven't heard back from the seller about the ${product.title} in over a day — can you help?`;
        chatInput.focus();
    });

    function sendMessage(text, options) {
        options = options || {};
        if (!text.trim()) return;
        const isSupport = activeTab === 'support';
        const thread = isSupport ? supportThread : sellerThread;
        thread.push({ role: 'sent', text });
        renderChat();

        if (!isSupport) {
            const buyer = typeof getCurrentUser === 'function' && getCurrentUser() ? getCurrentUser().name : null;
            recordBuyerMessage(product, buyer, text);
        }

        // The offer flow schedules its own specific "here's the price I can
        // do" reply right after this — skip the generic ack so the seller
        // doesn't appear to reply twice in a row.
        if (options.skipAutoReply) return;

        setTimeout(() => {
            const replyText = isSupport
                ? getSupportReply(text)
                : "Thanks for reaching out! We'll get back to you shortly.";
            thread.push({ role: isSupport ? 'received support-msg' : 'received', text: replyText });
            renderChat();
            updateEscalation();
        }, 1000);
    }

    sendBtn.addEventListener('click', () => {
        const text = chatInput.value;
        chatInput.value = '';
        sendMessage(text);
    });
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const text = chatInput.value;
            chatInput.value = '';
            sendMessage(text);
        }
    });

    offerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const min = parseInt(document.getElementById('offerMin').value) || 0;
        const max = parseInt(document.getElementById('offerMax').value) || 0;
        if (min <= 0 || max <= 0 || max < min) {
            alert('Enter a valid price range (max should be at least your min).');
            return;
        }

        offerForm.classList.add('hidden');
        buyBtn.textContent = '✅ Offer Sent';
        buyConfirmation.textContent = `Your offer of ₹${min}–₹${max} was sent to ${product.sellerName} — check "Chat with Seller" for their response. (This is a demo — no real order or payment is processed.)`;
        buyConfirmation.classList.remove('hidden');

        tabSeller.click();
        sendMessage(`Hi, I'd like to buy this — my budget is ₹${min} to ₹${max}. Could we settle on a price in that range?`, { skipAutoReply: true });

        // The seller "picks" a price within the offered range, biased
        // slightly toward the top of it, and confirms it in-chat.
        const chosen = Math.max(min, Math.min(max, Math.round((min + (max - min) * 0.65) / 500) * 500));
        setTimeout(() => {
            sellerThread.push({ role: 'received', text: `Thanks for the offer! I can do ₹${chosen} for this — let's go ahead at that price.` });
            renderChat();
        }, 1600);
    });
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
