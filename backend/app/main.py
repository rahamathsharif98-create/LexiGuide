from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import (
    health, students, classes, activities, parent, teacher,
    auth, children, learning, reading, speech, fingerprint, recommendations, progress, achievements,
    intelligence, search, learning_plan, personalized_content, content, multimodal, child_profile, voice,
)

app = FastAPI(
    title="LexiGuide API",
    description="Backend for the LexiGuide: An AI-Powered Intelligent Learning Support Platform for Children with Reading Difficulties. "
                "This is an educational screening and learning support tool — it does not provide a clinical diagnosis.",
    version="0.1.0",
)

_raw_origins = [o.strip() for o in settings.FRONTEND_ORIGIN.split(",") if o.strip()]
_origins = set(_raw_origins)
for o in _raw_origins:
    if "localhost" in o:
        _origins.add(o.replace("localhost", "127.0.0.1"))
    if "127.0.0.1" in o:
        _origins.add(o.replace("127.0.0.1", "localhost"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(list(_origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Never leak raw stack traces to the client.
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(children.router)
app.include_router(classes.router)
app.include_router(activities.router)
app.include_router(learning.router)
app.include_router(reading.router)
app.include_router(speech.router)
app.include_router(fingerprint.router)
app.include_router(recommendations.router)
app.include_router(progress.router)
app.include_router(achievements.router)
app.include_router(parent.router)
app.include_router(teacher.router)
app.include_router(intelligence.router)
app.include_router(search.router)
app.include_router(learning_plan.router)
app.include_router(personalized_content.router)
app.include_router(content.router)
app.include_router(multimodal.router)
app.include_router(child_profile.router)
app.include_router(voice.router)

