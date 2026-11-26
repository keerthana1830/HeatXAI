from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.database import Database
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.core.database import get_db
from app.api.auth import get_current_user
from app.schemas.suggestion import SuggestionCreate, SuggestionResponse

router = APIRouter(prefix="/suggestions", tags=["suggestions"])

def map_id(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

@router.get("", response_model=List[SuggestionResponse])
def list_suggestions(
    district: Optional[str] = Query(None, description="Filter by district name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    sort: Optional[str] = Query("votes", description="Sort order: 'votes' | 'newest' | 'oldest'"),
    db: Database = Depends(get_db),
):
    """List all community suggestions with optional filters. Public endpoint."""
    query = {"status": "approved"}

    if district:
        query["district"] = district

    if category:
        query["category"] = category

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]

    cursor = db["suggestions"].find(query)
    
    if sort == "newest":
        cursor = cursor.sort("created_at", -1)
    elif sort == "oldest":
        cursor = cursor.sort("created_at", 1)
    else:  # default: most voted
        cursor = cursor.sort([("upvotes", -1), ("created_at", -1)])

    docs = list(cursor)
    return [map_id(d) for d in docs]

@router.post("", response_model=SuggestionResponse, status_code=status.HTTP_201_CREATED)
def create_suggestion(
    suggestion_in: SuggestionCreate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Submit a new cooling suggestion. Requires authentication."""
    suggestion_dict = {
        "title": suggestion_in.title.strip(),
        "description": suggestion_in.description.strip(),
        "district": suggestion_in.district,
        "category": suggestion_in.category,
        "author_email": current_user["email"],
        "status": "approved",
        "upvotes": 0,
        "created_at": datetime.utcnow()
    }
    result = db["suggestions"].insert_one(suggestion_dict.copy())
    doc = db["suggestions"].find_one({"_id": result.inserted_id})
    return map_id(doc)

@router.post("/{suggestion_id}/upvote", response_model=SuggestionResponse)
def upvote_suggestion(
    suggestion_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Increment the upvote counter on a suggestion. Requires authentication."""
    try:
        obj_id = ObjectId(suggestion_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid suggestion ID.")
        
    doc = db["suggestions"].find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found.")
        
    db["suggestions"].update_one({"_id": obj_id}, {"$inc": {"upvotes": 1}})
    updated_doc = db["suggestions"].find_one({"_id": obj_id})
    return map_id(updated_doc)

@router.delete("/{suggestion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_suggestion(
    suggestion_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a suggestion. Authors can delete their own; admins can delete any."""
    try:
        obj_id = ObjectId(suggestion_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid suggestion ID.")
        
    suggestion = db["suggestions"].find_one({"_id": obj_id})
    if not suggestion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found.")

    # Only the author or an admin can delete
    if suggestion["author_email"] != current_user["email"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this suggestion.",
        )

    db["suggestions"].delete_one({"_id": obj_id})
    return {}
