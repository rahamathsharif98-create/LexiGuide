from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, Parent, Teacher, Student
from app.schemas.student import StudentOut
from app.schemas.session import SessionCreate, SessionOut
from app.schemas.fingerprint import FingerprintHistoryOut
from app.schemas.recommendation import RecommendationOut
from app.schemas.progress import ProgressOut
from app.services import student_service, session_service, fingerprint_service, recommendation_service, progress_service
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=list[StudentOut])
def list_students(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.teacher:
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if not teacher:
            return []
        seen = set()
        students = []
        for cls in teacher.classes:
            for s in cls.students:
                if s.id not in seen:
                    seen.add(s.id)
                    students.append(s)
        return students
    if current_user.role == UserRole.parent:
        parent = db.query(Parent).filter(Parent.user_id == current_user.id).first()
        return parent.children if parent else []
    if current_user.role == UserRole.child:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        return [student] if student else []
    return []


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, student_id)
    return student_service.get_student_or_404(db, student_id)


@router.get("/{student_id}/sessions", response_model=list[SessionOut])
def get_sessions(student_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, student_id)
    return session_service.list_sessions_for_student(db, student_id)


@router.post("/{student_id}/sessions", response_model=SessionOut, status_code=201)
def post_session(student_id: int, payload: SessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, student_id)
    return session_service.create_session(
        db, student_id, payload.activity_id, payload.skill, payload.outcome, payload.stars, payload.xp
    )


@router.get("/{student_id}/progress", response_model=ProgressOut)
def get_progress(student_id: int, range: str = "7d", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, student_id)
    if range not in ("7d", "30d", "90d"):
        raise HTTPException(status_code=400, detail="range must be one of: 7d, 30d, 90d")
    return progress_service.get_progress(db, student_id, range)


@router.get("/{student_id}/fingerprint", response_model=FingerprintHistoryOut)
def get_fingerprint(student_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, student_id)
    return fingerprint_service.fingerprint_history_payload(db, student_id)


@router.get("/{student_id}/recommendations", response_model=list[RecommendationOut])
def get_recommendations(student_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, student_id)
    rows = recommendation_service.list_recommendations_for_student(db, student_id)
    out = []
    for r in rows:
        out.append({
            "id": r.id, "student_id": r.student_id, "activity_id": r.activity_id,
            "activity_name": r.activity.name if r.activity else None,
            "reason": r.reason, "priority": r.priority, "created_at": r.created_at,
        })
    return out
