"""Content service orchestrator for Step 18: Intelligent Learning Content Generation + Curation."""
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import settings
from app.models import User, Student
from app.utils.authorization import assert_can_access_child
from app.utils.language import DISCLAIMER
from app.content.base import (
    ContentSourceType,
    ContentType,
    ContentItemModel,
    ContentGenerationRequest,
    ContentGenerationResponse,
    ContentCapabilitiesResponse,
    SUPPORTED_SKILLS,
    SUPPORTED_LANGUAGES,
)
from app.content.curated import curated_repository
from app.content.generator import assemble_content_item
from app.content.validator import validate_content_item


class ContentService:
    def __init__(self):
        self._assembled_cache: Dict[str, ContentItemModel] = {}
        # Track history of generated keys per child for duplicate reuse
        # key: (child_id, skill, difficulty, content_type, topic) -> content_id
        self._child_generation_index: Dict[tuple, str] = {}

    def get_capabilities(self) -> ContentCapabilitiesResponse:
        """Returns authoritative capability declarations.
        
        Strict AI Honesty:
        - content_generation_available is False because no external LLM is configured.
        - structured_assembly_available is True for pedagogical template assembly.
        - curated_content_available is True for the rich curated catalog.
        """
        return ContentCapabilitiesResponse(
            content_generation_available=False,
            structured_assembly_available=True,
            curated_content_available=True,
            supported_content_types=[ct.value for ct in ContentType],
            supported_skills=SUPPORTED_SKILLS,
            supported_languages=SUPPORTED_LANGUAGES,
            difficulty_range=[1, 4],
            age_range=[4, 10],
            model_mode=settings.AI_MODE,
        )

    def get_content_by_id(self, content_id: str) -> Optional[ContentItemModel]:
        # 1. Search curated repository
        curated = curated_repository.get_by_id(content_id)
        if curated:
            return curated

        # 2. Search assembled cache
        return self._assembled_cache.get(content_id)

    def list_content_library(
        self,
        skill: Optional[str] = None,
        difficulty: Optional[int] = None,
        content_type: Optional[str] = None,
        language: Optional[str] = None,
        age: Optional[int] = None,
    ) -> List[ContentItemModel]:
        # Start with curated
        curated_matches = curated_repository.filter(
            skill=skill,
            difficulty=difficulty,
            content_type=content_type,
            language=language,
            age=age,
        )

        # Include assembled cached items that match filters
        assembled_matches = []
        for item in self._assembled_cache.values():
            if skill and item.skill != skill and skill not in item.secondary_skills:
                continue
            if difficulty and item.difficulty != difficulty:
                continue
            if content_type and item.content_type != content_type:
                continue
            if language and item.language != language:
                continue
            if age is not None:
                if not (item.age_min <= age <= item.age_max):
                    continue
            assembled_matches.append(item)

        return curated_matches + assembled_matches

    def generate_or_assemble_content(
        self,
        db: Session,
        current_user: User,
        req: ContentGenerationRequest,
    ) -> ContentGenerationResponse:
        """Assembles/generates educational content with strict authorization and validation."""
        # 1. Authorize access to target child
        assert_can_access_child(db, current_user, req.child_id)

        # Check student exists
        student = db.query(Student).filter(Student.id == req.child_id).first()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

        # 2. Duplicate Prevention / Smart Reuse:
        # Check if an identical item was already assembled for this child
        index_key = (req.child_id, req.skill, req.difficulty, req.content_type, req.topic)
        if index_key in self._child_generation_index:
            cached_id = self._child_generation_index[index_key]
            cached_item = self._assembled_cache.get(cached_id)
            if cached_item:
                return ContentGenerationResponse(
                    item=cached_item,
                    source_type=cached_item.source_type,
                    validation_passed=True,
                    fit_reason=f"Reused existing {req.skill.replace('_', ' ')} quest tailored to difficulty {req.difficulty}.",
                    disclaimer=DISCLAIMER,
                )

        # 3. Assemble educational item
        item = assemble_content_item(req)

        # 4. Educational & Safety Validation
        validation = validate_content_item(item)
        if not validation.is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Content validation failed: {'; '.join(validation.errors)}",
            )

        # 5. Store in cache & index
        self._assembled_cache[item.id] = item
        self._child_generation_index[index_key] = item.id

        fit_reason = (
            f"Fresh quest assembled for {req.skill.replace('_', ' ')} "
            f"at difficulty level {req.difficulty}."
        )

        return ContentGenerationResponse(
            item=item,
            source_type=item.source_type,
            validation_passed=True,
            fit_reason=fit_reason,
            disclaimer=DISCLAIMER,
        )

    def get_all_searchable_items(self) -> List[dict]:
        """Provides flat catalog representations for search integration."""
        items = []
        for c in curated_repository.get_all():
            items.append({
                "id": c.id,
                "title": c.title,
                "type": c.content_type,
                "category": c.category,
                "difficulty": c.difficulty_label,
                "route": c.route,
                "icon": c.icon,
                "description": c.description,
                "skill": c.skill,
                "tags": c.tags,
            })
        for a in self._assembled_cache.values():
            items.append({
                "id": a.id,
                "title": a.title,
                "type": a.content_type,
                "category": a.category,
                "difficulty": a.difficulty_label,
                "route": a.route,
                "icon": a.icon,
                "description": a.description,
                "skill": a.skill,
                "tags": a.tags,
            })
        return items


content_service = ContentService()
