from sqlalchemy.orm import Session

from app.models import Activity


def list_activities(db: Session) -> list[Activity]:
    return db.query(Activity).order_by(Activity.id).all()
