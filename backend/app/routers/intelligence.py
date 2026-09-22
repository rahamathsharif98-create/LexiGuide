from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.intelligence import LearningIntelligenceOut, FluencyOverview, ConfusionItem
from app.services import student_service
from app.services.intelligence_service import LearningIntelligenceEngine
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child

router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])


@router.get("/{child_id}", response_model=LearningIntelligenceOut)
def get_child_intelligence(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 12 — AI Learning Intelligence:
    Returns multi-dimensional reading error classification, WCPM fluency metrics,
    word confusion clustering, and pedagogical guidance notes.
    """
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    engine = LearningIntelligenceEngine(db, child_id)
    return engine.generate_full_intelligence()


@router.get("/{child_id}/fluency", response_model=FluencyOverview)
def get_child_fluency(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 12 — Returns historical WCPM fluency timeline and stability index."""
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    engine = LearningIntelligenceEngine(db, child_id)
    reading_data = engine.get_reading_details()
    return engine.get_fluency_overview(reading_data)


@router.get("/{child_id}/confusions", response_model=list[ConfusionItem])
def get_child_confusions(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 12 — Returns top substitution and phoneme/word confusion clusters."""
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    engine = LearningIntelligenceEngine(db, child_id)
    return engine.get_top_confusions(limit=10)
