import json
import random

cities = ['Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Pune, India', 'Hyderabad, India', 'Chennai, India', 'Ahmedabad, India', 'Kolkata, India', 'Jaipur, India', 'Lucknow, India']
laptop_brands = ['Apple MacBook', 'Asus ROG', 'Lenovo ThinkPad', 'Dell XPS', 'HP Spectre', 'Acer Predator', 'MSI Stealth']
mobile_brands = ['Apple iPhone', 'HTC Desire', 'iQOO', 'Redmi Note', 'OnePlus', 'Nothing Phone', 'Samsung Galaxy', 'Vivo', 'Oppo']

laptop_specs_pool = {
    'Processor': ['Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2'],
    'RAM': ['8GB', '16GB', '32GB'],
    'Storage': ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'],
    'GPU': ['Integrated', 'RTX 3050', 'RTX 3060', 'RTX 4060', 'RTX 3070']
}

mobile_specs_pool = {
    'Processor': ['Snapdragon 8 Gen 2', 'Snapdragon 8+ Gen 1', 'Dimensity 9000', 'Apple A15 Bionic', 'Apple A16 Bionic', 'Exynos 2200'],
    'RAM': ['6GB', '8GB', '12GB', '16GB'],
    'Storage': ['128GB', '256GB', '512GB'],
    'Camera': ['50MP Dual', '50MP Triple', '108MP', '200MP', '48MP Triple']
}

reasons = [
    'Upgrading to a newer model.',
    'Need cash urgently.',
    'Switching to a different operating system.',
    'Got a new one from work, so selling this.',
    'Barely used it, just lying around.',
    'Too big for my hands.',
    'Battery life is not enough for my extreme usage.',
    'Gift from a relative, but I prefer my old one.'
]

products = []
current_id = 1

# Generate Laptops (Total ~104 to include original 4)
for _ in range(104):
    brand = random.choice(laptop_brands)
    model = f"{brand} {random.randint(10, 99)}"
    price = random.randint(40000, 80000)
    original_price = price + random.randint(10000, 50000)
    days_used = random.randint(10, 1000)
    
    specs = {
        'Processor': random.choice(laptop_specs_pool['Processor']),
        'RAM': random.choice(laptop_specs_pool['RAM']),
        'Storage': random.choice(laptop_specs_pool['Storage']),
        'GPU': random.choice(laptop_specs_pool['GPU'])
    }
    
    # Randomly assign original successful laptop images
    img = random.choice(['img_asus.jpg', 'img_lenovo.jpg'])
    
    products.append({
        'id': current_id,
        'title': model,
        'category': 'Laptops',
        'daysUsed': days_used,
        'location': random.choice(cities),
        'price': price,
        'originalPrice': original_price,
        'image': img,
        'specs': specs,
        'reasonForSelling': random.choice(reasons),
        'sellerName': f"Seller {random.randint(100, 999)}",
        'sellerHistory': random.randint(0, 20)
    })
    current_id += 1

# Generate Mobiles (Total ~79 to include original 4)
for _ in range(79):
    brand = random.choice(mobile_brands)
    model = f"{brand} {random.randint(1, 20)}"
    price = random.randint(15000, 40000)
    original_price = price + random.randint(5000, 20000)
    days_used = random.randint(10, 1000)
    
    specs = {
        'Processor': random.choice(mobile_specs_pool['Processor']),
        'RAM': random.choice(mobile_specs_pool['RAM']),
        'Storage': random.choice(mobile_specs_pool['Storage']),
        'Camera': random.choice(mobile_specs_pool['Camera'])
    }
    
    # We will assign the new held mobile images here
    img = 'mobile.jpg'
    
    products.append({
        'id': current_id,
        'title': model,
        'category': 'Mobiles',
        'daysUsed': days_used,
        'location': random.choice(cities),
        'price': price,
        'originalPrice': original_price,
        'image': img,
        'specs': specs,
        'reasonForSelling': random.choice(reasons),
        'sellerName': f"Seller {random.randint(100, 999)}",
        'sellerHistory': random.randint(0, 20)
    })
    current_id += 1

# Shuffle the list
random.shuffle(products)

with open('data.js', 'w', encoding='utf-8') as f:
    f.write('const products = ')
    json.dump(products, f, indent=4)
    f.write(';')

print("Successfully generated data.js with 183 products.")
