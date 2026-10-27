// speechService: abstraction over pronunciation/TTS.
// Integrates with LexiGuide's gameSoundService for soothing companion voice.
// Respects sound modes ('voice_and_sfx' allows speech; 'sfx_only' and 'muted' silence speech).

import { gameSound } from '../../../../services/gameSoundService';

class SpeechService {
  constructor() {
    this.available = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.enabled = true;
    this._unsubscribeSound = null;
    this.soundMode = typeof gameSound !== 'undefined' && typeof gameSound.getSoundMode === 'function'
      ? gameSound.getSoundMode()
      : 'voice_and_sfx';

    this._syncWithGlobalSound();
  }

  _syncWithGlobalSound() {
    if (typeof gameSound !== 'undefined' && typeof gameSound.subscribe === 'function') {
      if (this._unsubscribeSound) {
        this._unsubscribeSound();
      }
      this.soundMode = gameSound.getSoundMode();
      this._unsubscribeSound = gameSound.subscribe((mode) => {
        this.soundMode = mode;
        if (mode === 'muted' || mode === 'sfx_only') {
          this.cancel();
        }
      });
    }
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) this.cancel();
  }

  speak(text, options = {}) {
    if (!this.enabled || !text) return;
    if (this.soundMode !== 'voice_and_sfx') return;

    if (typeof gameSound !== 'undefined' && typeof gameSound.speakCompanion === 'function') {
      gameSound.speakCompanion(text, options);
      return;
    }

    if (!this.available) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = options.rate ?? 0.85;
      utter.pitch = options.pitch ?? 1.1;
      utter.volume = options.volume ?? 1;
      window.speechSynthesis.speak(utter);
    } catch {
      /* Speech unavailable */
    }
  }

  speakLetter(letterEntry) {
    if (!letterEntry) return;
    this.speak(`${letterEntry.letter}. ${letterEntry.word}.`);
  }

  cancel() {
    if (typeof gameSound !== 'undefined' && typeof gameSound.stopSpeech === 'function') {
      gameSound.stopSpeech();
    }
    if (this.available) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    }
  }

  cleanup() {
    if (this._unsubscribeSound) {
      this._unsubscribeSound();
      this._unsubscribeSound = null;
    }
    this.cancel();
  }
}

export const speechService = new SpeechService();
export default speechService;
