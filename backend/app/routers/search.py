from fastapi import APIRouter, Depends, Query, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.search import SearchResponse
from app.services.search_service import search_learning_resources
from app.utils.security import decode_access_token

router = APIRouter(prefix="/api/search", tags=["search"])


def get_optional_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()


@router.get("", response_model=SearchResponse)
def search_resources(
    q: str = Query(default="", description="Search query keywords"),
    skill: str | None = Query(default=None, description="Optional skill filter"),
    difficulty: str | None = Query(default=None, description="Optional difficulty level"),
    child_id: int | None = Query(default=None, description="Optional child ID for personalized ranking"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Step 13 — AI Learning Search:
    Searches across stories, reading passages, phonics games, and speaking activities.
    Supports skill/difficulty/level filters and student-specific adaptive relevance boost.
    Enforces authorization when a child_id is provided and the user is authenticated.
    """
    return search_learning_resources(
        db=db,
        query=q,
        skill=skill,
        difficulty=difficulty,
        child_id=child_id,
        current_user=current_user,
    )
