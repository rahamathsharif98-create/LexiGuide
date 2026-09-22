from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    activity_id: int | None = None
    activity_name: str | None = None
    reason: str
    priority: str
    created_at: datetime
