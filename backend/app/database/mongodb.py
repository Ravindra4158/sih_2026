"""
mongodb.py – Async MongoDB client using Motor + MongoDB Atlas.
Includes automatic fallback to a local MongoDB instance on localhost if Atlas fails.
"""
import logging
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load MONGODB_URI from .env at repo root if not already in environment
# ---------------------------------------------------------------------------
def _load_mongo_uri() -> str:
    uri = os.environ.get("MONGODB_URI", "")
    if uri:
        return uri

    # Walk up to find the .env file (works regardless of CWD)
    search = Path(__file__).resolve()
    for _ in range(6):
        candidate = search / ".env"
        if candidate.exists():
            for line in candidate.read_text().splitlines():
                line = line.strip()
                if line.startswith("MONGODB_URI="):
                    uri = line.split("=", 1)[1].strip()
                    logger.info(f"Loaded MONGODB_URI from {candidate}")
                    return uri
        search = search.parent

    return ""


MONGODB_URI = _load_mongo_uri()
DB_NAME = "border_screening"


class DatabaseClient:
    client: AsyncIOMotorClient = None
    db = None


db_client = DatabaseClient()


def get_db():
    """Return the Motor database instance, creating the connection on first call.
    Uses a synchronous MongoClient to verify Atlas availability first, falling back
    to localhost if it fails (e.g. due to IP whitelist blocks).
    """
    if db_client.client is None:
        primary_uri = MONGODB_URI
        fallback_uri = "mongodb://localhost:27017"
        uri_to_use = fallback_uri

        if primary_uri:
            logger.info("Verifying MongoDB Atlas connectivity...")
            try:
                # Direct check with a short timeout
                sync_client = MongoClient(primary_uri, serverSelectionTimeoutMS=2000)
                sync_client.admin.command("ping")
                logger.info("Successfully connected to MongoDB Atlas!")
                uri_to_use = primary_uri
            except Exception as e:
                logger.warning(
                    f"MongoDB Atlas connection check failed: {e}. Falling back to localhost..."
                )
        else:
            logger.info("No MONGODB_URI env variable set. Using local database.")

        logger.info(f"Initializing AsyncIOMotorClient on {uri_to_use[:40]}...")
        db_client.client = AsyncIOMotorClient(uri_to_use)
        db_client.db = db_client.client[DB_NAME]

    return db_client.db


def close_db():
    """Close the Motor connection pool."""
    if db_client.client:
        db_client.client.close()
        db_client.client = None
        db_client.db = None
        logger.info("MongoDB connection closed.")
