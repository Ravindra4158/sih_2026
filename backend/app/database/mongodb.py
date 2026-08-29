import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

logger = logging.getLogger(__name__)

class DatabaseClient:
    client: AsyncIOMotorClient = None
    db = None

db_client = DatabaseClient()

def get_db():
    """Retrieve the database instance."""
    if db_client.client is None:
        logger.info("Connecting to MongoDB...")
        # settings.database_url is configured from MONGODB_URI
        # If it's a sqlite string (fallback), this will fail, so we should ensure it's a mongodb string
        uri = settings.database_url
        if not uri.startswith("mongodb"):
            uri = "mongodb://localhost:27017" # basic fallback if env not loaded properly
            logger.warning(f"Invalid MONGODB_URI format, falling back to {uri}")
            
        db_client.client = AsyncIOMotorClient(uri)
        db_client.db = db_client.client.get_default_database("Cluster0")
        if db_client.db is None:
             db_client.db = db_client.client["screening_db"]
    return db_client.db

def close_db():
    """Close the database connection."""
    if db_client.client:
        db_client.client.close()
        logger.info("MongoDB connection closed.")
