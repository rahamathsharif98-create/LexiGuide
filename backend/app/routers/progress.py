from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.progress import ProgressOut
from app.schemas.day_by_day import DayByDayResponse
from app.services import student_service, progress_service, day_by_day_service
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/day-by-day/{child_id}", response_model=DayByDayResponse)
def get_day_by_day(
    child_id: int,
    period: int = Query(7, ge=1, le=365),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    return day_by_day_service.get_day_by_day_analysis(
        db=db,
        student_id=child_id,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/{child_id}", response_model=ProgressOut)
def get_progress(child_id: int, range: str = "7d", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    if range not in ("7d", "30d", "90d"):
        raise HTTPException(status_code=400, detail="range must be one of: 7d, 30d, 90d")
    return progress_service.get_progress(db, child_id, range)

