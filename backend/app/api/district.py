from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user, get_admin_user
from app.repositories.district import district_repo
from app.schemas.district import DistrictResponse, DistrictUpdate

router = APIRouter(prefix="/districts", tags=["districts"])

@router.get("", response_model=List[DistrictResponse])
def read_districts(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Fetch all districts of Tamil Nadu with temperature and indexes."""
    return district_repo.get_all(db)

@router.get("/{district_id}", response_model=DistrictResponse)
def read_district(
    district_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Fetch a single district details."""
    db_district = district_repo.get(db, id=district_id)
    if not db_district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found"
        )
    return db_district

@router.put("/{district_id}", response_model=DistrictResponse)
def update_district(
    district_id: str,
    district_in: DistrictUpdate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update metrics for a district."""
    db_district = district_repo.get(db, id=district_id)
    if not db_district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found"
        )
    return district_repo.update(db, id=district_id, update_data=district_in.dict(exclude_unset=True))

@router.delete("/{district_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_district(
    district_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_admin_user)
):
    """Remove a district from the database (restricted to admin)."""
    db_district = district_repo.get(db, id=district_id)
    if not db_district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found"
        )
    district_repo.remove(db, id=district_id)
    return {}
