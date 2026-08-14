// Approximate real-world coordinates for every city in data.js, so listings
// can be sorted/filtered by geographic proximity to a buyer's location.
const cityCoordinates = {
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Delhi': { lat: 28.7041, lng: 77.1025 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Lucknow': { lat: 26.8467, lng: 80.9462 },
    'Surat': { lat: 21.1702, lng: 72.8311 },
    'Nagpur': { lat: 21.1458, lng: 79.0882 },
    'Indore': { lat: 22.7196, lng: 75.8577 },
    'Bhopal': { lat: 23.2599, lng: 77.4126 },
    'Patna': { lat: 25.5941, lng: 85.1376 },
    'Vadodara': { lat: 22.3072, lng: 73.1812 },
    'Coimbatore': { lat: 11.0168, lng: 76.9558 },
    'Kochi': { lat: 9.9312, lng: 76.2673 },
    'Chandigarh': { lat: 30.7333, lng: 76.7794 },
    'Nashik': { lat: 19.9975, lng: 73.7898 },
    'Ludhiana': { lat: 30.9010, lng: 75.8573 },
    'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
    'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
    'Guwahati': { lat: 26.1445, lng: 91.7362 },
    'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
    'Mysuru': { lat: 12.2958, lng: 76.6394 },
    'Amritsar': { lat: 31.6340, lng: 74.8723 },
    'Agra': { lat: 27.1767, lng: 78.0081 },
    'Meerut': { lat: 28.9845, lng: 77.7064 },
    'Rajkot': { lat: 22.3039, lng: 70.8022 },
    'Varanasi': { lat: 25.3176, lng: 82.9739 },
    'Jodhpur': { lat: 26.2389, lng: 73.0243 },
    'Ranchi': { lat: 23.3441, lng: 85.3096 },
    'Raipur': { lat: 21.2514, lng: 81.6296 },
    'Dehradun': { lat: 30.3165, lng: 78.0322 },
    'Gwalior': { lat: 26.2183, lng: 78.1828 },
    'Jabalpur': { lat: 23.1815, lng: 79.9864 },
    'Vijayawada': { lat: 16.5062, lng: 80.6480 },
    'Madurai': { lat: 9.9252, lng: 78.1198 },
    'Jamshedpur': { lat: 22.8046, lng: 86.2029 },
    'Siliguri': { lat: 26.7271, lng: 88.3953 },
    'Warangal': { lat: 17.9689, lng: 79.5941 },
    'Kota': { lat: 25.2138, lng: 75.8648 }
};

function coordsForLocation(location) {
    const city = location.split(',')[0].trim();
    return cityCoordinates[city] || null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

window.cityCoordinates = cityCoordinates;
window.coordsForLocation = coordsForLocation;
window.haversineKm = haversineKm;
