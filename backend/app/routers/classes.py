from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, Teacher, ClassModel
from app.schemas.class_schema import ClassOut
from app.schemas.student import StudentOut
from app.utils.deps import require_role
from app.utils.authorization import assert_teacher_owns_class

router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.get("", response_model=list[ClassOut])
def list_classes(current_user: User = Depends(require_role(UserRole.teacher)), db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        return []
    classes = teacher.classes
    return [{"id": c.id, "name": c.name, "grade": c.grade, "section": c.section, "created_at": c.created_at, "student_count": len(c.students)} for c in classes]


@router.get("/{class_id}", response_model=ClassOut)
def get_class(class_id: int, current_user: User = Depends(require_role(UserRole.teacher)), db: Session = Depends(get_db)):
    c = assert_teacher_owns_class(db, current_user, class_id)
    return {"id": c.id, "name": c.name, "grade": c.grade, "section": c.section, "created_at": c.created_at, "student_count": len(c.students)}


@router.get("/{class_id}/students", response_model=list[StudentOut])
def get_class_students(class_id: int, current_user: User = Depends(require_role(UserRole.teacher)), db: Session = Depends(get_db)):
    c = assert_teacher_owns_class(db, current_user, class_id)
    return c.students
