"""Step 17: Endpoints for Intelligent Learning Experience & Content Personalization.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.personalized_content import PersonalizedContentResponse
from app.services import student_service, content_personalization_service
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child

router = APIRouter(prefix="/api/content", tags=["personalized-content"])


@router.get("/personalized", response_model=PersonalizedContentResponse)
def get_personalized_content_query(
    child_id: int = Query(...),
    lang: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Query parameter version: GET /api/content/personalized?child_id={child_id}&lang={lang}"""
    return get_personalized_content(child_id, lang, current_user, db)


@router.get("/personalized/{child_id}", response_model=PersonalizedContentResponse)
def get_personalized_content(
    child_id: int,
    lang: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Authoritative Personalized Learning Content for a child."""
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    return content_personalization_service.select_personalized_content(
        db, child_id, language_filter=lang
    )
