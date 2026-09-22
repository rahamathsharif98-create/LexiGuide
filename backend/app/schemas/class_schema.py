from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.student import StudentOut


class ClassOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    grade: str | None = None
    section: str | None = None
    created_at: datetime
    student_count: int
