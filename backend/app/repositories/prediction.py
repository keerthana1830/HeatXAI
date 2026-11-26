from typing import List, Dict, Any
from pymongo.database import Database
from app.repositories.base import BaseRepository

class PredictionRepository(BaseRepository):
    """Prediction-specific repository extending CRUD actions with custom queries."""
    
    def __init__(self):
        super().__init__("predictions")

    def get_by_district(self, db: Database, district_id: str, model_type: str = None) -> List[Dict[str, Any]]:
        """Fetch future predictions for a district."""
        query = {"district_id": district_id}
        if model_type:
            query["model_type"] = model_type
        docs = list(db[self.collection_name].find(query).sort("prediction_date", 1))
        return [self._map_id(d) for d in docs]

# Global Repository instance
prediction_repo = PredictionRepository()
