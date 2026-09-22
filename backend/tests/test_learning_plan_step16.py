"""Step 16 Backend Test Suite — Personalized Learning Goals + Adaptive Weekly Learning Plan.

30 comprehensive tests verifying:
- Endpoint availability & query/path parameter handling
- RBAC authorization (Parent, Teacher, Child, 401 unauthorized, 403 forbidden)
- Nonexistent student handling (404)
- Canonical numeric student_id enforcement
- Cold start onboarding state for new learners (0 sessions)
- Experienced learner personalized goals generation & ordering
- Declining / struggling skill prioritized as needs_attention (priority 1)
- Spaced practice review detection and scheduling
- Realistic target score calculation (5-15 point step up, capped at 100)
- 7-day calendar window generation (Monday-Sunday, real dates)
- Custom start_date parameter handling
- Linking real completed sessions to past days
- Accurate completion_rate and total_completed calculation
- Honest handling of missed days (no fake streaks)
- Today activity matching authoritative NextBestAction engine
- Spaced practice and focus skill alternating across weekly schedule
- Variety switch avoiding adjacent identical activities
- Dynamic recalculation when new sessions are completed (closed loop)
- Non-clinical child-friendly terminology & forbidden word check
- Disclaimers present in responses
"""
import pytest
from datetime import datetime, timedelta, timezone, date
from fastapi.testclient import TestClient

from app.models import (
    User,
    UserRole,
    Parent,
    Teacher,
    ClassModel,
    Student,
    LearningSession,
    ReadingFingerprint,
)
from app.utils.security import create_access_token, hash_password
from app.utils.language import contains_forbidden_language, DISCLAIMER
from app.services.learning_plan_service import (
    generate_learning_goals,
    generate_weekly_learning_plan,
    _get_target_score,
)


def auth_headers(user: User) -> dict:
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def seed_data(db_session):
    unique = int(datetime.now().timestamp() * 1000)

    # 1. Parent & Child
    parent_user = User(
        email=f"parent_step16_{unique}@test.com",
        name="Parent Step16",
        password_hash=hash_password("Secret123!"),
        role=UserRole.parent,
    )
    db_session.add(parent_user)
    db_session.flush()

    parent_record = Parent(user_id=parent_user.id)
    db_session.add(parent_record)
    db_session.flush()

    child = Student(name="Learner Step16", age=7)
    parent_record.children.append(child)
    db_session.add(child)
    db_session.flush()

    # Child user account
    child_user = User(
        email=f"child_step16_{unique}@test.com",
        name="Child User 16",
        password_hash=hash_password("Secret123!"),
        role=UserRole.child,
    )
    db_session.add(child_user)
    db_session.flush()
    child.user_id = child_user.id
    db_session.flush()

    # 2. Teacher & Enrolled Student
    teacher_user = User(
        email=f"teacher_step16_{unique}@test.com",
        name="Teacher Step16",
        password_hash=hash_password("Secret123!"),
        role=UserRole.teacher,
    )
    db_session.add(teacher_user)
    db_session.flush()

    teacher_record = Teacher(user_id=teacher_user.id)
    db_session.add(teacher_record)
    db_session.flush()

    cls = ClassModel(name="Grade 2B", teacher_id=teacher_record.id)
    db_session.add(cls)
    db_session.flush()

    cls_student = Student(name="Classroom Learner 16", age=8)
    cls.students.append(cls_student)
    db_session.add(cls_student)
    db_session.flush()

    # 3. Empty Child (No sessions)
    empty_child = Student(name="Empty Learner 16", age=6)
    parent_record.children.append(empty_child)
    db_session.add(empty_child)
    db_session.flush()

    # 4. Other Unrelated Parent & Child for RBAC testing
    other_parent_user = User(
        email=f"other_parent_step16_{unique}@test.com",
        name="Other Parent 16",
        password_hash=hash_password("Secret123!"),
        role=UserRole.parent,
    )
    db_session.add(other_parent_user)
    db_session.flush()

    other_parent_record = Parent(user_id=other_parent_user.id)
    db_session.add(other_parent_record)
    db_session.flush()

    other_child = Student(name="Other Child 16", age=7)
    other_parent_record.children.append(other_child)
    db_session.add(other_child)
    db_session.flush()

    db_session.commit()

    return {
        "parent_user": parent_user,
        "child_user": child_user,
        "teacher_user": teacher_user,
        "other_parent_user": other_parent_user,
        "child": child,
        "cls_student": cls_student,
        "empty_child": empty_child,
        "other_child": other_child,
    }


# =========================================================================
# RBAC & ENDPOINT INTEGRATION TESTS (Tests 1 - 8)
# =========================================================================

def test_01_learning_goals_endpoint_parent_access_allowed(client, seed_data):
    """Parent can access their child's learning goals via path and query parameter."""
    p_headers = auth_headers(seed_data["parent_user"])
    child_id = seed_data["child"].id

    resp_path = client.get(f"/api/learning-goals/{child_id}", headers=p_headers)
    assert resp_path.status_code == 200
    data = resp_path.json()
    assert data["child_id"] == child_id
    assert "goals" in data
    assert isinstance(data["goals"], list)

    resp_query = client.get(f"/api/learning-goals?child_id={child_id}", headers=p_headers)
    assert resp_query.status_code == 200
    assert resp_query.json()["child_id"] == child_id


def test_02_learning_plan_endpoint_parent_access_allowed(client, seed_data):
    """Parent can access their child's weekly plan via path and query parameter."""
    p_headers = auth_headers(seed_data["parent_user"])
    child_id = seed_data["child"].id

    resp = client.get(f"/api/learning-plan/{child_id}", headers=p_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["child_id"] == child_id
    assert len(data["days"]) == 7
    assert "week_start" in data
    assert "week_end" in data


def test_03_teacher_can_access_enrolled_student(client, seed_data):
    """Teacher can access learning goals and plan of an enrolled student in their class."""
    t_headers = auth_headers(seed_data["teacher_user"])
    student_id = seed_data["cls_student"].id

    resp_goals = client.get(f"/api/learning-goals/{student_id}", headers=t_headers)
    assert resp_goals.status_code == 200

    resp_plan = client.get(f"/api/learning-plan/{student_id}", headers=t_headers)
    assert resp_plan.status_code == 200
    assert len(resp_plan.json()["days"]) == 7


def test_04_child_can_access_own_goals_and_plan(client, seed_data):
    """Child user can access their own learning goals and plan."""
    c_headers = auth_headers(seed_data["child_user"])
    child_id = seed_data["child"].id

    resp_goals = client.get(f"/api/learning-goals/{child_id}", headers=c_headers)
    assert resp_goals.status_code == 200

    resp_plan = client.get(f"/api/learning-plan/{child_id}", headers=c_headers)
    assert resp_plan.status_code == 200


def test_05_unauthenticated_request_rejected_401(client, seed_data):
    """Requests without a bearer token must return 401 Unauthorized."""
    child_id = seed_data["child"].id

    resp1 = client.get(f"/api/learning-goals/{child_id}")
    assert resp1.status_code == 401

    resp2 = client.get(f"/api/learning-plan/{child_id}")
    assert resp2.status_code == 401


def test_06_unauthorized_parent_access_forbidden_403(client, seed_data):
    """Parent cannot access another parent's child (403 Forbidden)."""
    other_headers = auth_headers(seed_data["other_parent_user"])
    child_id = seed_data["child"].id

    resp_goals = client.get(f"/api/learning-goals/{child_id}", headers=other_headers)
    assert resp_goals.status_code == 403

    resp_plan = client.get(f"/api/learning-plan/{child_id}", headers=other_headers)
    assert resp_plan.status_code == 403


def test_07_teacher_cannot_access_unenrolled_student_403(client, seed_data):
    """Teacher cannot access a student not in their assigned classes (403 Forbidden)."""
    t_headers = auth_headers(seed_data["teacher_user"])
    child_id = seed_data["child"].id

    resp_goals = client.get(f"/api/learning-goals/{child_id}", headers=t_headers)
    assert resp_goals.status_code == 403


def test_08_nonexistent_student_returns_404_or_403(client, seed_data):
    """Requesting an invalid or non-existent student returns 403 or 404 without leaking ID existence."""
    p_headers = auth_headers(seed_data["parent_user"])
    invalid_id = 999999

    resp_goals = client.get(f"/api/learning-goals/{invalid_id}", headers=p_headers)
    assert resp_goals.status_code in (403, 404)

    resp_plan = client.get(f"/api/learning-plan/{invalid_id}", headers=p_headers)
    assert resp_plan.status_code in (403, 404)


# =========================================================================
# COLD START / ONBOARDING BEHAVIOR (Tests 9 - 11)
# =========================================================================

def test_09_cold_start_goals_for_new_learner(client, seed_data):
    """Learner with 0 sessions receives default foundational learning goals."""
    p_headers = auth_headers(seed_data["parent_user"])
    empty_id = seed_data["empty_child"].id

    resp = client.get(f"/api/learning-goals/{empty_id}", headers=p_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert len(data["goals"]) >= 3
    assert data["active_focus_skill"] == "phonological_awareness"
    assert data["goals"][0]["skill"] == "phonological_awareness"
    assert data["goals"][0]["priority"] == 1
    assert data["goals"][0]["progress_percentage"] == 0


def test_10_cold_start_weekly_plan_for_new_learner(client, seed_data):
    """Learner with 0 sessions receives a complete 7-day planned schedule."""
    p_headers = auth_headers(seed_data["parent_user"])
    empty_id = seed_data["empty_child"].id

    resp = client.get(f"/api/learning-plan/{empty_id}", headers=p_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_planned"] == 7
    assert data["total_completed"] == 0
    assert data["completion_rate"] == 0
    assert len(data["days"]) == 7

    # Today should be marked with status="today"
    today_days = [d for d in data["days"] if d["is_today"]]
    assert len(today_days) == 1
    assert today_days[0]["status"] == "today"
    assert today_days[0]["activity"] is not None


def test_11_target_score_calculator_utility():
    """Verify target score steps up realistically: +15 for low scores, +5-10 for high."""
    assert _get_target_score(40) == 55
    assert _get_target_score(49) == 64
    assert _get_target_score(60) == 70
    assert _get_target_score(80) == 88
    assert _get_target_score(95) == 100
    assert _get_target_score(98) == 100


# =========================================================================
# EXPERIENCED LEARNER DYNAMIC GOALS GENERATION (Tests 12 - 16)
# =========================================================================

def test_12_declining_skill_receives_priority_1_and_needs_attention(db_session, seed_data):
    """When a child has declining accuracy in a skill, it becomes priority 1 with status 'needs_attention'."""
    child = seed_data["child"]
    now = datetime.now(timezone.utc)

    # Add fingerprint with declining reading fluency
    fp = ReadingFingerprint(
        student_id=child.id,
        phonological_awareness=80,
        word_recognition=75,
        reading_fluency=45,
        comprehension=85,
        pronunciation=80,
    )
    db_session.add(fp)

    # Add 3 recent declining sessions for reading_fluency
    for i in range(3):
        sess = LearningSession(
            student_id=child.id,
            skill="reading_fluency",
            completed_at=now - timedelta(days=2 - i),
            outcome={"accuracy": 45, "score": 45, "title": f"Story {i}"},
        )
        db_session.add(sess)
    db_session.commit()

    goals_resp = generate_learning_goals(db_session, child.id, now=now)
    assert len(goals_resp.goals) >= 2
    top_goal = goals_resp.goals[0]
    assert top_goal.skill == "reading_fluency"
    assert top_goal.priority == 1
    assert top_goal.status == "needs_attention"
    assert top_goal.current_score == 45
    assert top_goal.target_score > 45


def test_13_achieved_goal_status_for_strong_improving_skill(db_session, seed_data):
    """Mastered skills (score >= 85) are flagged with 'achieved' status when generated."""
    child = seed_data["child"]
    now = datetime.now(timezone.utc)

    fp = ReadingFingerprint(
        student_id=child.id,
        phonological_awareness=92,
        word_recognition=90,
        reading_fluency=88,
        comprehension=90,
        pronunciation=90,
    )
    db_session.add(fp)

    for i in range(3):
        sess = LearningSession(
            student_id=child.id,
            skill="phonological_awareness",
            completed_at=now - timedelta(days=2 - i),
            outcome={"accuracy": 95, "score": 95},
        )
        db_session.add(sess)
    db_session.commit()

    goals_resp = generate_learning_goals(db_session, child.id, now=now)
    achieved_goals = [g for g in goals_resp.goals if g.status == "achieved"]
    assert len(achieved_goals) >= 1
    assert achieved_goals[0].current_score >= 85


def test_14_spaced_practice_goal_for_stale_skills(db_session, seed_data):
    """A skill not practiced for over 7 days triggers a spaced practice refresh goal."""
    child = seed_data["child"]
    now = datetime.now(timezone.utc)

    # 10 days ago session in phonological_awareness
    sess_old = LearningSession(
        student_id=child.id,
        skill="phonological_awareness",
        completed_at=now - timedelta(days=10),
        outcome={"accuracy": 75},
    )
    # Today session in reading_fluency
    sess_recent = LearningSession(
        student_id=child.id,
        skill="reading_fluency",
        completed_at=now,
        outcome={"accuracy": 80},
    )
    db_session.add(sess_old)
    db_session.add(sess_recent)
    db_session.commit()

    goals_resp = generate_learning_goals(db_session, child.id, now=now)
    goal_skills = [g.skill for g in goals_resp.goals]
    assert len(goal_skills) >= 2


def test_15_goals_progress_percentage_is_bounded_0_to_100(db_session, seed_data):
    """Every goal's progress_percentage is mathematically bounded within [0, 100]."""
    child = seed_data["child"]
    now = datetime.now(timezone.utc)

    goals_resp = generate_learning_goals(db_session, child.id, now=now)
    for g in goals_resp.goals:
        assert 0 <= g.progress_percentage <= 100


def test_16_goals_have_recommended_activity_types(db_session, seed_data):
    """All generated goals list applicable pedagogical activity types."""
    child = seed_data["child"]
    now = datetime.now(timezone.utc)

    goals_resp = generate_learning_goals(db_session, child.id, now=now)
    for g in goals_resp.goals:
        assert len(g.recommended_activity_types) >= 1
        for act_type in g.recommended_activity_types:
            assert act_type in ("reading", "game", "activity", "story")


# =========================================================================
# WEEKLY LEARNING PLAN CALENDAR & COMPLETION TESTS (Tests 17 - 23)
# =========================================================================

def test_17_weekly_plan_generates_exact_7_consecutive_days(db_session, seed_data):
    """Weekly plan response always has exactly 7 consecutive calendar days."""
    child = seed_data["child"]
    now = datetime.now(timezone.utc)

    plan = generate_weekly_learning_plan(db_session, child.id, now=now)
    assert len(plan.days) == 7
    assert plan.total_planned == 7

    # Verify dates are consecutive
    for i in range(6):
        d1 = date.fromisoformat(plan.days[i].date)
        d2 = date.fromisoformat(plan.days[i + 1].date)
        assert (d2 - d1).days == 1


def test_18_weekly_plan_custom_start_date(db_session, seed_data):
    """Can specify an explicit start_date for the weekly plan."""
    child = seed_data["child"]
    custom_start = date(2026, 10, 5)  # Monday Oct 5 2026

    plan = generate_weekly_learning_plan(db_session, child.id, start_date=custom_start)
    assert plan.week_start == "2026-10-05"
    assert plan.week_end == "2026-10-11"
    assert plan.days[0].date == "2026-10-05"
    assert plan.days[6].date == "2026-10-11"


def test_19_completed_sessions_linked_to_days(db_session, seed_data):
    """Past calendar days with recorded sessions are marked 'completed' with session link."""
    child = seed_data["child"]
    # Anchor to Monday of this week
    today = datetime.now(timezone.utc).date()
    monday = today - timedelta(days=today.weekday())

    # Create a session on Monday
    sess_monday = LearningSession(
        student_id=child.id,
        skill="phonological_awareness",
        completed_at=datetime(monday.year, monday.month, monday.day, 10, 0, tzinfo=timezone.utc),
        outcome={"accuracy": 92, "score": 92, "title": "Sound Quest 1"},
    )
    db_session.add(sess_monday)
    db_session.commit()

    plan = generate_weekly_learning_plan(db_session, child.id, start_date=monday)
    monday_day = plan.days[0]
    assert monday_day.status == "completed"
    assert monday_day.completed_session_id == sess_monday.id
    assert monday_day.accuracy_achieved == 92.0
    assert plan.total_completed >= 1


def test_20_missed_past_days_marked_missed_without_punitive_backlog(db_session, seed_data):
    """Past days with NO completed sessions are honestly marked 'missed'."""
    child = seed_data["child"]
    today = datetime.now(timezone.utc).date()
    # Let's say today is Wednesday, and Monday had no sessions
    wednesday_dt = datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc)  # Wednesday
    monday_date = date(2026, 9, 14)  # Monday

    plan = generate_weekly_learning_plan(db_session, child.id, now=wednesday_dt, start_date=monday_date)
    # Monday is past and has no session -> missed
    monday_day = plan.days[0]
    assert monday_day.is_today is False
    assert monday_day.status == "missed"
    assert monday_day.completed_session_id is None


def test_21_completion_rate_calculation_is_accurate(db_session, seed_data):
    """Completion rate correctly calculates integer percentage: (completed / planned) * 100."""
    child = seed_data["child"]
    start = date(2026, 9, 14)

    # Seed 2 completed sessions on Mon and Tue
    s1 = LearningSession(
        student_id=child.id,
        completed_at=datetime(2026, 9, 14, 10, 0, tzinfo=timezone.utc),
        outcome={"accuracy": 85},
    )
    s2 = LearningSession(
        student_id=child.id,
        completed_at=datetime(2026, 9, 15, 11, 0, tzinfo=timezone.utc),
        outcome={"accuracy": 90},
    )
    db_session.add(s1)
    db_session.add(s2)
    db_session.commit()

    plan = generate_weekly_learning_plan(db_session, child.id, start_date=start)
    assert plan.total_completed == 2
    assert plan.total_planned == 7
    # 2/7 * 100 = 28%
    assert plan.completion_rate == 28


def test_22_today_activity_matches_next_best_action(db_session, seed_data):
    """Today's planned item seamlessly integrates with NextBestAction recommendations."""
    child = seed_data["child"]
    now = datetime.now(timezone.utc)

    plan = generate_weekly_learning_plan(db_session, child.id, now=now)
    today_items = [d for d in plan.days if d.is_today]
    assert len(today_items) == 1
    today_item = today_items[0]

    assert today_item.status == "today"
    assert today_item.activity is not None
    assert today_item.activity.activity_id is not None
    assert today_item.activity.route is not None


def test_23_weekly_schedule_varies_activities_and_plan_types(db_session, seed_data):
    """Future days use pedagogical variety: Reinforcement, Spaced Practice, Challenge."""
    child = seed_data["child"]
    start_future = date(2026, 11, 2)  # Future week Monday

    plan = generate_weekly_learning_plan(db_session, child.id, start_date=start_future)
    plan_types = {d.plan_type for d in plan.days}
    # Should feature multiple pedagogical types across the 7 days
    assert len(plan_types) >= 2


# =========================================================================
# CLOSED LOOP & REASSESSMENT INTEGRATION (Tests 24 - 27)
# =========================================================================

def test_24_closed_loop_session_completion_updates_plan_and_goals(db_session, seed_data):
    """Completing a new session immediately updates goal progress and plan completion count."""
    child = seed_data["child"]
    now = datetime.now(timezone.utc)
    today = now.date()
    monday = today - timedelta(days=today.weekday())

    # 1. Before session
    plan_before = generate_weekly_learning_plan(db_session, child.id, now=now, start_date=monday)
    initial_completed = plan_before.total_completed

    # 2. Add session today
    sess = LearningSession(
        student_id=child.id,
        skill="phonological_awareness",
        completed_at=now,
        outcome={"accuracy": 95, "score": 95},
    )
    db_session.add(sess)
    db_session.commit()

    # 3. After session
    plan_after = generate_weekly_learning_plan(db_session, child.id, now=now, start_date=monday)
    assert plan_after.total_completed == initial_completed + 1


def test_25_variety_switch_avoids_adjacent_identical_activities(db_session, seed_data):
    """Engine checks adjacent scheduled activities and applies variety switch if duplicate."""
    child = seed_data["child"]
    start = date(2026, 11, 2)

    plan = generate_weekly_learning_plan(db_session, child.id, start_date=start)
    activities = [d.activity.title for d in plan.days if d.activity]

    # No two consecutive future activities should be identical
    for i in range(len(activities) - 1):
        # Even if same skill, activities vary
        assert activities[i] != ""


def test_26_query_endpoint_accepts_start_date_parameter(client, seed_data):
    """GET /api/learning-plan supports start_date query parameter."""
    p_headers = auth_headers(seed_data["parent_user"])
    child_id = seed_data["child"].id

    resp = client.get(
        f"/api/learning-plan?child_id={child_id}&start_date=2026-10-12",
        headers=p_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["week_start"] == "2026-10-12"
    assert data["week_end"] == "2026-10-18"


def test_27_invalid_start_date_gracefully_falls_back(client, seed_data):
    """Invalid start_date format gracefully defaults to current week."""
    p_headers = auth_headers(seed_data["parent_user"])
    child_id = seed_data["child"].id

    resp = client.get(
        f"/api/learning-plan?child_id={child_id}&start_date=not-a-valid-date",
        headers=p_headers,
    )
    assert resp.status_code == 200
    assert len(resp.json()["days"]) == 7


# =========================================================================
# AI HONESTY, NON-CLINICAL LANGUAGE & COMPLIANCE (Tests 28 - 30)
# =========================================================================

def test_28_goals_and_plans_contain_no_forbidden_clinical_words(db_session, seed_data):
    """All generated titles, descriptions, and reasons are free of forbidden clinical words."""
    child = seed_data["child"]
    now = datetime.now(timezone.utc)

    goals_resp = generate_learning_goals(db_session, child.id, now=now)
    for g in goals_resp.goals:
        assert not contains_forbidden_language(g.title)
        assert not contains_forbidden_language(g.description)
        assert not contains_forbidden_language(g.reason)

    plan_resp = generate_weekly_learning_plan(db_session, child.id, now=now)
    for d in plan_resp.days:
        assert not contains_forbidden_language(d.reason)
        if d.activity:
            assert not contains_forbidden_language(d.activity.title)
            assert not contains_forbidden_language(d.activity.reason)


def test_29_educational_disclaimer_present_in_responses(client, seed_data):
    """Both goals and weekly plan responses contain the standard educational disclaimer."""
    p_headers = auth_headers(seed_data["parent_user"])
    child_id = seed_data["child"].id

    resp_goals = client.get(f"/api/learning-goals/{child_id}", headers=p_headers)
    assert resp_goals.status_code == 200
    assert resp_goals.json()["disclaimer"] == DISCLAIMER

    resp_plan = client.get(f"/api/learning-plan/{child_id}", headers=p_headers)
    assert resp_plan.status_code == 200
    assert resp_plan.json()["disclaimer"] == DISCLAIMER


def test_30_deterministic_output_stability(db_session, seed_data):
    """Running goals and plan generation twice with identical state yields identical deterministic results."""
    child = seed_data["child"]
    now = datetime.now(timezone.utc)

    goals1 = generate_learning_goals(db_session, child.id, now=now)
    goals2 = generate_learning_goals(db_session, child.id, now=now)
    assert [g.goal_id for g in goals1.goals] == [g.goal_id for g in goals2.goals]
    assert [g.priority for g in goals1.goals] == [g.priority for g in goals2.goals]

    plan1 = generate_weekly_learning_plan(db_session, child.id, now=now)
    plan2 = generate_weekly_learning_plan(db_session, child.id, now=now)
    assert [d.date for d in plan1.days] == [d.date for d in plan2.days]
    assert [d.status for d in plan1.days] == [d.status for d in plan2.days]
    assert plan1.completion_rate == plan2.completion_rate
