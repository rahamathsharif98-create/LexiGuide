# LexiGuide Backend

FastAPI + PostgreSQL backend for LexiGuide: An AI-Powered Intelligent Learning Support Platform for Children with Reading Difficulties.
real persistence for students, sessions, fingerprints, and recommendations,
with the frontend gradually connecting to it while keeping its mock data as
a fallback. No real authentication, real speech AI, or deployment yet —
those are later phases.

## 1. Install Python

Requires Python 3.11+.

- **Windows**: download from https://python.org and check "Add to PATH" during install.
- **macOS/Linux**: usually preinstalled; otherwise use your package manager.

Verify: `python --version` (Windows) or `python3 --version` (macOS/Linux).

## 2. Install PostgreSQL

- **Windows**: download the installer from https://www.postgresql.org/download/windows/. Remember the password you set for the `postgres` superuser during setup.
- **macOS**: `brew install postgresql@16` then `brew services start postgresql@16`.
- **Linux (Debian/Ubuntu)**: `sudo apt-get install postgresql postgresql-contrib`.

## 3. Create the database and app user

Open `psql` (Windows: "SQL Shell (psql)" from the Start menu; macOS/Linux: `psql -U postgres`) and run:

```sql
CREATE USER readquest WITH PASSWORD 'readquest_dev_pw';
CREATE DATABASE readquest OWNER readquest;
CREATE DATABASE readquest_test OWNER readquest;
```

(Change the password to whatever you like — just update `.env` to match.)

## 4. Create a virtual environment

```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate

# macOS/Linux:
source .venv/bin/activate
```

## 5. Install dependencies

```bash
pip install fastapi "uvicorn[standard]" "sqlalchemy>=2.0" psycopg2-binary pydantic pydantic-settings python-dotenv alembic pytest httpx bcrypt "python-jose[cryptography]" python-multipart email-validator
```

(A `requirements.txt` with pinned versions can be generated with `pip freeze > requirements.txt` once your environment is set up.)

`python-multipart` above is what makes file uploads (`POST /api/speech/transcribe`,
`POST /api/reading/session-audio`) work — it's already in the list, no
extra step needed for mock-mode audio uploads. `openai-whisper` is
**not** in this list — it's an optional, separate install, only needed if
you plan to set `AI_MODE=real` (see "Phase 8 Step 2" further down).

## 6. Configure environment

```bash
# Windows: copy .env.example .env
# macOS/Linux:
cp .env.example .env
```

Edit `.env` if your PostgreSQL user/password/host differ from the defaults.

## 7. Run the Alembic migration

```bash
python -m alembic upgrade head
```

This creates every table (`users`, `students`, `parents`, `teachers`, `classes`,
`class_students`, `parent_child`, `activities`, `learning_sessions`,
`reading_observations`, `reading_fingerprints`, `recommendations`,
`achievements`).

To create a new migration after changing a model:
```bash
python -m alembic revision --autogenerate -m "describe your change"
python -m alembic upgrade head
```

To reset your local dev database from scratch:
```bash
python -m alembic downgrade base
python -m alembic upgrade head
python -m app.seed
```

## 8. Seed demo data

```bash
python -m app.seed
```

Creates 1 demo teacher, 1 demo parent, 5 demo students (Aarav, Meera, Kabir,
Priya, Rohan — matching the frontend's existing demo names/ages/avatars for
compatibility), 1 class, 7 activities, fingerprint history, sessions,
observations, achievements, and recommendations. Running it twice is
harmless — it skips seeding if data already exists.

## 9. Start FastAPI

```bash
python -m uvicorn app.main:app --reload
```

Runs on http://localhost:8000.

## 10. Start the React frontend

In a separate terminal, from the project root (not `backend/`):

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` at the project root first if you want the
frontend to point at a non-default backend URL.

## 11. Run backend tests

```bash
cd backend
python -m pytest tests/ -v
```

Tests run against `TEST_DATABASE_URL` (`readquest_test`) — never your dev
or production database. Tables are created fresh and dropped after each
test for isolation.

## 12. Open API documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project layout

```
backend/
├── app/
│   ├── main.py          FastAPI app, CORS, error handling, router wiring
│   ├── config.py        Settings loaded from .env
│   ├── database.py      SQLAlchemy engine/session
│   ├── seed.py           Demo data seeding script
│   ├── models/           SQLAlchemy models (one file per entity)
│   ├── schemas/          Pydantic request/response schemas
│   ├── routers/          Thin route handlers (students, classes, activities, parent, teacher, health)
│   ├── services/         Business logic (student/session/fingerprint/progress/recommendation/parent/teacher)
│   └── utils/            Shared helpers (language.py — non-diagnostic phrasing guardrails)
├── alembic/               Migrations
├── tests/                 Backend test suite (pytest)
├── .env.example
└── README.md              This file
```

## Phase 8 Step 1 — authorization hardening (this pass)

The Phase 7 line below used to claim that `/api/learning/*`, `/api/reading/*`,
`/api/fingerprint/*`, `/api/recommendations/*`, `/api/progress/*`, and
`/api/achievements/*` all enforced parent/teacher ownership. That was true
of `/api/children/*` only — the other six route files checked that the
caller had *a* valid token, but never that the token's owner had any
relationship to the specific `child_id`/`student_id` in the URL or body.
Any authenticated parent or teacher could read or write any other family's
reading sessions, fingerprint, recommendations, progress, and achievements.

Fixed by adding one call — `assert_can_access_child(db, current_user, child_id)`
(`app/utils/authorization.py`) — at the top of every handler in those six
router files, before any data is read or written. It dispatches to the
existing `assert_parent_owns_child` / `assert_teacher_owns_student` (no
ownership logic was duplicated) and denies non-parent/teacher/child roles
by default. It also runs *before* `student_service.get_student_or_404`, so
a denied request can't be used to fingerprint which child IDs exist — both
"real child, not yours" and "made-up ID" now return the same 403.

`POST /api/speech/analyze` was reviewed and left unauthenticated on
purpose: it takes only two raw strings, persists nothing, and is never
associated with a specific child_id — there's no child-specific data at
that endpoint to protect. See the comment in `app/routers/speech.py` for
the full reasoning and the condition under which this should be revisited.

22 new tests in `tests/test_authorization_phase8.py` cover: an unrelated
parent/teacher denied on both reads and writes across all six routes, the
actual owner still succeeding, and the no-existence-leak behavior above.
**These tests were written but not executed in the environment that made
this change** — no PostgreSQL instance and no network access to install
`fastapi`/`sqlalchemy`/etc. were available there. All six modified router
files and the new test file were verified to be syntactically valid
(`python -m py_compile`), and the single existing test that exercises
these routes (`test_reading_and_ai.py::test_full_reading_session_closed_loop`,
which uses a child-role login accessing its own data) was manually traced
against the new code and should still pass, but **run
`cd backend && python -m pytest tests/ -v` yourself before trusting this**.

## Phase 8 Step 2 — real speech & reading analysis

### What changed
- New `SpeechToTextService` interface (`app/ai/stt/base.py`) with
  `MockSpeechToTextService` (no dependencies, echoes back a supplied
  `expected_text_hint` for dev/testing rather than pretending to
  understand arbitrary audio) and `RealSpeechToTextService` (Whisper).
- `app/ai/factory.py` picks mock vs. real for BOTH the analysis service
  and the STT service from `AI_MODE` — nothing else in the app needs to
  change to switch modes.
- The word-level error-detection algorithm (omission/substitution/
  insertion/repetition, plus a narrow word-order-mismatch flag) was
  rewritten as a proper Needleman-Wunsch alignment in `app/ai/alignment.py`,
  shared by `MockAIAnalysisService` and the new `RealAIAnalysisService` —
  the Phase 7 mock did a naive positional comparison that couldn't detect
  insertions and could cascade one dropped word into several false
  substitutions.
- `POST /api/speech/transcribe` (new, unauthenticated — see the docstring
  in `app/routers/speech.py` for why) — audio in, transcript out, no
  persistence.
- `POST /api/reading/session-audio` (new, authenticated + ownership-checked
  like `/api/reading/session`) — the full closed loop from an uploaded
  audio file: STT → reading-error analysis → persists to the SAME
  `LearningSession`/`ReadingSessionDetail` tables as the text-based
  `/session` endpoint → Reading Fingerprint update → recommendations
  regenerated from the new fingerprint.
- `POST /api/reading/comprehension` (new, authenticated + ownership-checked)
  — server-computed comprehension scoring from a list of
  question/correct_answer/child_answer triples. Reuses the existing
  `LearningSession.outcome` JSON column (no new table) and the existing
  `"story"` branch in `fingerprint_service.record_fingerprint_update`
  (already nudged the `comprehension` skill — it just wasn't reachable
  from a real endpoint before).
- **Recommendations are now actually regenerated after a reading session.**
  `recommendation_service.persist_recommendations_for_student` existed
  since Phase 5/7 but was only ever called from `seed.py` — the live
  `/api/reading/session` closed loop never called it, so
  `GET /api/recommendations/{child_id}` only ever returned real data for
  seeded demo students, never for a session recorded through the API.
  Fixed by calling it from the same place the fingerprint gets updated.
- `ReadingObservation` rows (per-word omission/substitution/repetition,
  with the specific word) are now created for every reading session —
  that model existed since Phase 5 but, like the recommendation call
  above, was only ever populated by `seed.py`, never by a live session.
  Insertions are counted and returned in the API response but not
  persisted as an observation row — there's no matching
  `ObservationType` value, and adding one means an Alembic migration to
  alter the Postgres enum, which this pass avoids per "don't change the
  schema unless necessary."

### Mock vs. real, concretely
| | Mock (`AI_MODE=mock`, default) | Real (`AI_MODE=real`) |
|---|---|---|
| STT | Echoes `expected_text_hint` if given, else empty transcript | Whisper transcription of the uploaded audio |
| Reading-error detection | Same alignment algorithm as real | Same alignment algorithm as mock |
| `is_mock` | `true` everywhere | `false` everywhere |
| `confidence` | `null` (never fabricated) | `null` — Whisper doesn't expose one reliably |
| `pronunciation_analysis_available` | `false` — no phoneme-level model | `false` — same; not implemented in this pass |
| `hesitations_available` | `false` — simulated small random count only | `false` — would need audio pause-timing, not wired in this pass |
| Dependencies | none | `openai-whisper` + `ffmpeg` |

### Installing real mode (optional)
```bash
pip install -U openai-whisper --break-system-packages   # or inside your venv, without the flag
# ffmpeg must also be on PATH (apt install ffmpeg / brew install ffmpeg)
```
Then set `AI_MODE=real` in `.env` and restart the API. The Whisper model
(size set by `WHISPER_MODEL_SIZE`) downloads on first use of
`/api/speech/transcribe` or `/api/reading/session-audio` — that first
request will be slow.

**This real-mode path has not been executed in the environment that wrote
this code** — no network access to install `openai-whisper`/`ffmpeg` and
no PostgreSQL were available there. It's been written and reviewed against
Whisper's documented API, and the mock-mode path IS what the automated
tests exercise, but please verify real mode yourself before relying on it.

### Audio upload / privacy
- Accepted formats: wav, mp3, m4a, webm, ogg, flac (checked by content-type
  and, as a fallback, file extension — see `app/utils/audio.py`).
- Size limit: `MAX_AUDIO_UPLOAD_MB` (default 15MB), enforced before the
  audio is analyzed.
- Audio is read into memory by FastAPI's `UploadFile`, handed to the STT
  service, and never written to permanent storage anywhere in this
  backend. `RealSpeechToTextService` writes ONE temporary file (Whisper
  needs a filesystem path — it shells out to ffmpeg internally) inside a
  `try/finally` that unconditionally deletes it, even on error.
  `expected_text`/`recognized_text` (the transcript) — not the audio
  itself — is what gets persisted to `reading_session_details`, matching
  the Phase 7 schema.
- No raw audio, and no filesystem paths, are ever included in an API
  response or log line.

### Language support
`language` is an optional parameter on every STT/analysis call — `None`
means "auto-detect" where the backend supports it (Whisper does). Nothing
in `SpeechToTextService`, `AIAnalysisService`, or `app/ai/alignment.py` is
English-specific; `alignment.py`'s word comparison is Unicode-safe generic
string splitting, not an English-only tokenizer.

### Non-diagnostic language
Reused, not reinvented: `app/utils/language.py` (Phase 5) already maps
every observation type to safe, non-diagnostic phrasing and provides the
platform-wide `DISCLAIMER` and a `FORBIDDEN_PHRASES` list
(`"has dyslexia"`, `"diagnosed with dyslexia"`, etc.) used by tests to
assert no response body ever contains them. All Phase 8 Step 2 responses
route their user-facing text through this, and use skill-strength framing
("Skill to Practice", "Reading Pattern") rather than clinical language.

### Testing
`backend/tests/test_ai_phase8_step2.py` covers the alignment algorithm,
mock STT, audio upload validation, the full audio-session closed loop
(with a synthetic WAV fixture, MockSpeechToTextService — no real network
or model download needed), comprehension scoring, and unauthorized access
to the two new endpoints. See "Tests actually executed" in the Phase 8
Step 2 report for what could and couldn't be run in this environment.

## Known limitations (honest, not hidden)

- **Frontend token usage is partial.** Login (`POST /api/auth/login`) works fully from the Parent/Teacher login pages with real success/failure handling, but the returned JWT is not yet attached to subsequent frontend API calls (the two Phase 5 integration points — Teacher Students list and Student Profile fingerprint — call unauthenticated legacy routes). Wiring a persistent auth context across the whole frontend is flagged as the natural next step, not done this pass.
- The original `/api/students/*` routes (Phase 5) remain **unauthenticated** for backward compatibility — this is unchanged by the Phase 8 Step 1 fix above, which only touched the six Phase 7 route files listed there. The new `/api/children/*`, `/api/learning/*`, `/api/reading/*`, `/api/fingerprint/*`, `/api/recommendations/*`, `/api/progress/*`, `/api/achievements/*` routes (Phase 7) **do** require a valid bearer token, and — as of Phase 8 Step 1 — all now enforce parent/teacher/child ownership, not just token validity.
- 30/90-day progress trends are only as good as the real historical `reading_fingerprints` rows that exist — a freshly seeded student only has a few days of history.
- The mock AI service (`app/ai/mock.py`) does genuine word-by-word text comparison — it is NOT real speech recognition. There is no audio processing anywhere in this backend. A real implementation would run Whisper STT to produce `recognized_text` from actual audio before this comparison step; `RealAIAnalysisService` can implement the same `AIAnalysisService` interface with zero changes needed at any call site.
- `ReadingSessionDetail` extends `LearningSession` (1:1) rather than duplicating a full second sessions table, and `ReadingObservation`/`ReadingError` are the same concept under one name — noted here so it's clear this was a deliberate non-duplication choice, not an oversight.
- The test database's schema is managed by two different mechanisms that can drift: Alembic migrations, and the test suite's own `Base.metadata.create_all/drop_all` per test. If you add a new migration, reset the test DB schema before running `pytest` again:
  ```bash
  # In psql, connected to readquest_test:
  DROP SCHEMA public CASCADE; CREATE SCHEMA public;
  # Then:
  python -m alembic upgrade head
  ```

## Phase 9 — Adaptive Learning Engine

Turns the existing Reading Fingerprint + `LearningSession` history into a
continuous loop: performance → learning profile → pattern detection →
adaptive difficulty → activity recommendation → child completes activity →
new performance → fingerprint updates → profile recomputed → ...

**Deliberately not a second system.** The engine (`app/services/adaptive_learning_service.py`,
class `AdaptiveLearningEngine`) reuses, rather than duplicates:
- `fingerprint_service.SKILL_KEYS` / `get_latest_fingerprint` for "current level"
- `recommendation_service.ACTIVITY_MAP` / `LABEL` for skill → activity/route/icon
- `app/utils/skills.py` (new, small) for translating `LearningSession.skill`
  (camelCase, e.g. `"wordRecognition"`) into the snake_case fingerprint key —
  the same attribution rules `fingerprint_service` already uses when nudging
  the fingerprint from a completed session.

**Learning profile** (`analyze_learning_profile()`): for every tracked skill,
computed live from stored history — never a single mutable row — current
level (from the fingerprint), attempts, recent/historical performance
averages, trend, consistency, a detected pattern with a plain-language
explanation, a derived difficulty level, days since last practiced, and
whether it's recommended for practice.

**Pattern detection** (`_detect_pattern`): seven explainable patterns —
consistently strong, improving, recently improved, inconsistent, needs
practice, repeatedly struggling, not practiced recently — plus "not yet
practiced" for a skill with zero recorded attempts. Priority-ordered so
repeated evidence always outweighs one unusual result: a single low score
never alone produces "repeatedly struggling", and a genuinely inconsistent
skill (e.g. 82/48/85/50) is never mislabeled simply "weak".

**Adaptive difficulty** (`_difficulty_for`): difficulty (1 Beginner .. 4
Advanced) is *rederived* each time by replaying the student's full accuracy
history in successive windows, adjusting by at most one level per window.
This gives a difficulty that genuinely depends on performance history and
never jumps more than one level at a time, without a separately persisted
"current difficulty" column to keep in sync — no migration needed, and it's
always computed the same way from the same source of truth.

**Activity selection & variety** (`select_activity`, STEP 10): every
candidate activity is checked against the student's most recent completed
sessions; if the same activity was just played back-to-back up to the
configured repetition limit, `generate_next_activity` documents that
(`repeated: true`) and falls through to the next-highest-priority skill
instead of recommending the same thing again with no reason.

**Personalized learning path / next best activity / spaced practice**:
`generate_learning_path()` returns a priority-ordered list of
skill→activity steps; `generate_next_activity()` answers "what should this
child practice next?" with `activity`, `skill`, `difficulty`, `reason`, and
`goal` — always explainable, never an unexplained AI decision;
`spaced_practice_candidates()` resurfaces skills that have gone stale
(haven't been practiced in `ADAPTIVE_SPACED_PRACTICE_INTERVAL_DAYS`) even
if they aren't currently the weakest skill.

**Configuration** — every threshold lives in `app/config.py`
(`ADAPTIVE_MIN_DIFFICULTY`, `ADAPTIVE_MAX_DIFFICULTY`,
`ADAPTIVE_HIGH_PERFORMANCE_THRESHOLD`, `ADAPTIVE_LOW_PERFORMANCE_THRESHOLD`,
`ADAPTIVE_RECENT_SESSION_WINDOW`, `ADAPTIVE_MIN_ATTEMPTS_FOR_TREND`,
`ADAPTIVE_INCONSISTENCY_SWING`, `ADAPTIVE_REPETITION_LIMIT`,
`ADAPTIVE_SPACED_PRACTICE_INTERVAL_DAYS`) — nothing is a scattered magic
number in the engine itself.

**API** — new endpoints on the existing recommendations router, all behind
the existing `assert_can_access_child` ownership check (parent → own child
only, teacher → authorized student only, child → own profile only):
- `GET /api/recommendations/next/{child_id}` — next best activity
- `GET /api/recommendations/profile/{child_id}` — full learning profile
- `GET /api/recommendations/path/{child_id}` — personalized learning path
- `GET /api/recommendations/spaced-practice/{child_id}` — stale skills due for review

**Child-facing language** — the child UI (`MyPractice.jsx`, `Home.jsx`)
never shows a pattern name, a percentage, or diagnostic language; patterns
map to short encouraging copy ("You're getting better at this!", "Let's
practice this a bit more!") via the frontend's `childFriendlyPatternText()`,
which mirrors this file's pattern set.

**Frontend integration note.** The child-facing pages (`Home`, `MyPractice`,
game/reading/story screens) were deliberately built in earlier phases to
work with **zero backend dependency** (see `src/context/AppContext.jsx`'s
own comment to that effect) — there is no auth flow or numeric child ID for
the demo child accounts (`'aarav'`, `'meera'`, `'kabir'`) to call the
authenticated endpoints above with. Rather than bolt on a fragile,
half-authenticated integration, Phase 9 ported the *same* adaptive concepts
(pattern detection, anti-repetition, spaced-practice-aware copy) into
`src/services/adaptiveEngine.js`, operating on the real client-side state
that already exists (`fingerprint`, session `history`, and a new
`recentActivityTitles` log in `AppContext`) — so My Practice/Home are
genuinely adaptive today, using the same thresholds and pattern logic as
the backend engine. The backend `AdaptiveLearningEngine` and its four
endpoints are complete and ready to be called directly once a real child
auth/session flow exists (a natural Phase 10+ prerequisite, not part of
this phase's scope).

**Limitations** — same disclaimer as the rest of the platform: LexiGuide
provides educational learning support and reading-pattern insights, not a
medical diagnosis. Pattern/difficulty thresholds are heuristic and tunable
(`app/config.py`), not clinically validated. The spaced-practice mechanism
is a simple "hasn't been touched in N days" rule, not a scientifically
validated spaced-repetition algorithm.

### Phase 9 — verification pass (this round)

A second session was asked to install dependencies, run `pytest`/`vitest`,
fix whatever those runs surfaced, and report real numbers. **That still
was not possible here**: this sandbox has no network egress at all (even
`pip install fastapi` fails with "No matching distribution found" —
confirmed directly, not assumed) and ships no `node_modules` or Postgres
instance, so neither test suite could actually be executed, and no pass/
fail count below is claimed or fabricated.

What *was* done instead — genuine static review, not another syntax pass:

- **Manually traced `_sessions_by_skill()` / `_timestamp_of()` for the
  exact bug class flagged in the handoff notes, and found a real one.**
  The SQL query ordered rows by `started_at`, but `_timestamp_of()` (used
  everywhere downstream — `records[-1]` for "last practiced", the recent-
  window slice `accuracies[-N:]` for trend/pattern detection) prefers
  `completed_at`. For any session where `completed_at` diverges from
  `started_at` (a long session, or one resumed later), the two orderings
  disagree and `by_skill[skill]` would silently NOT be in the
  chronological order every caller assumes — corrupting "last practiced"
  and the "recent performance" window without raising an error.
  **Fixed**: rows are now sorted in Python by `_timestamp_of(s)` itself
  (`app/services/adaptive_learning_service.py`, `_sessions_by_skill`)
  instead of trusting a SQL `ORDER BY` on a different column to happen to
  match. Confirmed the existing test suite's `make_session()` calls always
  pass `started_at` explicitly and never pass `completed_at` independently
  of it, so this bug would NOT have shown up as a test failure even under
  a real `pytest` run — it's a real-data edge case the fixture data
  couldn't surface, which is exactly why it needed manual tracing rather
  than "run the tests and see."
- **Re-checked `tests/factories.py::make_session`'s `started_at`/
  `completed_at` handling** (the other item flagged in the handoff). This
  one is actually correct as written: `completed_at` is nullable and is
  always given an explicit value (falling back to `started_at`, itself
  only included in the insert when the caller passed it — otherwise the
  column's `server_default=func.now()` applies). No divergent-timestamp
  bug here; the only risk (`started_at` violating its `NOT NULL` via an
  explicit `None`) is already avoided by the existing conditional.
- Re-ran `python -m py_compile` on the changed file and `node --check` on
  the frontend files this file's sibling scan touched — both clean.

**Still not verified, and I won't claim otherwise:** every numeric
threshold's actual behavior against the 21 backend tests, the 11 frontend
Phase 9 unit tests, and whether `npm run build` succeeds. Those require a
real Python + Postgres environment and a real `npm install`, neither
available here. Run `cd backend && python -m pytest tests/ -v` and
`npx vitest run` yourself; if either surfaces a failure, the fix above is
the only Phase 9 logic change made this round — everything else in this
codebase is exactly what shipped from the prior session.



