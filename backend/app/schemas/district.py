from pydantic import BaseModel
from typing import Optional

class DistrictBase(BaseModel):
    name: str
    lst: float
    ndvi: float
    ndbi: float
    lat: float
    lon: float
    heat_index: float
    risk_level: str

class DistrictCreate(DistrictBase):
    pass

class DistrictUpdate(BaseModel):
    lst: Optional[float] = None
    ndvi: Optional[float] = None
    ndbi: Optional[float] = None
    heat_index: Optional[float] = None
    risk_level: Optional[str] = None

class DistrictResponse(DistrictBase):
    id: str

    class Config:
        from_attributes = True
