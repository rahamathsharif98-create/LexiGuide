"""Shared audio-upload validation for every endpoint that accepts a child's
recorded audio (POST /api/speech/transcribe, POST
/api/reading/session-audio). One place to enforce format/size limits so
the two routes can't drift out of sync with each other.

Privacy note (Phase 8 Step 2 requirement): this module only ever returns
bytes already read into memory by FastAPI's UploadFile — it never writes
the incoming upload to disk itself. Any implementation downstream that
DOES need a real file (RealSpeechToTextService, because whisper needs a
path) is responsible for creating its own temp file and deleting it in a
`finally` block — see app/ai/stt/real.py. This function never logs the
audio content, only its size and content-type.
"""
from fastapi import HTTPException, UploadFile

ALLOWED_CONTENT_TYPES = {
    "audio/wav", "audio/x-wav", "audio/wave",
    "audio/mpeg", "audio/mp3",
    "audio/mp4", "audio/m4a", "audio/x-m4a",
    "audio/webm",
    "audio/ogg", "audio/vorbis",
    "audio/flac", "audio/x-flac",
}
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac", ".mp4"}


async def read_and_validate_audio(file: UploadFile, max_mb: int) -> bytes:
    """Read an uploaded audio file into memory, enforcing type and size
    limits. Raises HTTPException(400) with a clean, user-facing message on
    any validation failure — never leaks a filesystem path or internal
    detail to the caller.
    """
    if file is None or not file.filename:
        raise HTTPException(status_code=400, detail="No audio file was provided")

    ext = ""
    if "." in file.filename:
        ext = "." + file.filename.rsplit(".", 1)[-1].lower()

    # Browsers commonly send a codec parameter on the content-type (e.g. a
    # MediaRecorder blob is typically "audio/webm;codecs=opus", not bare
    # "audio/webm") — match on the MIME type only, not the full header
    # value, or every real browser-recorded upload gets wrongly rejected.
    raw_content_type = (file.content_type or "").lower()
    content_type = raw_content_type.split(";")[0].strip()
    content_type_ok = content_type in ALLOWED_CONTENT_TYPES
    extension_ok = ext in ALLOWED_EXTENSIONS
    if not (content_type_ok or extension_ok):
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format. Supported formats: wav, mp3, m4a, webm, ogg, flac.",
        )

    audio_bytes = await file.read()

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="The uploaded audio file is empty")

    max_bytes = max_mb * 1024 * 1024
    if len(audio_bytes) > max_bytes:
        raise HTTPException(status_code=400, detail=f"Audio file is too large — the limit is {max_mb} MB")

    return audio_bytes
