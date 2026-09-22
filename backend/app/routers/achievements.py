from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Achievement
from app.services import student_service
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child

router = APIRouter(prefix="/api/achievements", tags=["achievements"])


@router.get("/{child_id}")
def get_achievements(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    rows = db.query(Achievement).filter(Achievement.student_id == child_id).all()
    return [{
        "id": a.id, "key": a.key, "title": a.title, "description": a.description,
        "icon": a.icon, "earned": a.earned_at is not None, "earned_at": a.earned_at,
    } for a in rows]
