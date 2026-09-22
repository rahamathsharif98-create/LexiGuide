"""Step 16: Endpoints for Personalized Learning Goals and Adaptive Weekly Learning Plan.
"""
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.learning_plan import LearningGoalsResponse, WeeklyLearningPlanResponse
from app.services import student_service, learning_plan_service
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child

router = APIRouter(prefix="/api", tags=["learning-plan"])


@router.get("/learning-goals", response_model=LearningGoalsResponse)
def get_learning_goals_query(
    child_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Query parameter version: GET /api/learning-goals?child_id={child_id}"""
    return get_learning_goals(child_id, current_user, db)


@router.get("/learning-goals/{child_id}", response_model=LearningGoalsResponse)
def get_learning_goals(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Authoritative Personalized Learning Goals for a child."""
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    return learning_plan_service.generate_learning_goals(db, child_id)


@router.get("/learning-plan", response_model=WeeklyLearningPlanResponse)
def get_learning_plan_query(
    child_id: int = Query(...),
    start_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Query parameter version: GET /api/learning-plan?child_id={child_id}"""
    return get_learning_plan(child_id, start_date, current_user, db)


@router.get("/learning-plan/{child_id}", response_model=WeeklyLearningPlanResponse)
def get_learning_plan(
    child_id: int,
    start_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Authoritative Adaptive Weekly Learning Plan for a child."""
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)

    parsed_start_date = None
    if start_date:
        try:
            parsed_start_date = date.fromisoformat(start_date)
        except ValueError:
            parsed_start_date = None

    return learning_plan_service.generate_weekly_learning_plan(
        db, child_id, start_date=parsed_start_date
    )
