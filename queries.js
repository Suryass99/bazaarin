// Shared "customer queries" store — messages buyers send to sellers via
// Chat with Seller, persisted so the seller can see them later from their
// dashboard. There's no backend here, so this localStorage list stands in
// for a real inbox, and the automatic in-chat "we'll get back to you"
// bubble does NOT count as the seller actually answering — only marking a
// query as replied from the Seller Dashboard does, which is what the
// "seller hasn't replied" escalation checks against.
const QUERIES_KEY = 'bazaarin_customer_queries';

function getQueries() {
    try {
        return JSON.parse(localStorage.getItem(QUERIES_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveQueries(list) {
    localStorage.setItem(QUERIES_KEY, JSON.stringify(list));
}

function recordBuyerMessage(product, buyerName, message) {
    const list = getQueries();
    list.push({
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        productId: product.id,
        productTitle: product.title,
        sellerName: product.sellerName,
        buyerName: buyerName || 'A buyer (not signed in)',
        message,
        timestamp: Date.now(),
        answered: false
    });
    saveQueries(list);
}

function markQueryReplied(queryId) {
    const list = getQueries();
    const q = list.find(q => q.id === queryId);
    if (q) {
        q.answered = true;
        saveQueries(list);
    }
}

function queriesForSeller(sellerName) {
    return getQueries()
        .filter(q => q.sellerName === sellerName)
        .sort((a, b) => b.timestamp - a.timestamp);
}

// True once the oldest unanswered message to this product's seller has been
// waiting at least `hoursThreshold` hours.
function hasStaleUnansweredQuery(productId, hoursThreshold) {
    const pending = getQueries().filter(q => q.productId === productId && !q.answered);
    if (pending.length === 0) return false;
    const oldest = Math.min(...pending.map(q => q.timestamp));
    return (Date.now() - oldest) / (1000 * 60 * 60) >= hoursThreshold;
}

window.recordBuyerMessage = recordBuyerMessage;
window.markQueryReplied = markQueryReplied;
window.queriesForSeller = queriesForSeller;
window.getQueries = getQueries;
window.hasStaleUnansweredQuery = hasStaleUnansweredQuery;
