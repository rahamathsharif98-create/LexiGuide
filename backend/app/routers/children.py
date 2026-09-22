from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, Student, Parent, Teacher
from app.schemas.student import StudentOut
from app.services import student_service
from app.utils.deps import get_current_user, require_role
from app.utils.authorization import assert_can_access_child

router = APIRouter(prefix="/api/children", tags=["children"])


@router.get("", response_model=list[StudentOut])
def list_children(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """A parent sees only their own children; a teacher sees only students
    in their own class(es); any other role gets an empty list rather than
    everyone's data.
    """
    if current_user.role == UserRole.parent:
        parent = db.query(Parent).filter(Parent.user_id == current_user.id).first()
        return parent.children if parent else []
    if current_user.role == UserRole.teacher:
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        seen = set()
        students = []
        if teacher:
            for cls in teacher.classes:
                for s in cls.students:
                    if s.id not in seen:
                        seen.add(s.id)
                        students.append(s)
        return students
    if current_user.role == UserRole.child:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        return [student] if student else []
    return []


@router.get("/{child_id}", response_model=StudentOut)
def get_child(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, child_id)
    return student_service.get_student_or_404(db, child_id)


@router.post("", response_model=StudentOut, status_code=201)
def create_child(name: str, age: int | None = None, avatar: str | None = None,
                  current_user: User = Depends(require_role(UserRole.parent, UserRole.teacher)),
                  db: Session = Depends(get_db)):
    student = Student(name=name, age=age, avatar=avatar)
    db.add(student)
    db.commit()
    db.refresh(student)
    if current_user.role == UserRole.parent:
        parent = db.query(Parent).filter(Parent.user_id == current_user.id).first()
        if parent:
            parent.children.append(student)
            db.commit()
    return student


@router.put("/{child_id}", response_model=StudentOut)
def update_child(child_id: int, name: str | None = None, age: int | None = None, avatar: str | None = None,
                  current_user: User = Depends(require_role(UserRole.parent, UserRole.teacher)), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, child_id)
    student = student_service.get_student_or_404(db, child_id)
    if name is not None:
        student.name = name
    if age is not None:
        student.age = age
    if avatar is not None:
        student.avatar = avatar
    db.commit()
    db.refresh(student)
    return student
