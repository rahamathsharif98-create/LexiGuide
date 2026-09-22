"""Generic (non-reading-specific) activity session endpoints. Reuses
session_service — no duplicated persistence logic vs. /api/students/{id}/sessions.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.session import SessionCreate, SessionOut
from app.services import session_service, student_service
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child

router = APIRouter(prefix="/api/learning", tags=["learning"])


@router.post("/session", response_model=SessionOut, status_code=201)
def start_or_log_session(child_id: int, payload: SessionCreate,
                          current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    return session_service.create_session(db, child_id, payload.activity_id, payload.skill, payload.outcome, payload.stars, payload.xp)


@router.post("/result", response_model=SessionOut, status_code=201)
def submit_result(child_id: int, payload: SessionCreate,
                   current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Alias of /session for spec compatibility — submitting a completed
    activity RESULT is the same write as logging a session in this model.
    """
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    return session_service.create_session(db, child_id, payload.activity_id, payload.skill, payload.outcome, payload.stars, payload.xp)


@router.get("/history/{child_id}", response_model=list[SessionOut])
def get_history(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    return session_service.list_sessions_for_student(db, child_id)
