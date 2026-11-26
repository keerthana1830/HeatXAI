from typing import Optional
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "user"  # 'user' or 'admin'

class UserLogin(BaseModel):
    """Schema for user login credentials."""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema for returning user data without sensitive credentials."""
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool = True

    class Config:
        from_attributes = True

class Token(BaseModel):
    """Schema for returning a JWT access token."""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Schema for matching parsed JWT payload attributes."""
    email: Optional[str] = None
    role: Optional[str] = None
