from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SuggestionCreate(BaseModel):
    """Schema for creating a new community cooling suggestion."""
    title: str = Field(..., min_length=5, max_length=255, description="Short title for the suggestion")
    description: str = Field(..., min_length=10, max_length=2000, description="Detailed description of the cooling idea")
    district: str = Field(..., min_length=2, max_length=100, description="Tamil Nadu district name")
    category: str = Field(default="General", max_length=100, description="Category of the suggestion")


class SuggestionResponse(BaseModel):
    """Schema for returning a suggestion from the API."""
    id: str
    title: str
    description: str
    district: str
    category: str
    author_email: str
    upvotes: int = 0
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
