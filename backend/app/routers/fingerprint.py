"""GET /api/fingerprint/{child_id} and POST /api/fingerprint/update — the
Phase 7-spec'd names for functionality that already exists at
/api/students/{id}/fingerprint (Phase 5). Same service underneath.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.fingerprint import FingerprintHistoryOut
from app.services import student_service, fingerprint_service
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child

router = APIRouter(prefix="/api/fingerprint", tags=["fingerprint"])


@router.get("/{child_id}", response_model=FingerprintHistoryOut)
def get_fingerprint(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    return fingerprint_service.fingerprint_history_payload(db, child_id)


class FingerprintUpdateRequest(BaseModel):
    child_id: int
    outcome_type: str  # "reading" | "game" | "story"
    skill: str | None = None
    accuracy: float | None = None


@router.post("/update", response_model=FingerprintHistoryOut)
def update_fingerprint(payload: FingerprintUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Manually trigger a fingerprint update from an already-known outcome
    (the normal path is that /api/reading/session or /api/learning/session
    do this automatically — this exists for cases where a session was
    recorded elsewhere and the fingerprint needs a separate nudge).
    """
    assert_can_access_child(db, current_user, payload.child_id)
    student_service.get_student_or_404(db, payload.child_id)
    fingerprint_service.record_fingerprint_update(db, payload.child_id, payload.outcome_type, payload.skill, payload.accuracy)
    return fingerprint_service.fingerprint_history_payload(db, payload.child_id)
