const sellRoot = document.getElementById('sellRoot');

function renderGate() {
    sellRoot.innerHTML = `
        <div class="sell-gate">
            <h2>Sign in as a Seller to sell</h2>
            <p class="hero-subtitle">You need a Seller account before you can list a device on Bazaarin.</p>
            <a href="signin.html?redirect=sell.html&role=seller" class="btn-primary large" style="display:inline-block; margin-top:16px;">Sign In as a Seller</a>
        </div>
    `;
}

function renderWrongAccountGate(user) {
    sellRoot.innerHTML = `
        <div class="sell-gate">
            <h2>This is a seller-only area</h2>
            <p class="hero-subtitle">You're signed in as ${user.name} (Customer account). Bazaarin keeps Customer and Seller accounts separate — switch to a Seller account to list an item.</p>
            <button type="button" id="switchToSellerBtn" class="btn-primary large" style="margin-top:16px;">Switch to Seller Account</button>
        </div>
    `;
    document.getElementById('switchToSellerBtn').addEventListener('click', () => {
        logout();
        window.location.href = 'signin.html?redirect=sell.html&role=seller';
    });
}

function renderForm() {
    sellRoot.innerHTML = `
        <h2 class="section-title">Sell Your Device</h2>
        <form id="sellForm" class="sell-form" style="max-width:640px;">

            <div class="sell-section">
                <h3>1. What are you selling?</h3>
                <div class="category-grid">
                    <button type="button" class="category-card sell-category-option" data-category="Laptops">Laptop</button>
                    <button type="button" class="category-card sell-category-option" data-category="Mobiles">Mobile</button>
                </div>
            </div>

            <div class="sell-section">
                <h3>2. Brand</h3>
                <div class="form-field">
                    <select id="sellBrand" disabled required>
                        <option value="">Choose Laptop or Mobile first</option>
                    </select>
                </div>
            </div>

            <div class="sell-section">
                <h3>3. Model</h3>
                <div class="form-field">
                    <input type="text" id="sellModel" placeholder="e.g. MacBook Air M2 or iPhone 13" required>
                </div>
            </div>

            <div class="sell-section">
                <h3>4. Specifications</h3>
                <div class="auto-specs" id="sellAutoSpecs">
                    <p class="no-results" style="padding:0;">Pick a brand and model to auto-fill the rest of the spec sheet.</p>
                </div>
                <div class="specs-grid">
                    <div class="spec-row">
                        <label class="spec-key" for="sellRam">RAM</label>
                        <select id="sellRam" disabled required>
                            <option value="">Pick a brand first</option>
                        </select>
                    </div>
                    <div class="spec-row">
                        <label class="spec-key" for="sellStorage">Storage</label>
                        <select id="sellStorage" disabled required>
                            <option value="">Pick a brand first</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="sell-section">
                <h3>5. Time Used</h3>
                <div class="form-field">
                    <label for="sellMonths">Months used</label>
                    <input type="number" id="sellMonths" min="0" max="240" placeholder="e.g. 14" required>
                </div>
                <p id="sellMonthsPreview" class="form-hint hidden"></p>
            </div>

            <div class="sell-section">
                <h3>6. Asking Price</h3>
                <div class="form-field">
                    <label for="sellPrice">Price (₹)</label>
                    <input type="number" id="sellPrice" min="0" placeholder="e.g. 45000" required>
                </div>
            </div>

            <div class="sell-section">
                <h3>7. Location</h3>
                <div class="form-field">
                    <select id="sellLocation" required></select>
                </div>
            </div>

            <div class="sell-section">
                <h3>8. Reason for Selling</h3>
                <div class="form-field">
                    <textarea id="sellReason" rows="3" placeholder="Tell buyers why you're selling..." required></textarea>
                </div>
            </div>

            <div class="sell-section">
                <h3>9. Upload a Live Photo</h3>
                <p class="hero-subtitle" style="font-size:0.9rem; margin-bottom:0;">Take a photo with your camera, or upload one if the camera isn't available.</p>
                <video id="cameraPreview" autoplay playsinline class="camera-preview hidden"></video>
                <img id="capturedPreview" class="captured-preview hidden" alt="Captured device photo">
                <canvas id="captureCanvas" class="hidden"></canvas>
                <div class="sell-photo-actions">
                    <button type="button" id="startCameraBtn" class="btn-secondary">📷 Take Live Photo</button>
                    <button type="button" id="captureBtn" class="btn-primary hidden">Capture</button>
                    <button type="button" id="retakeBtn" class="btn-secondary hidden">Retake</button>
                    <label for="fileUploadInput" class="btn-secondary" style="cursor:pointer;">Upload a File Instead</label>
                    <input type="file" id="fileUploadInput" accept="image/*" class="hidden">
                </div>
                <p id="cameraError" class="camera-error hidden"></p>
            </div>

            <button type="submit" class="btn-primary large">List My Item</button>
        </form>
    `;
    wireForm();
}

function wireForm() {
    let selectedCategory = null;
    let capturedImageData = null;
    let mediaStream = null;

    const categoryButtons = document.querySelectorAll('.sell-category-option');
    const brandSelect = document.getElementById('sellBrand');
    const modelInput = document.getElementById('sellModel');
    const autoSpecsEl = document.getElementById('sellAutoSpecs');
    const ramSelect = document.getElementById('sellRam');
    const storageSelect = document.getElementById('sellStorage');
    const monthsInput = document.getElementById('sellMonths');
    const monthsPreview = document.getElementById('sellMonthsPreview');
    const locationSelect = document.getElementById('sellLocation');

    locationSelect.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('');

    // The auto-filled specs (everything except RAM/Storage, which the seller
    // still picks themselves since those genuinely vary unit-to-unit).
    let autoSpecs = {};

    function specPoolFor(category, brand) {
        const pools = category === 'Laptops' ? laptopSpecPools : mobileSpecPools;
        return pools[brand];
    }

    // Deterministic, not random: the same brand+model text always produces
    // the same auto-filled spec, so it reads as "detected" rather than
    // shuffled on every keystroke.
    function updateAutoSpecs() {
        const pool = specPoolFor(selectedCategory, brandSelect.value);
        if (!pool) {
            autoSpecsEl.innerHTML = '<p class="no-results" style="padding:0;">Pick a brand and model to auto-fill the rest of the spec sheet.</p>';
            autoSpecs = {};
            return;
        }
        const modelText = modelInput.value.trim();
        const seedBase = `${brandSelect.value}|${modelText.toLowerCase()}`;
        autoSpecs = {};
        Object.keys(pool).forEach(key => {
            if (key === 'RAM' || key === 'Storage') return;
            autoSpecs[key] = matchOptionFromText(modelText, pool[key]) || pickDeterministic(seedBase + '|' + key, pool[key]);
        });
        autoSpecsEl.innerHTML = Object.entries(autoSpecs).map(([key, val]) => `
            <div class="auto-spec-pill"><strong>${key}:</strong> ${val} <span class="form-hint">(auto-detected)</span></div>
        `).join('');
    }

    function populateRamStorage() {
        const pool = specPoolFor(selectedCategory, brandSelect.value);
        if (!pool) {
            ramSelect.disabled = true;
            storageSelect.disabled = true;
            ramSelect.innerHTML = '<option value="">Pick a brand first</option>';
            storageSelect.innerHTML = '<option value="">Pick a brand first</option>';
            return;
        }
        ramSelect.disabled = false;
        storageSelect.disabled = false;
        ramSelect.innerHTML = pool.RAM.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        storageSelect.innerHTML = pool.Storage.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    }

    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCategory = btn.dataset.category;

            const pools = selectedCategory === 'Laptops' ? laptopSpecPools : mobileSpecPools;
            brandSelect.disabled = false;
            brandSelect.innerHTML = '<option value="">Select a brand</option>' +
                Object.keys(pools).map(b => `<option value="${b}">${b}</option>`).join('');
            populateRamStorage();
            updateAutoSpecs();
        });
    });

    brandSelect.addEventListener('change', () => {
        populateRamStorage();
        updateAutoSpecs();
    });
    modelInput.addEventListener('input', updateAutoSpecs);

    monthsInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (isNaN(val) || val < 0) { monthsPreview.classList.add('hidden'); return; }
        monthsPreview.textContent = `Will show as "${formatDuration(val)} Used" on your listing.`;
        monthsPreview.classList.remove('hidden');
    });

    // --- Photo capture ---
    const video = document.getElementById('cameraPreview');
    const canvas = document.getElementById('captureCanvas');
    const capturedPreview = document.getElementById('capturedPreview');
    const startCameraBtn = document.getElementById('startCameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const fileInput = document.getElementById('fileUploadInput');
    const cameraError = document.getElementById('cameraError');

    function stopCamera() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(t => t.stop());
            mediaStream = null;
        }
    }

    function squareDataUrlFromSource(source, sw, sh) {
        const size = 480;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const side = Math.min(sw, sh);
        ctx.drawImage(source, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, size, size);
        return canvas.toDataURL('image/jpeg', 0.7);
    }

    function showCaptured(dataUrl) {
        capturedImageData = dataUrl;
        capturedPreview.src = dataUrl;
        capturedPreview.classList.remove('hidden');
        video.classList.add('hidden');
        captureBtn.classList.add('hidden');
        startCameraBtn.classList.add('hidden');
        retakeBtn.classList.remove('hidden');
        stopCamera();
    }

    startCameraBtn.addEventListener('click', async () => {
        cameraError.classList.add('hidden');
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = mediaStream;
            video.classList.remove('hidden');
            startCameraBtn.classList.add('hidden');
            captureBtn.classList.remove('hidden');
        } catch (err) {
            cameraError.textContent = "Couldn't access your camera — use \"Upload a File Instead\" below.";
            cameraError.classList.remove('hidden');
        }
    });

    captureBtn.addEventListener('click', () => {
        showCaptured(squareDataUrlFromSource(video, video.videoWidth, video.videoHeight));
    });

    retakeBtn.addEventListener('click', () => {
        capturedImageData = null;
        capturedPreview.classList.add('hidden');
        retakeBtn.classList.add('hidden');
        startCameraBtn.classList.remove('hidden');
        fileInput.value = '';
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => showCaptured(squareDataUrlFromSource(img, img.width, img.height));
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    // --- Submit ---
    document.getElementById('sellForm').addEventListener('submit', (e) => {
        e.preventDefault();

        if (!selectedCategory) { alert('Please choose Laptop or Mobile.'); return; }
        if (!brandSelect.value) { alert('Please choose a brand.'); return; }
        if (!capturedImageData) { alert('Please add a photo of your device.'); return; }

        const specs = Object.assign({}, autoSpecs, {
            RAM: ramSelect.value,
            Storage: storageSelect.value
        });

        const monthsUsed = parseInt(monthsInput.value) || 0;
        const price = parseInt(document.getElementById('sellPrice').value) || 0;
        const model = document.getElementById('sellModel').value.trim();

        const listing = {
            title: `${brandSelect.value} ${model}`,
            brand: brandSelect.value,
            category: selectedCategory,
            monthsUsed,
            location: locationSelect.value,
            price,
            originalPrice: price,
            specs,
            reasonForSelling: document.getElementById('sellReason').value.trim(),
            sellerName: getCurrentUser().name,
            sellerHistory: 0,
            userImage: capturedImageData
        };

        // `products` already includes the fixed catalog plus whatever user
        // listings existed at page load; back that out so we can predict the
        // new listing's id (data.js always appends in localStorage order).
        const existingBefore = JSON.parse(localStorage.getItem('bazaarin_user_listings') || '[]');
        const baseCatalogCount = products.length - existingBefore.length;
        existingBefore.push(listing);
        localStorage.setItem('bazaarin_user_listings', JSON.stringify(existingBefore));

        const newId = baseCatalogCount + existingBefore.length;
        window.location.href = `product.html?id=${newId}`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) {
        renderGate();
    } else if (user.accountType !== 'seller') {
        renderWrongAccountGate(user);
    } else {
        renderForm();
    }
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
