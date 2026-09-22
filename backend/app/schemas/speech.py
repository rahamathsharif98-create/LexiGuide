from pydantic import BaseModel


class SpeechStatusOut(BaseModel):
    ai_mode: str
    stt_provider: str
    whisper_installed: bool
    ffmpeg_available: bool
    whisper_model: str
    max_audio_upload_mb: int
    reading_alignment_available: bool = True
    comprehension_analysis_available: bool = True
    pronunciation_analysis_available: bool = False
    phoneme_analysis_available: bool = False


class SpeechTranscribeOut(BaseModel):
    transcription: str
    language: str | None = None
    confidence: float | None = None
    duration_seconds: float | None = None
    analysis_available: bool = True
    ai_mode: str = "mock"
    is_mock: bool = True
    status: str = "ok"


class SpeechAnalyzeRequest(BaseModel):
    expected_text: str
    recognized_text: str


class SpeechAnalyzeOut(BaseModel):
    words_attempted: int
    words_recognized: int
    words_correct: int
    omissions: int
    substitutions: int
    insertions: int
    repetitions: int
    hesitations: int
    hesitations_available: bool = False
    accuracy: float
    word_order_mismatch: bool = False
    error_words: list[dict] = []
    pronunciation_score: float | None = None
    fluency_score: float | None = None
    comprehension_score: float | None = None
    pronunciation_analysis_available: bool = False
    phoneme_analysis_available: bool = False
    ai_mode: str = "mock"
    is_mock: bool = True
    disclaimer: str
