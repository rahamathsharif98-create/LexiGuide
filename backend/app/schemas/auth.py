from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    name: str


class MeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: UserRole
