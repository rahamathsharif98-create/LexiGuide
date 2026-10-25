/**
 * letterDetectiveAudio.js
 *
 * Speech synthesis audio service for Letter Detective.
 *
 * Key features & child-friendly phonics design:
 * 1. Phonics Anchoring Strategy:
 *    Standard browser SpeechSynthesisUtterance pronounces isolated letters (like "b")
 *    by their letter-names ("bee"), which confuses early readers searching for phonemes (/b/).
 *    This service pairs each target sound with a phonemic anchor exemplar
 *    (e.g., "The sound is buh, as in ball" or "The sound is shhh, as in ship")
 *    ensuring the browser synthesizes clear, unambiguous phonological cues.
 * 2. Word Articulation:
 *    Candidate words are synthesized at a child-friendly, paced speaking rate (0.85)
 *    so beginning readers can clearly hear word boundaries and component sounds.
 * 3. Strictly User-Controlled:
 *    Zero automatic audio on mount or question advance.
 * 4. Resilient Lifecycle & Cleanup:
 *    Cancels pending speech on round transitions or unmount.
 *    Retains active utterance references to prevent Chromium garbage collection clipping.
 *    Non-blocking: failures do not lock answer choices or freeze UI.
 */

import { audioAtmosphere } from '../../../services/audioAtmosphereService';

export const LETTER_DETECTIVE_PHONEME_MAP = {
  // Stage 1: Beginning Consonants
  b: { soundLabel: '/b/', anchorWord: 'ball', spokenPrompt: 'The sound is buh, as in ball' },
  m: { soundLabel: '/m/', anchorWord: 'moon', spokenPrompt: 'The sound is mmm, as in moon' },
  s: { soundLabel: '/s/', anchorWord: 'sun', spokenPrompt: 'The sound is sss, as in sun' },
  t: { soundLabel: '/t/', anchorWord: 'tree', spokenPrompt: 'The sound is tuh, as in tree' },
  p: { soundLabel: '/p/', anchorWord: 'pen', spokenPrompt: 'The sound is puh, as in pen' },
  d: { soundLabel: '/d/', anchorWord: 'drum', spokenPrompt: 'The sound is duh, as in drum' },
  c: { soundLabel: '/k/', anchorWord: 'cat', spokenPrompt: 'The sound is kuh, as in cat' },
  f: { soundLabel: '/f/', anchorWord: 'fish', spokenPrompt: 'The sound is fff, as in fish' },
  r: { soundLabel: '/r/', anchorWord: 'rain', spokenPrompt: 'The sound is rrr, as in rain' },
  l: { soundLabel: '/l/', anchorWord: 'lamp', spokenPrompt: 'The sound is lll, as in lamp' },

  // Stage 2: Digraphs & Blends
  sh: { soundLabel: '/sh/', anchorWord: 'ship', spokenPrompt: 'The sound is shhh, as in ship' },
  ch: { soundLabel: '/ch/', anchorWord: 'chin', spokenPrompt: 'The sound is chuh, as in chin' },
  th: { soundLabel: '/th/', anchorWord: 'thumb', spokenPrompt: 'The sound is th, as in thumb' },
  wh: { soundLabel: '/wh/', anchorWord: 'whale', spokenPrompt: 'The sound is wh, as in whale' },
  ck: { soundLabel: '/k/', anchorWord: 'duck', spokenPrompt: 'The sound is kuh, as in duck' },
  st: { soundLabel: '/st/', anchorWord: 'star', spokenPrompt: 'The sound is st, as in star' },
  bl: { soundLabel: '/bl/', anchorWord: 'blue', spokenPrompt: 'The sound is bl, as in blue' },
  cl: { soundLabel: '/cl/', anchorWord: 'clap', spokenPrompt: 'The sound is cl, as in clap' },
  sp: { soundLabel: '/sp/', anchorWord: 'spoon', spokenPrompt: 'The sound is sp, as in spoon' },
  gr: { soundLabel: '/gr/', anchorWord: 'green', spokenPrompt: 'The sound is gr, as in green' },

  // Stage 3: Vowel Teams
  ee: { soundLabel: '/ee/', anchorWord: 'tree', spokenPrompt: 'The sound is ee, as in tree' },
  ea: { soundLabel: '/ee/', anchorWord: 'leaf', spokenPrompt: 'The sound is ee, as in leaf' },
  ai: { soundLabel: '/ay/', anchorWord: 'rain', spokenPrompt: 'The sound is ay, as in rain' },
  oa: { soundLabel: '/oh/', anchorWord: 'boat', spokenPrompt: 'The sound is oh, as in boat' },
  oo: { soundLabel: '/oo/', anchorWord: 'moon', spokenPrompt: 'The sound is ooh, as in moon' },
  ay: { soundLabel: '/ay/', anchorWord: 'play', spokenPrompt: 'The sound is ay, as in play' },
  ar: { soundLabel: '/ar/', anchorWord: 'star', spokenPrompt: 'The sound is ar, as in star' },
  or: { soundLabel: '/or/', anchorWord: 'fork', spokenPrompt: 'The sound is or, as in fork' },
  ow: { soundLabel: '/oh/', anchorWord: 'snow', spokenPrompt: 'The sound is oh, as in snow' },
  igh: { soundLabel: '/eye/', anchorWord: 'light', spokenPrompt: 'The sound is eye, as in light' },
};

/**
 * Returns phonetic sound info and spoken text for a given target phoneme or pattern.
 */
export function getPhonemeSoundInfo(target) {
  if (!target) return null;
  const key = String(target).toLowerCase().trim();
  return (
    LETTER_DETECTIVE_PHONEME_MAP[key] || {
      soundLabel: `/${key}/`,
      anchorWord: key,
      spokenPrompt: `The sound is /${key}/`,
    }
  );
}

class LetterDetectiveAudioService {
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
        /* ignore cancel error */
      }
    }
    try {
      audioAtmosphere?.restoreMusic?.();
    } catch {
      /* ignore audioAtmosphere error */
    }
  }

  speak({ text, rate = 0.88, pitch = 1.05, onStart, onEnd, onError }) {
    if (!this.isSupported()) {
      const err = new Error('Speech synthesis is not supported on this browser.');
      onError?.(err);
      return false;
    }

    // Stop existing speech before queuing new utterance
    this.stopSpeech();

    const token = ++this.currentPlayToken;
    this.isPlaying = true;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;

      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = 'en-US';

      // Pick an English voice if available
      try {
        const voices = window.speechSynthesis.getVoices?.() || [];
        const enVoice = voices.find(
          (v) => v.lang && v.lang.startsWith('en') && !v.name.toLowerCase().includes('bad')
        );
        if (enVoice) {
          utterance.voice = enVoice;
        }
      } catch {
        /* ignore voice lookup error */
      }

      utterance.onstart = () => {
        if (this.currentPlayToken !== token) return;
        try {
          audioAtmosphere?.duckMusic?.(0.2);
        } catch {}
        onStart?.();
      };

      utterance.onend = () => {
        if (this.currentPlayToken !== token) return;
        this.isPlaying = false;
        this.activeUtterance = null;
        try {
          audioAtmosphere?.restoreMusic?.();
        } catch {}
        onEnd?.();
      };

      utterance.onerror = (event) => {
        if (this.currentPlayToken !== token) return;
        this.isPlaying = false;
        this.activeUtterance = null;
        try {
          audioAtmosphere?.restoreMusic?.();
        } catch {}
        // Browser interruptions/cancelations are intentional when user switches sounds
        if (event?.error === 'interrupted' || event?.error === 'canceled') {
          onEnd?.();
        } else {
          onError?.(
            event?.error
              ? new Error(`Speech synthesis error: ${event.error}`)
              : new Error('Speech synthesis failed')
          );
        }
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      this.isPlaying = false;
      this.activeUtterance = null;
      try {
        audioAtmosphere?.restoreMusic?.();
      } catch {}
      onError?.(err);
      return false;
    }
  }

  speakTargetSound(round, callbacks = {}) {
    if (!round) return false;
    const target = round.target || round.targetSound;
    const info = getPhonemeSoundInfo(target);
    const spokenText = info?.spokenPrompt || `The sound is /${target}/`;
    return this.speak({
      text: spokenText,
      rate: 0.88,
      pitch: 1.05,
      ...callbacks,
    });
  }

  speakWord(word, callbacks = {}) {
    if (!word) return false;
    return this.speak({
      text: String(word),
      rate: 0.85,
      pitch: 1.0,
      ...callbacks,
    });
  }
}

const letterDetectiveAudio = new LetterDetectiveAudioService();
export default letterDetectiveAudio;
