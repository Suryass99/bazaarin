// This is a static demo with no backend, so there's no real OAuth to wire up
// for Google/Apple and no real SMS gateway for the OTP — all three provider
// paths are simulated (with a brief "connecting" delay for Google/Apple, and
// an OTP step that accepts any code) and end at the same local, name-only
// login. Account type (customer vs seller) is chosen first and kept
// separate — a Seller account gets the Seller Dashboard instead of just
// browsing/buying.
const introSubtitle = document.getElementById('introSubtitle');
const roleOptions = document.getElementById('roleOptions');
const authOptions = document.getElementById('authOptions');
const authConnecting = document.getElementById('authConnecting');
const connectingText = document.getElementById('connectingText');
const mobileForm = document.getElementById('mobileForm');
const otpForm = document.getElementById('otpForm');
const nameForm = document.getElementById('nameForm');
const nameFormNote = document.getElementById('nameFormNote');

const steps = [roleOptions, authOptions, authConnecting, mobileForm, otpForm, nameForm];
function showOnly(el) {
    steps.forEach(s => s.classList.add('hidden'));
    el.classList.remove('hidden');
}

let selectedRole = null;

function chooseRole(role) {
    selectedRole = role;
    introSubtitle.textContent = role === 'seller'
        ? "Signing in as a Seller — choose how you'd like to continue."
        : "Signing in as a Customer — choose how you'd like to continue.";
    showOnly(authOptions);
}

document.getElementById('roleCustomerBtn').addEventListener('click', () => chooseRole('customer'));
document.getElementById('roleSellerBtn').addEventListener('click', () => chooseRole('seller'));

// A gate (like sell.html or seller.html) can link here with ?role=seller to
// skip the role step entirely since intent is already clear.
const presetRole = new URLSearchParams(window.location.search).get('role');
if (presetRole === 'seller' || presetRole === 'customer') {
    chooseRole(presetRole);
}

function goToNameStep(note) {
    nameFormNote.textContent = note;
    showOnly(nameForm);
}

document.getElementById('googleBtn').addEventListener('click', () => {
    connectingText.textContent = 'Connecting to Google…';
    showOnly(authConnecting);
    setTimeout(() => {
        goToNameStep("This demo can't pull a real Google profile — just confirm a display name to finish.");
    }, 1000);
});

document.getElementById('appleBtn').addEventListener('click', () => {
    connectingText.textContent = 'Connecting to Apple…';
    showOnly(authConnecting);
    setTimeout(() => {
        goToNameStep("This demo can't pull a real Apple profile — just confirm a display name to finish.");
    }, 1000);
});

document.getElementById('mobileBtn').addEventListener('click', () => {
    showOnly(mobileForm);
});

mobileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showOnly(otpForm);
});

otpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = document.getElementById('mobileNumber').value.trim();
    goToNameStep(`Verified ${phone} — enter a display name to finish.`);
});

nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('displayName').value.trim();
    if (!name) return;
    login(name, selectedRole);
    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get('redirect') || (selectedRole === 'seller' ? 'seller.html' : 'index.html');
});

document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => showOnly(authOptions));
});
document.querySelectorAll('[data-back-role]').forEach(btn => {
    btn.addEventListener('click', () => showOnly(roleOptions));
});
