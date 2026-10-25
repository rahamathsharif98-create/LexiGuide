from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, Parent
from app.schemas.student import StudentOut
from app.schemas.fingerprint import FingerprintHistoryOut
from app.schemas.session import SessionOut
from app.schemas.recommendation import RecommendationOut
from app.schemas.progress import ProgressOut
from app.schemas.parent import ParentChildSummaryOut
from app.services import parent_service, progress_service
from app.utils.deps import require_role
from app.utils.authorization import assert_parent_owns_child

router = APIRouter(prefix="/api/parent", tags=["parent"])


@router.get("/children", response_model=list[StudentOut])
def get_children(current_user: User = Depends(require_role(UserRole.parent)), db: Session = Depends(get_db)):
    parent = db.query(Parent).filter(Parent.user_id == current_user.id).first()
    if not parent:
        return []
    return parent.children


@router.get("/children/{child_id}/summary", response_model=ParentChildSummaryOut)
def get_child_summary(
    child_id: int,
    current_user: User = Depends(require_role(UserRole.parent)),
    db: Session = Depends(get_db),
):
    assert_parent_owns_child(db, current_user, child_id)
    return parent_service.get_child_summary(db, child_id)


@router.get("/children/{child_id}/progress", response_model=ProgressOut)
def get_child_progress(
    child_id: int,
    range: str = "7d",
    current_user: User = Depends(require_role(UserRole.parent)),
    db: Session = Depends(get_db),
):
    assert_parent_owns_child(db, current_user, child_id)
    if range not in ("7d", "30d", "90d"):
        raise HTTPException(status_code=400, detail="range must be one of: 7d, 30d, 90d")
    return progress_service.get_progress(db, child_id, range)


@router.get("/children/{child_id}/fingerprint", response_model=FingerprintHistoryOut)
def get_child_fingerprint(
    child_id: int,
    current_user: User = Depends(require_role(UserRole.parent)),
    db: Session = Depends(get_db),
):
    assert_parent_owns_child(db, current_user, child_id)
    return parent_service.get_child_fingerprint(db, child_id)


@router.get("/children/{child_id}/activities", response_model=list[SessionOut])
def get_child_activities(
    child_id: int,
    current_user: User = Depends(require_role(UserRole.parent)),
    db: Session = Depends(get_db),
):
    assert_parent_owns_child(db, current_user, child_id)
    return parent_service.get_child_activities(db, child_id)


@router.get("/children/{child_id}/recommendations", response_model=list[RecommendationOut])
def get_child_recommendations(
    child_id: int,
    current_user: User = Depends(require_role(UserRole.parent)),
    db: Session = Depends(get_db),
):
    assert_parent_owns_child(db, current_user, child_id)
    rows = parent_service.get_child_recommendations(db, child_id)
    return [{
        "id": r.id, "student_id": r.student_id, "activity_id": r.activity_id,
        "activity_name": r.activity.name if r.activity else None,
        "reason": r.reason, "priority": r.priority, "created_at": r.created_at,
    } for r in rows]
