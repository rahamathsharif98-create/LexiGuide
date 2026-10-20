from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, Student, Parent, Teacher, ReadingFingerprint
from app.schemas.student import StudentOut, StudentCreate
from app.services import student_service
from app.services.fingerprint_service import DEFAULT_FINGERPRINT
from app.services.recommendation_service import persist_recommendations_for_student
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child

router = APIRouter(prefix="/api/children", tags=["children"])


@router.get("", response_model=list[StudentOut])
def list_children(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """A parent sees only their own children; a teacher sees only students
    in their own class(es); a student sees only their own student profile;
    any other role gets an empty list.
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
def create_child(
    payload: Optional[StudentCreate] = None,
    name: Optional[str] = Query(None),
    age: Optional[int] = Query(None),
    avatar: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_name = (payload.name if payload else None) or name or "Explorer"
    student_age = (payload.age if payload and payload.age is not None else age) or 7
    student_avatar = (payload.avatar if payload and payload.avatar else avatar) or "🦊"

    if current_user.role == UserRole.child:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            student.name = student_name
            student.age = student_age
            student.avatar = student_avatar
            db.commit()
            db.refresh(student)
            return student
        else:
            student = Student(user_id=current_user.id, name=student_name, age=student_age, avatar=student_avatar)
            db.add(student)
            db.commit()
            db.refresh(student)
    else:
        student = Student(name=student_name, age=student_age, avatar=student_avatar)
        db.add(student)
        db.commit()
        db.refresh(student)

        if current_user.role == UserRole.parent:
            parent = db.query(Parent).filter(Parent.user_id == current_user.id).first()
            if not parent:
                parent = Parent(user_id=current_user.id)
                db.add(parent)
                db.commit()
                db.refresh(parent)
            parent.children.append(student)
            db.commit()
        elif current_user.role == UserRole.teacher:
            teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
            if teacher and teacher.classes:
                teacher.classes[0].students.append(student)
                db.commit()

    # Ensure baseline fingerprint exists
    fp = db.query(ReadingFingerprint).filter(ReadingFingerprint.student_id == student.id).first()
    if not fp:
        new_fp = ReadingFingerprint(student_id=student.id, **DEFAULT_FINGERPRINT)
        db.add(new_fp)
        db.commit()
        try:
            persist_recommendations_for_student(db, student.id, DEFAULT_FINGERPRINT)
        except Exception:
            pass

    return student


@router.put("/{child_id}", response_model=StudentOut)
def update_child(
    child_id: int,
    payload: Optional[StudentCreate] = None,
    name: Optional[str] = Query(None),
    age: Optional[int] = Query(None),
    avatar: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_can_access_child(db, current_user, child_id)
    student = student_service.get_student_or_404(db, child_id)
    new_name = (payload.name if payload else None) or name
    new_age = (payload.age if payload and payload.age is not None else None) if age is None else age
    new_avatar = (payload.avatar if payload else None) or avatar
    if new_name is not None:
        student.name = new_name
    if new_age is not None:
        student.age = new_age
    if new_avatar is not None:
        student.avatar = new_avatar
    db.commit()
    db.refresh(student)
    return student

