/**
 * gameSoundService.js
 * Centralized Web Audio Synthesizer and Child-Friendly Companion Voice Service.
 * 
 * Features:
 * 1. Web Audio API synthesized playful notes, pops, snaps, and fanfares (no assets needed).
 * 2. Melodic Letter Scale (C5, D5, E5, G5, A5, C6) so spelling words sounds like an uplifting melody.
 * 3. Child-Friendly Companion Voice Filter:
 *    - Filters for sweet, natural online voices (Microsoft Jenny/Aria Natural, Google English, Samantha, Heera/Veena).
 *    - Pacing: 0.86x (unhurried and comforting).
 *    - Pitch: 1.15 (warm, friendly companion timbre).
 *    - Volume: 0.75 (soft, never loud or screechy).
 * 4. 3-State Audio Mode:
 *    - 'voice_and_sfx': Full companion guidance + musical chimes.
 *    - 'sfx_only': 100% pure musical chimes and pops, ZERO speech (ideal if speech is irritating).
 *    - 'muted': Silent.
 */

const STORAGE_KEY = 'lexiguide_game_sound_mode';

class GameSoundService {
  constructor() {
    this.ctx = null;
    this._initAttempted = false;
    this.soundMode = 'voice_and_sfx';
    this.listeners = new Set();
    this.selectedVoice = null;
    this.isVoicesLoaded = false;

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && ['voice_and_sfx', 'sfx_only', 'muted'].includes(saved)) {
          this.soundMode = saved;
        }
      } catch {
        /* storage unavailable */
      }

      // Initialize voice lookup when ready
      if ('speechSynthesis' in window) {
        this._initVoices();
        window.speechSynthesis.onvoiceschanged = () => this._initVoices();
      }
    }
  }

  _initVoices() {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const voices = window.speechSynthesis.getVoices() || [];
      if (voices.length === 0) return;

      // 1. Natural / Online high-fidelity neural voices (Edge / Chrome)
      const naturalVoice = voices.find((v) => {
        const n = (v.name || '').toLowerCase();
        return (
          (n.includes('natural') || n.includes('online') || n.includes('neural')) &&
          (n.includes('aria') || n.includes('jenny') || n.includes('neerja') || n.includes('swara') || n.includes('mohan') || n.includes('guy') || n.includes('english'))
        );
      });

      // 2. Google high-quality web voices (Chrome)
      const googleVoice = voices.find((v) => {
        const n = (v.name || '').toLowerCase();
        return n.includes('google') && (n.includes('us english') || n.includes('uk english female') || n.includes('india') || (v.lang && v.lang.startsWith('en')));
      });

      // 3. Indian English voices
      const indianVoice = voices.find((v) => {
        const n = (v.name || '').toLowerCase();
        const l = (v.lang || '').toLowerCase();
        return (
          l.includes('en-in') ||
          n.includes('heera') ||
          n.includes('neerja') ||
          n.includes('veena') ||
          n.includes('ravi') ||
          n.includes('kalyani') ||
          n.includes('prabhat')
        );
      });

      // 4. Smooth English female voices (Mac / Safari / Windows)
      const gentleFemaleVoice = voices.find((v) => {
        const n = (v.name || '').toLowerCase();
        return (
          n.includes('samantha') ||
          n.includes('victoria') ||
          n.includes('karen') ||
          n.includes('ava')
        );
      });

      // 5. Any English voice that is NOT the robotic Zira or David if alternatives exist
      const anyNonRoboticEnglish = voices.find((v) => {
        const n = (v.name || '').toLowerCase();
        const l = (v.lang || '').toLowerCase();
        return l.startsWith('en') && !n.includes('zira') && !n.includes('david');
      });

      const anyEnglish = voices.find((v) => (v.lang || '').toLowerCase().startsWith('en'));

      this.selectedVoice = naturalVoice || googleVoice || indianVoice || gentleFemaleVoice || anyNonRoboticEnglish || anyEnglish || voices[0];
      this.isVoicesLoaded = true;
    } catch {
      /* voice lookup error */
    }
  }

  _ensureContext() {
    if (this.soundMode === 'muted') return false;
    if (this._initAttempted && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }
    this._initAttempted = true;
    try {
      if (typeof window === 'undefined') return false;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      return true;
    } catch {
      return false;
    }
  }

  // --- Sound Mode Management ---
  getSoundMode() {
    return this.soundMode;
  }

  setSoundMode(mode) {
    if (!['voice_and_sfx', 'sfx_only', 'muted'].includes(mode)) return;
    this.soundMode = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* storage unavailable */
    }
    if (mode === 'muted' || mode === 'sfx_only') {
      this.stopSpeech();
    }
    this.listeners.forEach((cb) => cb(mode));
  }

  cycleSoundMode() {
    const cycle = {
      voice_and_sfx: 'sfx_only',
      sfx_only: 'muted',
      muted: 'voice_and_sfx',
    };
    const next = cycle[this.soundMode] || 'voice_and_sfx';
    this.setSoundMode(next);
    if (next !== 'muted') {
      this.playChime(660);
    }
    return next;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // --- Tone Synthesis Primitives ---
  _tone({ freq = 440, duration = 0.18, type = 'sine', gain = 0.12, freqEnd = null, delay = 0 }) {
    if (this.soundMode === 'muted' || !this._ensureContext()) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 10), t0 + duration);
      }

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

      osc.connect(g).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.05);
    } catch {
      /* audio error handled */
    }
  }

  // --- Playful Musical Chimes & Action SFX ---

  playLetterNote(index = 0) {
    if (this.soundMode === 'muted') return;
    const pentatonicScale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5]; // C5, D5, E5, G5, A5, C6, D6, E6
    const f = pentatonicScale[index % pentatonicScale.length];
    
    // Warm kalimba/vibraphone bell sound
    this._tone({ freq: f, duration: 0.28, type: 'sine', gain: 0.14 });
    this._tone({ freq: f * 2, duration: 0.15, type: 'triangle', gain: 0.06 });
  }

  playPop() {
    if (this.soundMode === 'muted') return;
    this._tone({ freq: 850, freqEnd: 220, duration: 0.09, type: 'sine', gain: 0.18 });
  }

  playSnap() {
    if (this.soundMode === 'muted') return;
    this._tone({ freq: 440, freqEnd: 180, duration: 0.08, type: 'triangle', gain: 0.15 });
    this._tone({ freq: 880, duration: 0.12, type: 'sine', gain: 0.08, delay: 0.03 });
  }

  playBrush() {
    if (this.soundMode === 'muted') return;
    this._tone({ freq: 280, freqEnd: 480, duration: 0.14, type: 'triangle', gain: 0.1 });
  }

  playLaserMining() {
    if (this.soundMode === 'muted') return;
    this._tone({ freq: 580, freqEnd: 1160, duration: 0.18, type: 'sine', gain: 0.12 });
    this._tone({ freq: 1160, duration: 0.15, type: 'triangle', gain: 0.08, delay: 0.06 });
  }

  playSparkle() {
    if (this.soundMode === 'muted') return;
    [1046, 1318, 1568, 2093].forEach((f, i) => {
      this._tone({ freq: f, duration: 0.16, type: 'sine', gain: 0.09, delay: i * 0.05 });
    });
  }

  playFanfare() {
    if (this.soundMode === 'muted') return;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C major
    chord.forEach((f, i) => {
      this._tone({ freq: f, duration: 0.45, type: 'sine', gain: 0.12, delay: i * 0.07 });
      this._tone({ freq: f * 1.5, duration: 0.3, type: 'triangle', gain: 0.05, delay: i * 0.07 });
    });
    setTimeout(() => this.playSparkle(), 320);
  }

  playGentleOops() {
    if (this.soundMode === 'muted') return;
    this._tone({ freq: 330, freqEnd: 293, duration: 0.22, type: 'sine', gain: 0.08 });
  }

  playBounce() {
    if (this.soundMode === 'muted') return;
    this._tone({ freq: 280, freqEnd: 640, duration: 0.22, type: 'sine', gain: 0.14 });
  }

  playShutter() {
    if (this.soundMode === 'muted') return;
    this._tone({ freq: 800, freqEnd: 300, duration: 0.06, type: 'triangle', gain: 0.16 });
    this._tone({ freq: 600, duration: 0.08, type: 'sine', gain: 0.12, delay: 0.04 });
  }

  playChime(freq = 660) {
    this._tone({ freq, duration: 0.2, type: 'sine', gain: 0.12 });
  }

  // --- Soothing Companion Voice Speech ---

  stopSpeech() {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      /* handled */
    }
  }

  speakCompanion(text, { rate = 0.85, pitch = 1.0, volume = 0.75, onEnd } = {}) {
    if (!text || this.soundMode !== 'voice_and_sfx') return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      if (!this.selectedVoice || !this.isVoicesLoaded) {
        this._initVoices();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        if (this.selectedVoice.lang) {
          utterance.lang = this.selectedVoice.lang;
        }
      }

      // Check if the current fallback is an older robotic Windows SAPI desktop voice
      const voiceName = (this.selectedVoice?.name || '').toLowerCase();
      const isRoboticSapi = voiceName.includes('zira') || voiceName.includes('david');

      // For robotic SAPI voices, avoid artificial high pitch (+15%) which causes harsh screeching
      utterance.rate = isRoboticSapi ? 0.82 : rate;
      utterance.pitch = isRoboticSapi ? 0.98 : pitch;
      utterance.volume = isRoboticSapi ? 0.70 : volume;

      // Retain references to prevent Chromium V8 garbage collection dropping the utterance
      this._activeUtterance = utterance;
      if (typeof window !== 'undefined') {
        window._gameSpeechUtterance = utterance;
      }

      utterance.onend = () => {
        this._activeUtterance = null;
        if (typeof window !== 'undefined') {
          window._gameSpeechUtterance = null;
        }
        onEnd?.();
      };

      utterance.onerror = () => {
        this._activeUtterance = null;
        if (typeof window !== 'undefined') {
          window._gameSpeechUtterance = null;
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      /* speech error handled */
    }
  }
}

export const gameSound = new GameSoundService();
