/**
 * missingLetterAudio.js
 *
 * Speech synthesis audio service for Missing Letter:
 * - Strictly user-controlled: NO automatic speech playback on mount or question advance.
 * - Word pronunciation: Synthesizes the target word at a child-friendly, paced rate (0.85).
 * - Phonics hint narration: Reads the educational phonics clue from the curriculum (0.88).
 * - Letter phonics anchoring: Pairs individual letter sounds with unambiguous phonetic anchors
 *   (e.g., "The letter is A. The sound is ah, as in cat") so children hear phonemes rather than letter names.
 * - Resilient lifecycle:
 *     - Stops pending speech on unmount, child switch, or round advance.
 *     - Guards against Chromium garbage collection clipping by holding active utterance reference.
 *     - Token tracking prevents race conditions and out-of-order callbacks.
 *     - Gracefully degrades when SpeechSynthesis is unsupported or throws an error.
 */

import { audioAtmosphere } from '../../../services/audioAtmosphereService';

export const MISSING_LETTER_PHONICS_MAP = {
  // Medial Short Vowels (Stage 1)
  A: { letter: 'A', soundLabel: '/a/', anchorWord: 'cat', spokenPrompt: 'The letter is A. The sound is ah, as in cat.' },
  E: { letter: 'E', soundLabel: '/e/', anchorWord: 'bed', spokenPrompt: 'The letter is E. The sound is eh, as in bed.' },
  I: { letter: 'I', soundLabel: '/i/', anchorWord: 'pig', spokenPrompt: 'The letter is I. The sound is ih, as in pig.' },
  O: { letter: 'O', soundLabel: '/o/', anchorWord: 'dog', spokenPrompt: 'The letter is O. The sound is ah, as in dog.' },
  U: { letter: 'U', soundLabel: '/u/', anchorWord: 'sun', spokenPrompt: 'The letter is U. The sound is uh, as in sun.' },

  // Consonants & Word Builders (Stages 2 & 3)
  B: { letter: 'B', soundLabel: '/b/', anchorWord: 'bat', spokenPrompt: 'The letter is B. The sound is buh, as in bat.' },
  C: { letter: 'C', soundLabel: '/k/', anchorWord: 'cup', spokenPrompt: 'The letter is C. The sound is kuh, as in cup.' },
  D: { letter: 'D', soundLabel: '/d/', anchorWord: 'duck', spokenPrompt: 'The letter is D. The sound is duh, as in duck.' },
  F: { letter: 'F', soundLabel: '/f/', anchorWord: 'fan', spokenPrompt: 'The letter is F. The sound is fff, as in fan.' },
  G: { letter: 'G', soundLabel: '/g/', anchorWord: 'frog', spokenPrompt: 'The letter is G. The sound is guh, as in frog.' },
  H: { letter: 'H', soundLabel: '/h/', anchorWord: 'hat', spokenPrompt: 'The letter is H. The sound is hhh, as in hat.' },
  J: { letter: 'J', soundLabel: '/j/', anchorWord: 'jam', spokenPrompt: 'The letter is J. The sound is juh, as in jam.' },
  K: { letter: 'K', soundLabel: '/k/', anchorWord: 'duck', spokenPrompt: 'The letter is K. The sound is kuh, as in duck.' },
  L: { letter: 'L', soundLabel: '/l/', anchorWord: 'lip', spokenPrompt: 'The letter is L. The sound is lll, as in lip.' },
  M: { letter: 'M', soundLabel: '/m/', anchorWord: 'mop', spokenPrompt: 'The letter is M. The sound is mmm, as in mop.' },
  N: { letter: 'N', soundLabel: '/n/', anchorWord: 'net', spokenPrompt: 'The letter is N. The sound is nnn, as in net.' },
  P: { letter: 'P', soundLabel: '/p/', anchorWord: 'pen', spokenPrompt: 'The letter is P. The sound is puh, as in pen.' },
  R: { letter: 'R', soundLabel: '/r/', anchorWord: 'run', spokenPrompt: 'The letter is R. The sound is rrr, as in run.' },
  S: { letter: 'S', soundLabel: '/s/', anchorWord: 'sun', spokenPrompt: 'The letter is S. The sound is sss, as in sun.' },
  T: { letter: 'T', soundLabel: '/t/', anchorWord: 'tub', spokenPrompt: 'The letter is T. The sound is tuh, as in tub.' },
  W: { letter: 'W', soundLabel: '/w/', anchorWord: 'wig', spokenPrompt: 'The letter is W. The sound is wuh, as in wig.' },
};

/**
 * Returns phonetic sound info for a given letter.
 */
export function getMissingLetterSoundInfo(letter, contextWord = '') {
  if (!letter) return null;
  const key = String(letter).toUpperCase().trim();
  if (MISSING_LETTER_PHONICS_MAP[key]) {
    return MISSING_LETTER_PHONICS_MAP[key];
  }
  const fallbackWord = contextWord ? `as in ${contextWord}` : '';
  return {
    letter: key,
    soundLabel: `/${key.toLowerCase()}/`,
    anchorWord: contextWord || key,
    spokenPrompt: `The letter is ${key}. ${fallbackWord}`.trim(),
  };
}

class MissingLetterAudioService {
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
          (v) => v.lang && v.lang.startsWith('en') && !v.name?.toLowerCase().includes('bad')
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

  speakWord(word, callbacks = {}) {
    if (!word) return false;
    const cleanWord = String(word).trim();
    return this.speak({
      text: cleanWord,
      rate: 0.85,
      pitch: 1.0,
      ...callbacks,
    });
  }

  speakPhonicsHint(round, callbacks = {}) {
    if (!round) return false;
    const spokenText = round.hint || `Look at the picture and listen for the missing letter in ${round.fullWord || 'the word'}.`;
    return this.speak({
      text: spokenText,
      rate: 0.88,
      pitch: 1.05,
      ...callbacks,
    });
  }

  speakLetterSound(letter, contextWord = '', callbacks = {}) {
    if (!letter) return false;
    const info = getMissingLetterSoundInfo(letter, contextWord);
    const spokenText = info?.spokenPrompt || `The letter is ${letter}`;
    return this.speak({
      text: spokenText,
      rate: 0.86,
      pitch: 1.05,
      ...callbacks,
    });
  }
}

const missingLetterAudio = new MissingLetterAudioService();
export default missingLetterAudio;
