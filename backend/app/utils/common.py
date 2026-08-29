import asyncio
from typing import Dict, Any
from ..database.mongodb import get_db

class SessionStore:
    """Store for session data backed by MongoDB."""
    
    @staticmethod
    def get_collection():
        db = get_db()
        return db["sessions"]

    @classmethod
    async def set(cls, session_id: str, key: str, value: Any) -> None:
        col = cls.get_collection()
        await col.update_one(
            {"session_id": session_id},
            {"$set": {key: value}},
            upsert=True
        )

    @classmethod
    async def get(cls, session_id: str, key: str, default: Any = None) -> Any:
        col = cls.get_collection()
        doc = await col.find_one({"session_id": session_id})
        if doc and key in doc:
            return doc[key]
        return default

    @classmethod
    async def get_all(cls, session_id: str) -> Dict[str, Any]:
        col = cls.get_collection()
        doc = await col.find_one({"session_id": session_id})
        if doc:
            doc.pop("_id", None)
            return doc
        return {}

    @classmethod
    async def clear(cls, session_id: str) -> None:
        col = cls.get_collection()
        await col.delete_one({"session_id": session_id})
