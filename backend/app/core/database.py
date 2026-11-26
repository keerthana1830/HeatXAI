from pymongo import MongoClient
from pymongo.database import Database
from app.core.config import settings
from app.core.logging import logger

client = None

def get_client() -> MongoClient:
    """Get the global MongoDB client."""
    global client
    if client is None:
        client = MongoClient(settings.MONGODB_URL)
    return client

def get_db() -> Database:
    """Dependency that provides a MongoDB database instance."""
    db = get_client().get_database()
    yield db

def init_db():
    """Initializes collections in MongoDB and seeds district data."""
    try:
        db = get_client().get_database()
        logger.info("Connected to MongoDB successfully.")

        # Seed Tamil Nadu districts if empty
        districts_collection = db.get_collection("districts")
        if districts_collection.count_documents({}) == 0:
            logger.info("Seeding Tamil Nadu districts data...")
            districts_data = [
                {"name": "Chennai", "lat": 13.0827, "lon": 80.2707, "lst": 38.5, "ndvi": 0.12, "ndbi": 0.65, "heat_index": 58.9, "risk_level": "Extreme"},
                {"name": "Coimbatore", "lat": 11.0168, "lon": 76.9558, "lst": 33.2, "ndvi": 0.28, "ndbi": 0.42, "heat_index": 37.8, "risk_level": "High"},
                {"name": "Madurai", "lat": 9.9252, "lon": 78.1198, "lst": 36.8, "ndvi": 0.18, "ndbi": 0.52, "heat_index": 49.3, "risk_level": "Extreme"},
                {"name": "Tiruchirappalli", "lat": 10.7905, "lon": 78.7047, "lst": 36.2, "ndvi": 0.22, "ndbi": 0.48, "heat_index": 45.6, "risk_level": "High"},
                {"name": "Salem", "lat": 11.6643, "lon": 78.1460, "lst": 35.5, "ndvi": 0.24, "ndbi": 0.45, "heat_index": 42.9, "risk_level": "High"},
                {"name": "Tirunelveli", "lat": 8.7139, "lon": 77.7567, "lst": 34.8, "ndvi": 0.25, "ndbi": 0.40, "heat_index": 40.0, "risk_level": "High"},
                {"name": "Vellore", "lat": 12.9165, "lon": 79.1325, "lst": 37.0, "ndvi": 0.15, "ndbi": 0.55, "heat_index": 51.8, "risk_level": "Extreme"},
                {"name": "Thoothukudi", "lat": 8.7642, "lon": 78.1348, "lst": 35.8, "ndvi": 0.10, "ndbi": 0.58, "heat_index": 53.0, "risk_level": "Extreme"},
                {"name": "Erode", "lat": 11.3410, "lon": 77.7172, "lst": 35.0, "ndvi": 0.27, "ndbi": 0.43, "heat_index": 40.6, "risk_level": "High"},
                {"name": "Thanjavur", "lat": 10.7870, "lon": 79.1378, "lst": 34.0, "ndvi": 0.35, "ndbi": 0.30, "heat_index": 32.3, "risk_level": "Moderate"},
                {"name": "Dindigul", "lat": 10.3673, "lon": 77.9803, "lst": 33.8, "ndvi": 0.30, "ndbi": 0.35, "heat_index": 35.5, "risk_level": "High"},
                {"name": "Tiruppur", "lat": 11.1085, "lon": 77.3411, "lst": 35.2, "ndvi": 0.20, "ndbi": 0.50, "heat_index": 45.8, "risk_level": "High"},
                {"name": "Kancheepuram", "lat": 12.8342, "lon": 79.7036, "lst": 36.0, "ndvi": 0.22, "ndbi": 0.44, "heat_index": 43.9, "risk_level": "High"},
                {"name": "Tiruvallur", "lat": 13.1428, "lon": 79.9088, "lst": 36.5, "ndvi": 0.20, "ndbi": 0.49, "heat_index": 47.1, "risk_level": "High"},
                {"name": "Chengalpattu", "lat": 12.6841, "lon": 79.9836, "lst": 35.0, "ndvi": 0.25, "ndbi": 0.42, "heat_index": 41.0, "risk_level": "High"},
                {"name": "Cuddalore", "lat": 11.7480, "lon": 79.7714, "lst": 34.5, "ndvi": 0.26, "ndbi": 0.38, "heat_index": 38.6, "risk_level": "High"},
                {"name": "Karur", "lat": 10.9601, "lon": 78.0766, "lst": 36.0, "ndvi": 0.18, "ndbi": 0.46, "heat_index": 46.1, "risk_level": "High"},
                {"name": "Nagapattinam", "lat": 10.7656, "lon": 79.8424, "lst": 33.5, "ndvi": 0.32, "ndbi": 0.28, "heat_index": 32.2, "risk_level": "Moderate"},
                {"name": "Namakkal", "lat": 11.2189, "lon": 78.1674, "lst": 34.8, "ndvi": 0.28, "ndbi": 0.39, "heat_index": 38.6, "risk_level": "High"},
                {"name": "Nilgiris", "lat": 11.4102, "lon": 76.6950, "lst": 22.5, "ndvi": 0.78, "ndbi": 0.05, "heat_index": 6.1, "risk_level": "Low"},
                {"name": "Perambalur", "lat": 11.2342, "lon": 78.8797, "lst": 35.5, "ndvi": 0.21, "ndbi": 0.44, "heat_index": 43.7, "risk_level": "High"},
                {"name": "Pudukkottai", "lat": 10.3797, "lon": 78.8205, "lst": 34.7, "ndvi": 0.28, "ndbi": 0.36, "heat_index": 37.5, "risk_level": "High"},
                {"name": "Ramanathapuram", "lat": 9.3639, "lon": 78.8395, "lst": 36.2, "ndvi": 0.14, "ndbi": 0.42, "heat_index": 46.3, "risk_level": "High"},
                {"name": "Sivaganga", "lat": 9.8433, "lon": 78.4802, "lst": 35.6, "ndvi": 0.22, "ndbi": 0.39, "heat_index": 41.7, "risk_level": "High"},
                {"name": "Tenkasi", "lat": 8.9591, "lon": 77.3142, "lst": 31.8, "ndvi": 0.45, "ndbi": 0.22, "heat_index": 24.5, "risk_level": "Moderate"},
                {"name": "Theni", "lat": 10.0104, "lon": 77.4768, "lst": 32.0, "ndvi": 0.48, "ndbi": 0.25, "heat_index": 24.6, "risk_level": "Moderate"},
                {"name": "Thiruvannamalai", "lat": 12.2274, "lon": 79.0700, "lst": 35.8, "ndvi": 0.21, "ndbi": 0.46, "heat_index": 44.8, "risk_level": "High"},
                {"name": "Tiruvarur", "lat": 10.7401, "lon": 79.6419, "lst": 33.8, "ndvi": 0.34, "ndbi": 0.29, "heat_index": 32.1, "risk_level": "Moderate"},
                {"name": "Dharmapuri", "lat": 12.1211, "lon": 78.1582, "lst": 34.5, "ndvi": 0.30, "ndbi": 0.38, "heat_index": 37.3, "risk_level": "High"},
                {"name": "Krishnagiri", "lat": 12.5186, "lon": 78.2137, "lst": 33.6, "ndvi": 0.32, "ndbi": 0.34, "heat_index": 34.3, "risk_level": "Moderate"},
                {"name": "Kallakurichi", "lat": 11.7383, "lon": 78.9639, "lst": 35.2, "ndvi": 0.24, "ndbi": 0.43, "heat_index": 41.9, "risk_level": "High"},
                {"name": "Mayiladuthurai", "lat": 11.1018, "lon": 79.6522, "lst": 33.6, "ndvi": 0.33, "ndbi": 0.27, "heat_index": 31.6, "risk_level": "Moderate"},
                {"name": "Ranipet", "lat": 12.9272, "lon": 79.3328, "lst": 36.6, "ndvi": 0.17, "ndbi": 0.53, "heat_index": 49.8, "risk_level": "Extreme"},
                {"name": "Tirupathur", "lat": 12.4933, "lon": 78.5678, "lst": 34.2, "ndvi": 0.29, "ndbi": 0.37, "heat_index": 36.9, "risk_level": "High"},
                {"name": "Viluppuram", "lat": 11.9398, "lon": 79.4862, "lst": 35.6, "ndvi": 0.23, "ndbi": 0.44, "heat_index": 43.1, "risk_level": "High"},
                {"name": "Virudhunagar", "lat": 9.5872, "lon": 77.9514, "lst": 36.4, "ndvi": 0.15, "ndbi": 0.47, "heat_index": 48.0, "risk_level": "High"},
                {"name": "Ariyalur", "lat": 11.1401, "lon": 79.0786, "lst": 35.8, "ndvi": 0.20, "ndbi": 0.45, "heat_index": 44.8, "risk_level": "High"},
                {"name": "Kanyakumari", "lat": 8.0883, "lon": 77.5385, "lst": 30.5, "ndvi": 0.58, "ndbi": 0.15, "heat_index": 17.4, "risk_level": "Low"}
            ]
            districts_collection.insert_many(districts_data)
            logger.info("Successfully seeded 38 districts of Tamil Nadu into MongoDB.")

    except Exception as e:
        logger.error("Error during database initialization", error=str(e))
        raise e
