// speechService: abstraction over pronunciation/TTS.
// Uses the browser's SpeechSynthesis API when available. Designed so LexiGuide
// can later swap this for its own AI/STT/TTS pipeline without touching game code.

class SpeechService {
  constructor() {
    this.available = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.enabled = true;
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) this.cancel();
  }

  speak(text, { rate = 0.85, pitch = 1.1 } = {}) {
    if (!this.enabled || !this.available || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = rate;
      utter.pitch = pitch;
      utter.volume = 1;
      window.speechSynthesis.speak(utter);
    } catch {
      /* Speech unavailable — silently no-op so gameplay is unaffected. */
    }
  }

  speakLetter(letterEntry) {
    if (!letterEntry) return;
    this.speak(`${letterEntry.letter}. ${letterEntry.word}.`);
  }

  cancel() {
    if (this.available) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    }
  }
}

export const speechService = new SpeechService();
export default speechService;
