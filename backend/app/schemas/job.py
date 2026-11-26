from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class JobBase(BaseModel):
    job_type: str
    status: str
    data_size_mb: Optional[float] = 0.0
    duration_seconds: Optional[float] = 0.0
    triggered_by: str

class JobCreate(BaseModel):
    job_type: str
    triggered_by: Optional[str] = "system"

class JobUpdate(BaseModel):
    status: Optional[str] = None
    data_size_mb: Optional[float] = None
    duration_seconds: Optional[float] = None
    logs: Optional[str] = None

class JobResponse(JobBase):
    id: str
    created_at: Optional[datetime] = None
    logs: Optional[str] = None

    class Config:
        from_attributes = True
