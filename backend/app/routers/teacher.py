from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, Teacher
from app.schemas.student import StudentOut
from app.services import teacher_service
from app.utils.deps import require_role
from app.utils.authorization import assert_teacher_owns_class

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


def _get_teacher_and_resolve_class_id(db: Session, current_user: User, class_id: int | None) -> int:
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=403, detail="Not authorized as a teacher")
    if class_id is not None:
        cls = assert_teacher_owns_class(db, current_user, class_id)
        return cls.id
    cls = teacher_service.get_class_for_teacher(db, teacher.id)
    if not cls:
        raise HTTPException(status_code=404, detail="No class found for this teacher")
    return cls.id


@router.get("/dashboard")
def get_dashboard(
    class_id: int | None = None,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db),
):
    cid = _get_teacher_and_resolve_class_id(db, current_user, class_id)
    return teacher_service.get_dashboard(db, cid)


@router.get("/students", response_model=list[StudentOut])
def get_students(
    class_id: int | None = None,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db),
):
    cid = _get_teacher_and_resolve_class_id(db, current_user, class_id)
    return teacher_service.get_class_students(db, cid)


@router.get("/progress")
def get_progress(
    class_id: int | None = None,
    range: str = "7d",
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db),
):
    if range not in ("7d", "30d", "90d"):
        raise HTTPException(status_code=400, detail="range must be one of: 7d, 30d, 90d")
    cid = _get_teacher_and_resolve_class_id(db, current_user, class_id)
    return teacher_service.get_class_progress(db, cid, range)


@router.get("/recommendations")
def get_recommendations(
    class_id: int | None = None,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db),
):
    cid = _get_teacher_and_resolve_class_id(db, current_user, class_id)
    return teacher_service.get_class_recommendations(db, cid)
