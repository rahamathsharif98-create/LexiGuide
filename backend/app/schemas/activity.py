from pydantic import BaseModel, ConfigDict


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    description: str | None = None
