/**
 * pictureMatchAudio.js
 *
 * Speech synthesis audio service for Picture Match:
 * - Strictly user-controlled: NO automatic speech playback on mount or round advance.
 * - Word pronunciation: Synthesizes the target word at a child-friendly, paced rate (0.85).
 * - Phonics hint narration: Reads the educational phonics clue from the curriculum (0.88).
 * - Resilient lifecycle:
 *     - Stops pending speech on unmount, child switch, or round advance.
 *     - Guards against Chromium garbage collection clipping by holding active utterance reference.
 *     - Token tracking prevents race conditions and out-of-order callbacks.
 *     - Gracefully degrades when SpeechSynthesis is unsupported or throws an error.
 */

import { audioAtmosphere } from '../../../services/audioAtmosphereService';

class PictureMatchAudioService {
  constructor() {
    this.activeUtterance = null;
    this.isPlaying = false;
    this.currentPlayToken = 0;
  }

  isSupported() {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined'
    );
  }

  stopSpeech() {
    this.currentPlayToken += 1;
    this.isPlaying = false;
    this.activeUtterance = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore cancel errors */
      }
    }
    try {
      audioAtmosphere?.restoreMusic?.();
    } catch {
      /* ignore audioAtmosphere errors */
    }
  }

  speak({ text, rate = 0.88, pitch = 1.05, onStart, onEnd, onError }) {
    if (!this.isSupported()) {
      const err = new Error('Speech synthesis is not supported on this browser.');
      onError?.(err);
      return false;
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return false;
    }

    try {
      this.stopSpeech();

      const thisToken = this.currentPlayToken;
      const utterance = new window.SpeechSynthesisUtterance(text.trim());
      utterance.rate = Math.max(0.5, Math.min(rate, 1.5));
      utterance.pitch = Math.max(0.5, Math.min(pitch, 1.5));
      utterance.lang = 'en-US';

      // Pick child-friendly voice if available
      try {
        const voices = window.speechSynthesis.getVoices?.() || [];
        const preferredVoice = voices.find(
          (v) =>
            v.lang?.startsWith('en') &&
            (v.name?.toLowerCase().includes('natural') ||
              v.name?.toLowerCase().includes('child') ||
              v.name?.toLowerCase().includes('kid') ||
              v.name?.toLowerCase().includes('samantha'))
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      } catch {
        /* ignore voice lookup failure */
      }

      utterance.onstart = () => {
        if (this.currentPlayToken !== thisToken) return;
        this.isPlaying = true;
        try {
          audioAtmosphere?.duckMusic?.();
        } catch {
          /* ignore */
        }
        onStart?.();
      };

      utterance.onend = () => {
        if (this.currentPlayToken !== thisToken) return;
        this.isPlaying = false;
        this.activeUtterance = null;
        try {
          audioAtmosphere?.restoreMusic?.();
        } catch {
          /* ignore */
        }
        onEnd?.();
      };

      utterance.onerror = (evt) => {
        if (this.currentPlayToken !== thisToken) return;
        this.isPlaying = false;
        this.activeUtterance = null;
        try {
          audioAtmosphere?.restoreMusic?.();
        } catch {
          /* ignore */
        }
        // Chromium reports 'canceled' or 'interrupted' when stopSpeech() is called
        if (evt?.error === 'canceled' || evt?.error === 'interrupted') {
          return;
        }
        const err = new Error(evt?.error || 'Speech synthesis failed');
        onError?.(err);
      };

      this.activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      this.isPlaying = false;
      this.activeUtterance = null;
      onError?.(err);
      return false;
    }
  }

  /**
   * Reads the target word cleanly at an intentional, paced rate.
   */
  speakWord(word, { onStart, onEnd, onError } = {}) {
    if (!word) return false;
    const cleanWord = String(word).trim();
    return this.speak({
      text: cleanWord,
      rate: 0.85,
      pitch: 1.05,
      onStart,
      onEnd,
      onError,
    });
  }

  /**
   * Narrates the curriculum phonics hint.
   */
  speakPhonicsHint(hint, { onStart, onEnd, onError } = {}) {
    if (!hint) return false;
    return this.speak({
      text: String(hint).trim(),
      rate: 0.88,
      pitch: 1.05,
      onStart,
      onEnd,
      onError,
    });
  }
}

export const pictureMatchAudio = new PictureMatchAudioService();
export default pictureMatchAudio;
