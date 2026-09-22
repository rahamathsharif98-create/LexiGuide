"""Ownership checks: a parent may only access data for children linked to
their OWN Parent record; a teacher may only access students in a class
linked to their OWN Teacher record. These are separate from get_current_user/
require_role (identity + coarse role) — this module is fine-grained
per-resource ownership.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import User, UserRole, Parent, Teacher, Student, ClassModel


def assert_parent_owns_child(db: Session, user: User, child_id: int) -> None:
    parent = db.query(Parent).filter(Parent.user_id == user.id).first()
    if not parent:
        raise HTTPException(status_code=403, detail="Not authorized to access this child's information")
    child_ids = {c.id for c in parent.children}
    if child_id not in child_ids:
        raise HTTPException(status_code=403, detail="Not authorized to access this child's information")


def assert_teacher_owns_student(db: Session, user: User, student_id: int) -> None:
    teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
    if not teacher:
        raise HTTPException(status_code=403, detail="Not authorized to access this student's information")
    class_ids = {c.id for c in teacher.classes}
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or not any(cls.id in class_ids for cls in student.classes):
        raise HTTPException(status_code=403, detail="Not authorized to access this student's information")


def assert_teacher_owns_class(db: Session, user: User, class_id: int) -> ClassModel:
    teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
    if not teacher:
        raise HTTPException(status_code=403, detail="Not authorized to access this class")
    cls = db.query(ClassModel).filter(ClassModel.id == class_id, ClassModel.teacher_id == teacher.id).first()
    if not cls:
        raise HTTPException(status_code=403, detail="Not authorized to access this class")
    return cls


def assert_can_access_child(db: Session, user: User, child_id: int) -> None:
    """Single shared entry point for every route that takes a child/student
    ID: authenticate (already done by get_current_user upstream) -> branch
    on role -> verify ownership -> only then let the caller touch the row.

    Every branch raises a generic 403 ("Not authorized...") with no
    distinction between "doesn't exist" and "exists but isn't yours" —
    callers must not run an existence check (e.g. get_student_or_404)
    before this, or a 404-vs-403 split would leak which child IDs are
    real to a user who isn't authorized to see them.
    """
    if user.role == UserRole.parent:
        assert_parent_owns_child(db, user, child_id)
    elif user.role == UserRole.teacher:
        assert_teacher_owns_student(db, user, child_id)
    elif user.role == UserRole.child:
        student = db.query(Student).filter(Student.id == child_id).first()
        if not student or student.user_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this child's information")
    else:
        raise HTTPException(status_code=403, detail="Not authorized to access this child's information")
