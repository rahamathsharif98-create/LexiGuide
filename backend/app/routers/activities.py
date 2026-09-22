from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.activity import ActivityOut
from app.services import activity_service

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.get("", response_model=list[ActivityOut])
def list_activities(db: Session = Depends(get_db)):
    return activity_service.list_activities(db)
