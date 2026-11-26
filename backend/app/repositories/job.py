from typing import List, Dict, Any
from pymongo.database import Database
from app.repositories.base import BaseRepository

class JobRepository(BaseRepository):
    """Job-specific repository extending CRUD actions with custom queries."""
    
    def __init__(self):
        super().__init__("jobs")

    def get_recent_jobs(self, db: Database, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch the most recent ingestion/processing jobs."""
        docs = list(db[self.collection_name].find().sort("created_at", -1).limit(limit))
        return [self._map_id(d) for d in docs]

# Global Repository instance
job_repo = JobRepository()
