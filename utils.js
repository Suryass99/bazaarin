// Shared display helpers.

// Anything 11 months or under shows as months; 12+ rolls into
// "X Year(s) Y Month(s)" (e.g. 14 -> "1 Year 2 Months").
function formatDuration(months) {
    const m = Math.max(0, Math.round(months));
    if (m <= 11) return `${m} Month${m === 1 ? '' : 's'}`;
    const years = Math.floor(m / 12);
    const rem = m % 12;
    let label = `${years} Year${years === 1 ? '' : 's'}`;
    if (rem > 0) label += ` ${rem} Month${rem === 1 ? '' : 's'}`;
    return label;
}

window.formatDuration = formatDuration;

// Condition grade shown on product cards and the product page. Derived from
// age alone — there's no inspection data behind it, it's just a friendlier
// reading of "how long has this been in use" than a raw month count.
function conditionGrade(months) {
    const m = Math.max(0, Math.round(months));
    if (m <= 6) return 'Like New';
    if (m <= 14) return 'Excellent';
    if (m <= 26) return 'Good';
    return 'Fair';
}

window.conditionGrade = conditionGrade;

// The one-line spec summary under a product title, e.g.
// "16GB RAM • 512GB SSD • 14 Months used".
function specSummary(product) {
    const specs = product.specs || {};
    const parts = [];
    if (specs.RAM) parts.push(specs.RAM + ' RAM');
    if (specs.Storage) parts.push(specs.Storage);
    parts.push(formatDuration(product.monthsUsed) + ' used');
    return parts.join(' • ');
}

window.specSummary = specSummary;

// Deterministic (not random) text -> pick, so the same brand/model always
// auto-fills the same spec instead of jittering on every keystroke.
function hashText(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
}

function pickDeterministic(text, options) {
    if (!options || options.length === 0) return '';
    return options[hashText(text) % options.length];
}

window.hashText = hashText;
window.pickDeterministic = pickDeterministic;

function formatRelativeTime(timestamp) {
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}
window.formatRelativeTime = formatRelativeTime;

// Prefer an option whose own distinctive token literally appears in the
// typed text (so "MacBook Air M2" matches the "Apple M2" option, not a
// random pick that could contradict what's right there in the name).
function isUsableToken(t) {
    if (/^[0-9]+$/.test(t)) return t.length >= 3; // bare digits need 3+ to avoid noise
    return t.length >= 2;
}

function matchOptionFromText(text, options) {
    const lower = (text || '').toLowerCase();
    if (!lower) return null;

    // Words shared by every option in the pool (e.g. "RTX", "Apple") don't
    // discriminate between them, so only match on tokens unique to a single
    // option — otherwise "RTX 4060" in the text could match "RTX 3060" just
    // because they share the word "RTX".
    const tokenSets = options.map(opt => new Set((opt.toLowerCase().match(/[a-z0-9]+/g) || []).filter(isUsableToken)));
    const tokenCounts = {};
    tokenSets.forEach(set => set.forEach(t => { tokenCounts[t] = (tokenCounts[t] || 0) + 1; }));

    for (let i = 0; i < options.length; i++) {
        const uniqueTokens = Array.from(tokenSets[i]).filter(t => tokenCounts[t] === 1);
        if (uniqueTokens.some(t => lower.includes(t))) return options[i];
    }
    return null;
}

window.matchOptionFromText = matchOptionFromText;

// EMI financiers — annual interest rates spread 4%-8%, reducing-balance EMI.
// Shared by the product page (customer-facing EMI table) and the admin
// finance dashboard (aggregate EMI figures).
const emiFinanciers = [
    { name: 'Bajaj Finserv', rate: 4 },
    { name: 'HDFC Bank', rate: 5 },
    { name: 'IDFC First Bank', rate: 6 },
    { name: 'ZestMoney', rate: 7 },
    { name: 'Home Credit', rate: 8 }
];
const emiTenures = [6, 12, 24];

function calculateEMI(principal, annualRatePercent, months) {
    const r = annualRatePercent / 12 / 100;
    const emi = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
    return Math.round(emi);
}

window.emiFinanciers = emiFinanciers;
window.emiTenures = emiTenures;
window.calculateEMI = calculateEMI;
