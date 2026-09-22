from pydantic import BaseModel
from typing import Any


class ParentChildSummaryOut(BaseModel):
    child_id: int
    total_stars: int
    streak: int
    activities_completed: int
    learning_time_min: int
    recent_comparison: dict[str, Any] | None = None
