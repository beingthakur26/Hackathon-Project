from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta
from bson import ObjectId
import hashlib
import secrets
from jose import JWTError, jwt

from database import (
    get_db, is_fallback,
    find_user_by_email_fallback, find_user_by_id_fallback,
    create_user_fallback
)
from auth import (
    UserCreate, UserLogin,
    create_access_token, verify_password, hash_password,
    get_current_user, TokenData
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Using ALGORITHM and SECRET_KEY from auth.py
from auth import ALGORITHM, SECRET_KEY

# Redundant hashing functions removed, using unified ones from auth.py

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate):
    try:
        if is_fallback():
            existing_user = find_user_by_email_fallback(user_data.email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            user = create_user_fallback(user_data.email, user_data.password, user_data.name)
            token = create_access_token({"sub": user["_id"], "email": user["email"]})
            
            return {
                "success": True,
                "message": "Registration successful",
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": user["_id"],
                    "email": user["email"],
                    "name": user.get("name"),
                    "created_at": user["created_at"].isoformat()
                }
            }
        else:
            db = get_db()
            if db is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection failed"
                )
            
            existing_user = db.users.find_one({"email": user_data.email})
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            

            user_doc = {
                "email": user_data.email,
                "password": hash_password(user_data.password),
                "name": user_data.name,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = db.users.insert_one(user_doc)
            token = create_access_token({"sub": str(result.inserted_id), "email": user_data.email})
            
            return {
                "success": True,
                "message": "Registration successful",
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": str(result.inserted_id),
                    "email": user_data.email,
                    "name": user_data.name,
                    "created_at": user_doc["created_at"].isoformat()
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=dict)
async def login(credentials: UserLogin):
    try:
        if is_fallback():
            user = find_user_by_email_fallback(credentials.email)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            if not verify_password(credentials.password, user["password"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            token = create_access_token({"sub": user["_id"], "email": user["email"]})
            
            return {
                "success": True,
                "message": "Login successful",
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": user["_id"],
                    "email": user["email"],
                    "name": user.get("name"),
                    "created_at": user["created_at"].isoformat()
                }
            }
        else:
            db = get_db()
            if db is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection failed"
                )
            
            user = db.users.find_one({"email": credentials.email})
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            if not verify_password(credentials.password, user["password"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            token = create_access_token({"sub": str(user["_id"]), "email": user["email"]})
            
            return {
                "success": True,
                "message": "Login successful",
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "name": user.get("name"),
                    "created_at": user["created_at"].isoformat()
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me", response_model=dict)
async def get_me(current_user: TokenData = Depends(get_current_user)):
    try:
        if is_fallback():
            user = find_user_by_id_fallback(current_user.user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            return {
                "success": True,
                "user": {
                    "id": user["_id"],
                    "email": user["email"],
                    "name": user.get("name"),
                    "created_at": user["created_at"].isoformat()
                }
            }
        else:
            db = get_db()
            if db is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection failed"
                )
            
            user = db.users.find_one({"_id": ObjectId(current_user.user_id)})
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            return {
                "success": True,
                "user": {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "name": user.get("name"),
                    "created_at": user["created_at"].isoformat()
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user: {str(e)}"
        )

@router.post("/logout")
async def logout(current_user: TokenData = Depends(get_current_user)):
    return {
        "success": True,
        "message": "Logout successful"
    }
