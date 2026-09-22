from pydantic import BaseModel


class SearchResultItem(BaseModel):
    id: str
    title: str
    type: str  # "activity" | "story" | "passage" | "word"
    category: str
    difficulty: str = "Easy"
    route: str
    icon: str = "✨"
    description: str | None = None
    skill: str | None = None
    relevance_score: float = 1.0
    fit_reason: str | None = None


class SearchResponse(BaseModel):
    query: str = ""
    total_results: int = 0
    results: list[SearchResultItem] = []
    suggested_filters: list[str] = []
