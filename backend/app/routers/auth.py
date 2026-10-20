from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, Parent, Teacher, Student, ClassModel, ReadingFingerprint
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, MeResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.deps import get_current_user
from app.services.fingerprint_service import DEFAULT_FINGERPRINT
from app.services.recommendation_service import persist_recommendations_for_student

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    student_id = None
    if user.role == UserRole.parent:
        parent = Parent(user_id=user.id)
        db.add(parent)
        db.commit()
    elif user.role == UserRole.teacher:
        teacher = Teacher(user_id=user.id)
        db.add(teacher)
        db.commit()
        db.refresh(teacher)
        cls = ClassModel(
            teacher_id=teacher.id,
            name=f"{user.name}'s Classroom",
            grade="2",
            section="A",
        )
        db.add(cls)
        db.commit()
    elif user.role == UserRole.child:
        student = Student(
            user_id=user.id,
            name=user.name,
            avatar="🦊",
            age=7,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        student_id = student.id

        fp = ReadingFingerprint(
            student_id=student.id,
            **DEFAULT_FINGERPRINT
        )
        db.add(fp)
        db.commit()
        try:
            persist_recommendations_for_student(db, student.id, DEFAULT_FINGERPRINT)
        except Exception:
            pass

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        name=user.name,
        student_id=student_id,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        # Deliberately identical error for "no such user" and "wrong password"
        # — never reveal which one it was.
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    student_id = None
    if user.role == UserRole.child:
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student:
            student_id = student.id
        else:
            student = Student(user_id=user.id, name=user.name, avatar="🦊", age=7)
            db.add(student)
            db.commit()
            db.refresh(student)
            student_id = student.id

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        name=user.name,
        student_id=student_id,
    )


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student_id = None
    if current_user.role == UserRole.child:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            student_id = student.id
    return MeResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        student_id=student_id,
    )

