from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pymongo.database import Database
from jose import jwt, JWTError

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.repositories.user import user_repo
from app.schemas.auth import UserCreate, UserResponse, Token, TokenData

router = APIRouter(prefix="/auth", tags=["auth"])

# Standard OAuth2 scheme pointing to our login route
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(db: Database = Depends(get_db), token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency that decodes access token and retrieves the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
        
    user = user_repo.get_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency checking that the active user has administrative rights."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This operation requires administrative privileges."
        )
    return current_user

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Database = Depends(get_db)):
    """User registration route."""
    db_user = user_repo.get_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    return user_repo.create_user(db, user_in=user_in)

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Database = Depends(get_db)):
    """OAuth2 password login route issuing JWT access tokens."""
    user = user_repo.get_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.get("hashed_password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.get("email"))
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: dict = Depends(get_current_user)):
    """Route showing profile of active logged-in user."""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: dict,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update current user's profile name."""
    if "full_name" in payload:
        update_data = {"full_name": payload["full_name"]}
        current_user = user_repo.update(db, id=current_user["id"], update_data=update_data)
    return current_user

@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete the current user's account permanently."""
    user_repo.remove(db, id=current_user["id"])
    return {}
