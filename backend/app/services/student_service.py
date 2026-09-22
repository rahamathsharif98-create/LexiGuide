from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import Student


def list_students(db: Session) -> list[Student]:
    return db.query(Student).order_by(Student.id).all()


def get_student_or_404(db: Session, student_id: int) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student
