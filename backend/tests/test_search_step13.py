from datetime import datetime, timezone
import pytest
from fastapi import HTTPException

from app.models import User, UserRole, Student, Parent, Teacher
from app.services.search_service import search_learning_resources, CATALOG_STATIC_RESOURCES
from app.utils.language import contains_forbidden_language
from app.utils.security import create_access_token
from tests.factories import make_student, make_parent, make_teacher_with_class


def _auth_headers(user):
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


# 1. empty query
def test_1_empty_query_returns_curated_catalog(db_session):
    res = search_learning_resources(db_session, query="")
    assert res["total_results"] == len(CATALOG_STATIC_RESOURCES)
    assert len(res["results"]) > 0
    assert len(res["suggested_filters"]) > 0


# 2. keyword search
def test_2_keyword_search(db_session):
    res = search_learning_resources(db_session, query="rainy")
    assert res["total_results"] >= 1
    assert any("Rainy" in item["title"] for item in res["results"])


# 3. story search
def test_3_story_search(db_session):
    res = search_learning_resources(db_session, query="Curious Fox")
    assert any(item["type"] == "story" and "Fox" in item["title"] for item in res["results"])


# 4. activity search
def test_4_activity_search(db_session):
    res = search_learning_resources(db_session, query="Word Builder")
    assert any(item["type"] == "activity" and "Builder" in item["title"] for item in res["results"])


# 5. passage search
def test_5_passage_search(db_session):
    res = search_learning_resources(db_session, query="Pet Cat")
    assert any(item["type"] == "passage" and "Cat" in item["title"] for item in res["results"])


# 6. vocabulary search
def test_6_vocabulary_search(db_session):
    res = search_learning_resources(db_session, query="ship")
    assert any(item["type"] == "word" and "Ship" in item["title"] for item in res["results"])


# 7. animals query
def test_7_animals_query(db_session):
    res = search_learning_resources(db_session, query="animals")
    assert res["total_results"] >= 2
    titles = [item["title"] for item in res["results"]]
    assert any("Safari" in t or "Fox" in t or "Bear" in t for t in titles)


# 8. space query
def test_8_space_query(db_session):
    res = search_learning_resources(db_session, query="space")
    assert res["total_results"] >= 1
    assert any("Moon" in item["title"] or "Star" in item["title"] for item in res["results"])


# 9. skill filter
def test_9_skill_filter(db_session):
    res = search_learning_resources(db_session, query="", skill="pronunciation")
    assert len(res["results"]) > 0
    assert all(item["skill"] == "pronunciation" for item in res["results"])


# 10. difficulty filter
def test_10_difficulty_filter(db_session):
    res = search_learning_resources(db_session, query="", difficulty="Medium")
    assert len(res["results"]) > 0
    assert all(item["difficulty"] == "Medium" for item in res["results"])


# 11. level filter if supported
def test_11_level_filter(db_session):
    res = search_learning_resources(db_session, query="", difficulty="Level 1")
    assert len(res["results"]) > 0
    assert all(item["difficulty"] == "Easy" for item in res["results"])


# 12. combined filters
def test_12_combined_filters(db_session):
    res = search_learning_resources(db_session, query="", skill="comprehension", difficulty="Easy")
    assert len(res["results"]) > 0
    assert all(item["skill"] == "comprehension" and item["difficulty"] == "Easy" for item in res["results"])


# 13. child_id personalization
def test_13_child_id_personalization(db_session):
    student = make_student(db_session, name="Child13", fp={"word_recognition": 30, "pronunciation": 80, "reading_fluency": 80, "phonological_awareness": 80, "comprehension": 80})
    res = search_learning_resources(db_session, query="", child_id=student.id)
    top_items = res["results"]
    assert any(item["skill"] == "word_recognition" and item.get("fit_reason") for item in top_items)


# 14. weak-skill ranking
def test_14_weak_skill_ranking(db_session):
    student = make_student(db_session, name="Child14", fp={"reading_fluency": 25, "pronunciation": 80, "word_recognition": 80, "phonological_awareness": 80, "comprehension": 80})
    res = search_learning_resources(db_session, query="animals", child_id=student.id)
    # The reading fluency animals (e.g. The Big Race or Pet Cat) should have boosted score
    fluency_items = [r for r in res["results"] if r["skill"] == "reading_fluency"]
    assert len(fluency_items) > 0
    assert any("fluency" in (r.get("fit_reason") or "").lower() for r in fluency_items)


# 15. fit_reason
def test_15_fit_reason_content(db_session):
    student = make_student(db_session, name="Child15", fp={"pronunciation": 20, "reading_fluency": 70, "word_recognition": 70, "phonological_awareness": 70, "comprehension": 70})
    res = search_learning_resources(db_session, query="", child_id=student.id)
    pron_item = next(r for r in res["results"] if r["skill"] == "pronunciation")
    assert "pronunciation" in pron_item["fit_reason"].lower()


# 16. deterministic ranking
def test_16_deterministic_ranking(db_session):
    res1 = search_learning_resources(db_session, query="fox")
    res2 = search_learning_resources(db_session, query="fox")
    assert [r["id"] for r in res1["results"]] == [r["id"] for r in res2["results"]]


# 17. unauthorized child protection
def test_17_unauthorized_child_protection(client, db_session):
    p1 = make_parent(db_session, email="p1_test17@test.demo")
    s1 = make_student(db_session)
    p1.children.append(s1)
    db_session.commit()

    p2 = make_parent(db_session, email="p2_test17@test.demo")
    headers2 = _auth_headers(p2.user)

    # Parent 2 cannot personalize with Child 1 ID
    r = client.get(f"/api/search?child_id={s1.id}", headers=headers2)
    assert r.status_code == 403


# 18. invalid child handling
def test_18_invalid_child_handling(client, db_session):
    p1 = make_parent(db_session, email="p1_test18@test.demo")
    headers = _auth_headers(p1.user)
    r = client.get("/api/search?child_id=99999", headers=headers)
    assert r.status_code == 403


# 19. no diagnostic language
def test_19_no_diagnostic_language(db_session):
    student = make_student(db_session, name="Child19", fp={"reading_fluency": 20, "pronunciation": 20, "word_recognition": 20, "phonological_awareness": 20, "comprehension": 20})
    res = search_learning_resources(db_session, query="", child_id=student.id)
    all_text = " ".join([r.get("fit_reason") or "" for r in res["results"]] + [r.get("description") or "" for r in res["results"]])
    assert not contains_forbidden_language(all_text)


# 20. empty results
def test_20_empty_results_on_no_match(db_session):
    res = search_learning_resources(db_session, query="xyzqwerty123456nonexistent")
    assert res["total_results"] == 0
    assert len(res["results"]) == 0


# 21. special characters
def test_21_special_characters(db_session):
    res = search_learning_resources(db_session, query="fox!@#$%^&*()")
    assert res["total_results"] >= 1
    assert any("Fox" in item["title"] for item in res["results"])


# 22. case-insensitive search
def test_22_case_insensitive_search(db_session):
    res_lower = search_learning_resources(db_session, query="moon")
    res_upper = search_learning_resources(db_session, query="MOON")
    assert [r["id"] for r in res_lower["results"]] == [r["id"] for r in res_upper["results"]]


# 23. partial matching
def test_23_partial_matching(db_session):
    res = search_learning_resources(db_session, query="star")
    assert any("Star" in item["title"] or "Starfish" in item["title"] for item in res["results"])


# 24. exact matching priority
def test_24_exact_matching_priority(db_session):
    res = search_learning_resources(db_session, query="The Curious Fox")
    assert res["results"][0]["title"] == "The Curious Fox"


# 25. API response schema
def test_25_api_response_schema(client):
    r = client.get("/api/search")
    assert r.status_code == 200
    body = r.json()
    assert "query" in body
    assert "total_results" in body
    assert "results" in body
    assert "suggested_filters" in body


# 26. route registration
def test_26_route_registration(client):
    r = client.get("/api/search?q=safari")
    assert r.status_code == 200


# 27. authenticated access
def test_27_authenticated_access(client, db_session):
    p = make_parent(db_session, email="p_test27@test.demo")
    s = make_student(db_session)
    p.children.append(s)
    db_session.commit()
    headers = _auth_headers(p.user)

    r = client.get(f"/api/search?q=space&child_id={s.id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["total_results"] >= 1


# 28. invalid filter handling
def test_28_invalid_filter_handling(db_session):
    res = search_learning_resources(db_session, query="", skill="nonexistent_skill")
    assert res["total_results"] == 0


# 29. no private fingerprint leakage
def test_29_no_private_fingerprint_leakage(client, db_session):
    p = make_parent(db_session, email="p_test29@test.demo")
    s = make_student(db_session, fp={
        "phonological_awareness": 50.0,
        "pronunciation": 60.0,
        "word_recognition": 42.5,
        "reading_fluency": 70.0,
        "comprehension": 80.0,
    })
    p.children.append(s)
    db_session.commit()
    headers = _auth_headers(p.user)

    r = client.get(f"/api/search?child_id={s.id}", headers=headers)
    assert r.status_code == 200
    data_str = str(r.json())
    # Should not leak raw score 42.5 in response
    assert "42.5" not in data_str


# 30. search result route validity
def test_30_search_result_route_validity(db_session):
    res = search_learning_resources(db_session, query="")
    for item in res["results"]:
        assert item["route"].startswith("/child/")
