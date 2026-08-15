const products = [];
let currentId = 1;

const cities = [
    // Tier 1
    'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Chennai, India', 'Hyderabad, India', 'Pune, India', 'Ahmedabad, India', 'Kolkata, India',
    // Tier 2
    'Jaipur, India', 'Lucknow, India', 'Surat, India', 'Nagpur, India', 'Indore, India', 'Bhopal, India', 'Patna, India', 'Vadodara, India', 'Coimbatore, India', 'Kochi, India', 'Chandigarh, India', 'Nashik, India', 'Ludhiana, India', 'Visakhapatnam, India', 'Bhubaneswar, India', 'Guwahati, India', 'Thiruvananthapuram, India', 'Mysuru, India', 'Amritsar, India', 'Agra, India',
    // Tier 3
    'Meerut, India', 'Rajkot, India', 'Varanasi, India', 'Jodhpur, India', 'Ranchi, India', 'Raipur, India', 'Dehradun, India', 'Gwalior, India', 'Jabalpur, India', 'Vijayawada, India', 'Madurai, India', 'Jamshedpur, India', 'Siliguri, India', 'Warangal, India', 'Kota, India'
];

// Realistic, varied, category-specific reasons — split into a "barely used"
// pool (favored for low monthsUsed) and a general pool (favored otherwise)
// so the reason loosely matches how worn the device sounds.
const laptopReasonsFresh = [
    "Got this as a work bonus but I already had a laptop I'm happy with.",
    "Barely used it — kept it as a backup and just want the space back.",
    "Won it in a company raffle, never really needed a second machine.",
    "Bought it for a course that got cancelled, still practically new.",
    "Gift from a relative, but the specs don't suit my work."
];
const laptopReasonsGeneral = [
    "Upgrading to a newer model with better battery life.",
    "Switched to a desktop setup for gaming, this one's just collecting dust.",
    "Battery backup has dropped a lot with daily use, need something fresher.",
    "Moving abroad for studies and can't carry everything, selling a few things.",
    "Freelance project ended, don't need a second machine anymore.",
    "Upgrading to a model with a better GPU for video editing work.",
    "Selling to fund a new gaming PC build.",
    "It's a great laptop, just too heavy for my daily commute.",
    "Need the cash for some urgent expenses.",
    "Switching to a different operating system for work.",
    "Screen has a few scratches from travel, upgrading to a cleaner unit.",
    "Fan's gotten noisy after years of daily use, time to upgrade."
];

const mobileReasonsFresh = [
    "Got this as a gift but already had the same model.",
    "Barely used — kept it as a backup phone, decided to just sell it.",
    "Won this in a company raffle, already happy with my current phone.",
    "Bought on impulse during a sale, realized I didn't need it.",
    "Screen protector cracked but the phone itself is basically untouched."
];
const mobileReasonsGeneral = [
    "Upgraded to the newer model through a work contract, this one's spare.",
    "Switched to a different ecosystem, adjusting to the new one.",
    "Battery health has dropped noticeably, upgrading to something fresher.",
    "Selling to help cover some family expenses this month.",
    "Camera isn't good enough for the content I create now, need an upgrade.",
    "Moving to a different network and picked up a new phone with the plan.",
    "Minor wear from daily use, want a sturdier one for myself.",
    "Traveling light for a while, decided to simplify and sell what I don't need.",
    "Upgrading to a model with more storage, always running out of space.",
    "Back button's a bit finicky now, rather sell before it gets worse.",
    "Needed a bigger screen for reading, so picked up a new one.",
    "Selling this to help fund a family member's college fees."
];

function reasonsFor(category, monthsUsed) {
    const fresh = category === 'Laptops' ? laptopReasonsFresh : mobileReasonsFresh;
    const general = category === 'Laptops' ? laptopReasonsGeneral : mobileReasonsGeneral;
    // Low usage skews toward "barely used" framing; everything else draws
    // from the general pool so heavily-used units don't claim to be new.
    return monthsUsed <= 4 ? fresh.concat(general) : general;
}

// 10 distinct laptop listings — brand + line is unique per entry so no two
// products ever share a model.
const laptopModels = [
    { brand: 'Apple', line: 'MacBook Air M2' },
    { brand: 'Apple', line: 'MacBook Pro 14' },
    { brand: 'Asus', line: 'ROG Strix G15' },
    { brand: 'Asus', line: 'TUF Gaming A15' },
    { brand: 'Lenovo', line: 'ThinkPad X1 Carbon' },
    { brand: 'Lenovo', line: 'Legion 5' },
    { brand: 'Dell', line: 'XPS 13' },
    { brand: 'HP', line: 'Spectre x360' },
    { brand: 'Acer', line: 'Predator Helios 300' },
    { brand: 'MSI', line: 'Stealth 15M' },
    { brand: 'Apple', line: 'MacBook Pro 16' },
    { brand: 'Dell', line: 'Inspiron 15' },
    { brand: 'HP', line: 'Pavilion 15' },
    { brand: 'Lenovo', line: 'IdeaPad Slim 5' },
    { brand: 'Asus', line: 'Vivobook Pro 15' }
];

// 17 distinct mobile listings, same guarantee.
const mobileModels = [
    { brand: 'Apple', line: 'iPhone 13' },
    { brand: 'Apple', line: 'iPhone 12 Mini' },
    { brand: 'Apple', line: 'iPhone 11' },
    { brand: 'Samsung', line: 'Galaxy S21' },
    { brand: 'Samsung', line: 'Galaxy A52' },
    { brand: 'Samsung', line: 'Galaxy M32' },
    { brand: 'OnePlus', line: '9' },
    { brand: 'OnePlus', line: 'Nord 2' },
    { brand: 'OnePlus', line: '10R' },
    { brand: 'Nothing', line: 'Phone 1' },
    { brand: 'Nothing', line: 'Phone 2' },
    { brand: 'iQOO', line: '9' },
    { brand: 'iQOO', line: 'Neo 6' },
    { brand: 'Vivo', line: 'V23' },
    { brand: 'Oppo', line: 'Reno 6' },
    { brand: 'HTC', line: 'Desire 21' },
    { brand: 'Redmi', line: 'Note 11' },
    { brand: 'Samsung', line: 'Galaxy S22' },
    { brand: 'Apple', line: 'iPhone 14' },
    { brand: 'Redmi', line: 'Note 12 Pro' },
    { brand: 'Vivo', line: 'Y100' },
    { brand: 'OnePlus', line: '11R' }
];

// Approximate real Indian launch MRP (₹) per model — the baseline that gets
// depreciated by usage to produce the listed price.
const modelMRP = {
    'Apple MacBook Air M2': 114900,
    'Apple MacBook Pro 14': 194900,
    'Asus ROG Strix G15': 99990,
    'Asus TUF Gaming A15': 74990,
    'Lenovo ThinkPad X1 Carbon': 149990,
    'Lenovo Legion 5': 84990,
    'Dell XPS 13': 129990,
    'HP Spectre x360': 139990,
    'Acer Predator Helios 300': 119990,
    'MSI Stealth 15M': 109990,
    'Apple MacBook Pro 16': 239900,
    'Dell Inspiron 15': 54990,
    'HP Pavilion 15': 64990,
    'Lenovo IdeaPad Slim 5': 59990,
    'Asus Vivobook Pro 15': 69990,
    'Apple iPhone 13': 69900,
    'Apple iPhone 12 Mini': 69900,
    'Apple iPhone 11': 54900,
    'Samsung Galaxy S21': 69999,
    'Samsung Galaxy A52': 34999,
    'Samsung Galaxy M32': 16999,
    'OnePlus 9': 49999,
    'OnePlus Nord 2': 29999,
    'OnePlus 10R': 38999,
    'Nothing Phone 1': 32999,
    'Nothing Phone 2': 44999,
    'iQOO 9': 44990,
    'iQOO Neo 6': 34990,
    'Vivo V23': 35990,
    'Oppo Reno 6': 32990,
    'HTC Desire 21': 16990,
    'Redmi Note 11': 14999,
    'Samsung Galaxy S22': 72999,
    'Apple iPhone 14': 79900,
    'Redmi Note 12 Pro': 24999,
    'Vivo Y100': 20999,
    'OnePlus 11R': 39999
};

// 5% compounding reduction per month of use — e.g. 14 months used on a
// ₹69,900 MRP phone: 69900 * 0.95^14 ≈ ₹34,700.
function priceFromMRP(mrp, monthsUsed) {
    const raw = mrp * Math.pow(0.95, monthsUsed);
    return Math.max(1000, Math.round(raw / 500) * 500);
}

// Spec pools keyed by brand so a listing's spec sheet stays plausible for
// what that brand actually ships (Apple laptops never show an RTX GPU, gaming
// rigs never show "Integrated" graphics, etc).
const laptopSpecPools = {
    Apple:  { Processor: ['Apple M1', 'Apple M2'], RAM: ['8GB', '16GB'], Storage: ['256GB SSD', '512GB SSD', '1TB SSD'], GPU: ['Integrated'] },
    Asus:   { Processor: ['Intel Core i7', 'Intel Core i9', 'AMD Ryzen 7'], RAM: ['16GB', '32GB'], Storage: ['512GB SSD', '1TB SSD'], GPU: ['RTX 3060', 'RTX 3070', 'RTX 4060'] },
    Lenovo: { Processor: ['Intel Core i5', 'Intel Core i7', 'AMD Ryzen 5'], RAM: ['8GB', '16GB'], Storage: ['256GB SSD', '512GB SSD'], GPU: ['Integrated', 'RTX 3050'] },
    Dell:   { Processor: ['Intel Core i5', 'Intel Core i7'], RAM: ['8GB', '16GB'], Storage: ['512GB SSD', '1TB SSD'], GPU: ['Integrated'] },
    HP:     { Processor: ['Intel Core i5', 'Intel Core i7'], RAM: ['8GB', '16GB'], Storage: ['256GB SSD', '512GB SSD'], GPU: ['Integrated'] },
    Acer:   { Processor: ['Intel Core i7', 'AMD Ryzen 7', 'AMD Ryzen 9'], RAM: ['16GB', '32GB'], Storage: ['512GB SSD', '1TB SSD'], GPU: ['RTX 3060', 'RTX 3070'] },
    MSI:    { Processor: ['Intel Core i7', 'Intel Core i9'], RAM: ['16GB', '32GB'], Storage: ['512GB SSD', '1TB SSD'], GPU: ['RTX 3060', 'RTX 4060'] }
};

const mobileSpecPools = {
    Apple:   { Processor: ['Apple A15 Bionic', 'Apple A16 Bionic'], RAM: ['4GB', '6GB'], Storage: ['128GB', '256GB'], Camera: ['12MP Dual'] },
    Samsung: { Processor: ['Exynos 2200', 'Snapdragon 8 Gen 2'], RAM: ['6GB', '8GB', '12GB'], Storage: ['128GB', '256GB'], Camera: ['50MP Triple', '108MP'] },
    OnePlus: { Processor: ['Snapdragon 8 Gen 2', 'Snapdragon 8+ Gen 1'], RAM: ['8GB', '12GB'], Storage: ['128GB', '256GB'], Camera: ['50MP Triple'] },
    Nothing: { Processor: ['Snapdragon 8+ Gen 1', 'Dimensity 9000'], RAM: ['8GB', '12GB'], Storage: ['128GB', '256GB'], Camera: ['50MP Dual'] },
    iQOO:    { Processor: ['Snapdragon 8 Gen 2', 'Dimensity 9000'], RAM: ['8GB', '12GB'], Storage: ['128GB', '256GB'], Camera: ['50MP Triple'] },
    Vivo:    { Processor: ['Snapdragon 8+ Gen 1', 'Dimensity 9000'], RAM: ['8GB', '12GB'], Storage: ['128GB', '256GB'], Camera: ['50MP Triple'] },
    Oppo:    { Processor: ['Snapdragon 8+ Gen 1', 'Dimensity 9000'], RAM: ['8GB', '12GB'], Storage: ['128GB', '256GB'], Camera: ['50MP Triple'] },
    HTC:     { Processor: ['Snapdragon 8 Gen 1'], RAM: ['6GB', '8GB'], Storage: ['128GB'], Camera: ['48MP Triple'] },
    Redmi:   { Processor: ['Dimensity 9000', 'Snapdragon 8+ Gen 1'], RAM: ['6GB', '8GB'], Storage: ['128GB', '256GB'], Camera: ['108MP'] }
};

// Seeded PRNG (mulberry32) — the catalog below is regenerated from scratch
// on every page load (shop grid, product page, compare page, ...) since
// there's no backend to persist it. Using Math.random() meant the same
// product got a different location/price/specs depending on which page
// generated it, e.g. a listing showing "Kochi" in the shop grid would show
// a different city once you opened it. A fixed seed makes generation
// deterministic so every page derives the exact same catalog.
let seed = 20260814;
function seededRandom() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function randomChoice(arr) { return arr[Math.floor(seededRandom() * arr.length)]; }
function randomInt(min, max) { return Math.floor(seededRandom() * (max - min + 1)) + min; }
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Shuffle cities once and hand out unique ones in order, so no two listings
// (laptop or mobile) ever share a location.
const availableCities = shuffle([...cities]);
let cityCursor = 0;
function nextCity() { return availableCities[cityCursor++]; }

laptopModels.forEach(({ brand, line }) => {
    const pool = laptopSpecPools[brand];
    const title = `${brand} ${line}`;
    const monthsUsed = randomInt(1, 36);
    const mrp = modelMRP[title];
    products.push({
        id: currentId++,
        title,
        brand,
        category: 'Laptops',
        monthsUsed,
        location: nextCity(),
        price: priceFromMRP(mrp, monthsUsed),
        originalPrice: mrp,
        specs: {
            Processor: randomChoice(pool.Processor),
            RAM: randomChoice(pool.RAM),
            Storage: randomChoice(pool.Storage),
            GPU: randomChoice(pool.GPU)
        },
        reasonForSelling: randomChoice(reasonsFor('Laptops', monthsUsed)),
        sellerName: 'Seller ' + randomInt(100, 999),
        sellerHistory: randomInt(0, 20)
    });
});

mobileModels.forEach(({ brand, line }) => {
    const pool = mobileSpecPools[brand];
    const title = `${brand} ${line}`;
    const monthsUsed = randomInt(1, 36);
    const mrp = modelMRP[title];
    products.push({
        id: currentId++,
        title,
        brand,
        category: 'Mobiles',
        monthsUsed,
        location: nextCity(),
        price: priceFromMRP(mrp, monthsUsed),
        originalPrice: mrp,
        specs: {
            Processor: randomChoice(pool.Processor),
            RAM: randomChoice(pool.RAM),
            Storage: randomChoice(pool.Storage),
            Camera: randomChoice(pool.Camera)
        },
        reasonForSelling: randomChoice(reasonsFor('Mobiles', monthsUsed)),
        sellerName: 'Seller ' + randomInt(100, 999),
        sellerHistory: randomInt(0, 20)
    });
});

// Merge in anything the user has listed via sell.html. There's no backend
// here, so these are persisted client-side; ids continue right after the
// generated catalog and stay stable across reloads since this array is
// always appended in the same (localStorage) order.
try {
    const userListings = JSON.parse(localStorage.getItem('bazaarin_user_listings')) || [];
    userListings.forEach(listing => {
        products.push(Object.assign({}, listing, { id: currentId++ }));
    });
} catch (e) {
    // Corrupt/blocked storage — just skip user listings for this load.
}

// Shuffle display order so laptops and mobiles are mixed naturally in the grid
shuffle(products);
