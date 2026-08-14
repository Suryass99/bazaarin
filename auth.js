// Minimal mock auth — this is a static demo with no backend, so "signing in"
// just stores a display name and an account type locally (no password, no
// email, nothing resembling a real credential). Customer and Seller are
// deliberately separate account types: a Customer account can browse, buy,
// and chat with sellers, while a Seller account gets the Seller Dashboard
// (their listings + customer queries) and can list items via Sell.
const AUTH_KEY = 'bazaarin_user';

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY));
    } catch (e) {
        return null;
    }
}

function isLoggedIn() {
    return !!getCurrentUser();
}

function isSeller() {
    const user = getCurrentUser();
    return !!user && user.accountType === 'seller';
}

function login(name, accountType) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ name, accountType: accountType === 'seller' ? 'seller' : 'customer' }));
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
}

// Syncs the navbar's Sign In button / Logout link / Dashboard link with the
// current mock session. Safe to call on any page — no-ops if the elements
// aren't there.
function applyAuthUI() {
    const signInBtn = document.getElementById('signInBtn');
    const logoutLink = document.getElementById('logoutLink');
    const dashboardLink = document.getElementById('dashboardLink');
    const user = getCurrentUser();

    if (signInBtn) {
        if (user) {
            signInBtn.textContent = `Hi, ${user.name}`;
            signInBtn.href = user.accountType === 'seller' ? 'seller.html' : 'index.html';
        } else {
            signInBtn.textContent = 'Sign In';
            signInBtn.href = 'signin.html';
        }
    }

    if (dashboardLink) {
        dashboardLink.classList.toggle('hidden', !(user && user.accountType === 'seller'));
    }

    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
            location.reload();
        });
    }
}

document.addEventListener('DOMContentLoaded', applyAuthUI);
