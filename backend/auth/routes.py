import uuid
from backend.auth.dependencies import get_current_user

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db.models import User
from backend.auth.schemas import RegisterRequest, LoginRequest, TokenResponse
from backend.auth.security import (
    hash_password,
    verify_password,
    create_access_token
)
from backend.auth.dependencies import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    existing = db.query(User).filter(
        (User.username == data.username) |
        (User.email == data.email)
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Username or email already exists")

    user = User(
        id=str(uuid.uuid4()),
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        role="creator",
        is_active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Registration successful",
        "user_id": user.id,
        "role": user.role
    }


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.username == data.username
    ).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account inactive")

    token = create_access_token({
        "sub": user.id,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role
    }