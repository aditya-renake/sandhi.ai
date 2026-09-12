from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    username: str
    full_name: str
    email: Optional[EmailStr] = None
    role: str = "asha_worker"
    state: str = "Assam"
    district: str = "Kamrup Metropolitan"
    phc_name: str = "Dispur PHC"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    state: str
    username: str
    full_name: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    state: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
