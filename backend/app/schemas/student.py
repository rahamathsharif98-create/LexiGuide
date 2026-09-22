from datetime import datetime
from pydantic import BaseModel, ConfigDict


class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    age: int | None = None
    avatar: str | None = None
    created_at: datetime


class StudentDetailOut(StudentOut):
    class_id: int | None = None
    class_name: str | None = None
