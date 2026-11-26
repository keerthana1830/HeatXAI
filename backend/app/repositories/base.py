from typing import Any, Dict, List, Optional
from pymongo.database import Database
from bson import ObjectId

class BaseRepository:
    """Base repository class with standard MongoDB CRUD queries."""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    def _map_id(self, doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Helper to convert MongoDB _id to string id."""
        if doc and "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    def get(self, db: Database, id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single record by string ID."""
        try:
            obj_id = ObjectId(id)
        except Exception:
            return None
            
        doc = db[self.collection_name].find_one({"_id": obj_id})
        return self._map_id(doc)

    def get_multi(self, db: Database, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch multiple records with offset and limit pagination."""
        docs = list(db[self.collection_name].find({}).skip(skip).limit(limit))
        return [self._map_id(d) for d in docs]

    def create(self, db: Database, obj_in: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new document to the collection."""
        result = db[self.collection_name].insert_one(obj_in.copy())
        doc = db[self.collection_name].find_one({"_id": result.inserted_id})
        return self._map_id(doc)

    def update(self, db: Database, id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates attributes of an existing document."""
        try:
            obj_id = ObjectId(id)
        except Exception:
            return None
            
        db[self.collection_name].update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
        doc = db[self.collection_name].find_one({"_id": obj_id})
        return self._map_id(doc)

    def remove(self, db: Database, id: str) -> Optional[Dict[str, Any]]:
        """Removes a record from the database by ID."""
        try:
            obj_id = ObjectId(id)
        except Exception:
            return None
            
        doc = db[self.collection_name].find_one({"_id": obj_id})
        if doc:
            db[self.collection_name].delete_one({"_id": obj_id})
            return self._map_id(doc)
        return None
