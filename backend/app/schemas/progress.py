from pydantic import BaseModel


class SkillProgressOut(BaseModel):
    key: str
    label: str
    value: float
    trend: str  # "improving" | "steady" | "needs practice"


class RecentComparisonOut(BaseModel):
    skill: str
    previous_accuracy: float | None = None
    current_accuracy: float | None = None
    change: float | None = None
    message: str | None = None


class ProgressOut(BaseModel):
    student_id: int
    range: str  # "7d" | "30d" | "90d"
    skills: list[SkillProgressOut]
    sample_size: int  # how many real recorded fingerprint snapshots this is based on
    note: str | None = None  # honesty note if the range has limited real data
    recent_comparison: RecentComparisonOut | None = None
