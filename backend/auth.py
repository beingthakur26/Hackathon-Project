import os
import hashlib
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# We are bypassing passlib because version 1.7.4 has major compatibility issues 
# with bcrypt 5.0.0+, throwing 72-byte errors even for short passwords.
# Standard bcrypt library works correctly and is compatible with historical hashes.

security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

class TokenData(BaseModel):
    user_id: str
    email: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    created_at: datetime

class HistoryCreate(BaseModel):
    smiles: str
    prediction: int
    toxicity_probability: Optional[float]
    iupac_name: Optional[str]
    molecular_formula: Optional[str]
    features: Optional[dict]
    molecule_image: Optional[str]

class HistoryResponse(BaseModel):
    id: str
    smiles: str
    prediction: int
    toxicity_probability: Optional[float]
    iupac_name: Optional[str]
    molecular_formula: Optional[str]
    features: Optional[dict]
    created_at: datetime

def hash_password(password: str) -> str:
    # Bcrypt has a 72-byte limit. We truncate manually to 72 bytes 
    # to avoid the "ValueError" from newer bcrypt versions.
    # This also maintains compatibility with existing users' hashed passwords.
    password_bytes = password.encode('utf-8')[:72]
    # Default rounds for passlib was 12
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Consistency with hash_password truncation
    try:
        if not hashed_password:
            return False
        password_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    from jose import jwt
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24 * 7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[TokenData]:
    from jose import jwt, JWTError
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        if user_id is None:
            return None
        return TokenData(user_id=user_id, email=email)
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    token_data = decode_token(token)
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return token_data

def get_password_hash(password: str) -> str:
    return hash_password(password)
