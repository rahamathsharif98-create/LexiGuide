"""FastAPI auth dependencies: extract + verify the bearer token, resolve the
current User, and enforce role-based access. A parent may only read their
OWN children's data; a teacher may only read students in THEIR OWN class —
those specific checks live in app/utils/authorization.py, layered on top of
these identity dependencies.
"""
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.utils.security import decode_access_token


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*roles):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Not authorized for this resource")
        return user
    return checker
