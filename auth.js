// Minimal mock auth — this is a static demo with no backend, so "signing in"
// just stores a display name and an account type locally (no password, no
// email, nothing resembling a real credential). Customer, Seller, and Admin
// are deliberately separate account types: a Customer account can browse,
// buy, and chat with sellers; a Seller account gets the Seller Dashboard
// (their listings + customer queries) and can list items via Sell; an Admin
// account gets the staff Admin dashboard, scoped to one of three
// departments (stats, techsupport, finance) chosen at sign-in.
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

function isAdmin() {
    const user = getCurrentUser();
    return !!user && user.accountType === 'admin';
}

function login(name, accountType, department) {
    const type = accountType === 'seller' ? 'seller' : accountType === 'admin' ? 'admin' : 'customer';
    const user = { name, accountType: type };
    if (type === 'admin') user.department = department;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
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
            signInBtn.href = user.accountType === 'seller' ? 'seller.html' : user.accountType === 'admin' ? 'admin.html' : 'index.html';
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
