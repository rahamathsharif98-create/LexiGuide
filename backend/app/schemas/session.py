from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class SessionCreate(BaseModel):
    activity_id: int | None = None
    skill: str | None = None
    outcome: dict[str, Any] | None = None
    stars: int = Field(default=0, ge=0)
    xp: int = Field(default=0, ge=0)


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    activity_id: int | None = None
    skill: str | None = None
    started_at: datetime
    completed_at: datetime | None = None
    outcome: dict[str, Any] | None = None
    stars: int
    xp: int
