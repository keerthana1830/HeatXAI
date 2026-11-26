from typing import Optional, Dict, Any
from pymongo.database import Database
from app.repositories.base import BaseRepository
from app.schemas.auth import UserCreate
from app.core.security import get_password_hash

class UserRepository(BaseRepository):
    """User-specific repository extending CRUD actions with custom queries."""
    
    def __init__(self):
        super().__init__("users")

    def get_by_email(self, db: Database, email: str) -> Optional[Dict[str, Any]]:
        """Fetch a single user by their email address."""
        doc = db[self.collection_name].find_one({"email": email})
        return self._map_id(doc)

    def create_user(self, db: Database, user_in: UserCreate) -> Dict[str, Any]:
        """Create a user with hashed password and initial role."""
        user_dict = {
            "email": user_in.email,
            "hashed_password": get_password_hash(user_in.password),
            "full_name": user_in.full_name,
            "role": user_in.role or "user"
        }
        return self.create(db, user_dict)

# Global Repository instance
user_repo = UserRepository()
