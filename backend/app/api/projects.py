from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from typing import List
from datetime import datetime
from bson import ObjectId

from app.core.database import get_db
from app.api.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])

def map_id(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

@router.get("")
def list_projects(db: Database = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """List all projects belonging to the current user."""
    docs = list(db["projects"].find({"owner_email": current_user["email"]}).sort("created_at", -1))
    return [map_id(d) for d in docs]

@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(payload: dict, db: Database = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Create a new cooling mitigation project."""
    project_dict = {
        "name": payload.get("name", "Untitled Project"),
        "district": payload.get("district", "Chennai"),
        "target_cooling": payload.get("target_cooling", "-3.0°C"),
        "status": payload.get("status", "Draft"),
        "budget": payload.get("budget", "$25,000"),
        "owner_email": current_user["email"],
        "created_at": datetime.utcnow()
    }
    result = db["projects"].insert_one(project_dict.copy())
    doc = db["projects"].find_one({"_id": result.inserted_id})
    return map_id(doc)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Database = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Delete a project owned by the current user."""
    try:
        obj_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project ID.")
        
    project = db["projects"].find_one({"_id": obj_id, "owner_email": current_user["email"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or not owned by you.")
    
    db["projects"].delete_one({"_id": obj_id})
    return {}
