from typing import Optional, List, Dict, Any
from pymongo.database import Database
from app.repositories.base import BaseRepository

class DistrictRepository(BaseRepository):
    """District-specific repository extending CRUD actions with custom queries."""
    
    def __init__(self):
        super().__init__("districts")

    def get_by_name(self, db: Database, name: str) -> Optional[Dict[str, Any]]:
        """Fetch a single district by its name."""
        doc = db[self.collection_name].find_one({"name": name})
        return self._map_id(doc)

    def get_all(self, db: Database) -> List[Dict[str, Any]]:
        """Fetch all districts."""
        docs = list(db[self.collection_name].find().sort("name", 1))
        return [self._map_id(d) for d in docs]

# Global Repository instance
district_repo = DistrictRepository()
