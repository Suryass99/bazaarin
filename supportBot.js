// Rule-based assistant used by both the buyer-facing "Bazaarin Support" tab
// (product.js) and the seller dashboard's support chat (seller.js). A live
// Claude-powered chat isn't wired in here because this is a static site with
// no backend: an API key embedded in client-side JS would be visible to
// anyone viewing the page source, which is a real security hole, not a
// hypothetical one. This keyword matcher is the safe stand-in.
function getSupportReply(message) {
    const m = message.toLowerCase();
    const rules = [
        { keys: ['refund', 'return', 'money back'], reply: "Refunds are available within 7 days of delivery if the device doesn't match the listed condition — open a dispute from your Orders page and our team steps in." },
        { keys: ['deliver', 'shipping', 'ship', 'when will i get', 'arrive'], reply: "Most orders are delivered within 3-5 business days. You'll get a tracking link by SMS and email once the seller ships it." },
        { keys: ['payment', 'cod', 'cash on delivery', 'upi', 'pay', 'emi'], reply: "We support UPI, cards, and Cash on Delivery for orders under ₹50,000. Payment is only released to the seller after you confirm the device works." },
        { keys: ['warranty', 'guarantee'], reply: "Every listing marked 'Verified Refurbished' comes with a 6-month Bazaarin warranty covering hardware defects." },
        { keys: ['seller', 'trust', 'genuine', 'fake', 'scam', 'verified'], reply: "All sellers are ID-verified and rated by past buyers — check the seller card on this page for their sale history before you buy." },
        { keys: ['negotiate', 'price', 'discount', 'lower', 'cheap'], reply: "You're welcome to negotiate directly with the seller in the 'Chat with Seller' tab — most sellers do accept reasonable offers." },
        { keys: ['cancel'], reply: "You can cancel an order for free before it ships, from the Orders page. After that it falls under our return policy." },
        { keys: ['damage', 'broken', 'not working', 'defect'], reply: "Sorry to hear that. If a device arrives damaged or not as described, open a dispute within 48 hours of delivery and we'll arrange a replacement or refund." },
        { keys: ['not replying', "hasn't replied", 'no reply', 'no response', 'ignoring'], reply: "Sorry about the wait — if a seller goes quiet for more than a day, we can step in directly. Share the product name and we'll follow up with them on your behalf." },
        { keys: ['listing', 'my product', 'my item', 'edit my'], reply: "You can manage your listings and see buyer messages from your Seller Dashboard — the link's in the menu once you're signed in as a seller." },
        { keys: ['hi', 'hello', 'hey'], reply: "Hi there! I'm the Bazaarin Support assistant. Ask me about returns, payments, delivery, or seller verification." },
        { keys: ['human', 'agent', 'person', 'talk to someone'], reply: "I can loop in a human teammate — drop your email or phone number and someone from our team will reach out within a few hours." }
    ];
    const hit = rules.find(rule => rule.keys.some(k => m.includes(k)));
    if (hit) return hit.reply;
    return "Thanks for reaching out! I've noted your message — for anything I can't answer here, our human support team will follow up by email shortly.";
}

window.getSupportReply = getSupportReply;
