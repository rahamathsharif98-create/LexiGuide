import { audioAtmosphere } from './audioAtmosphereService'
import {
  LEXI_VOICE_SETTINGS,
  LEXI_PHRASE_LIBRARY,
  findLexiCompanionVoice,
  getLexiCompanionReport,
} from './lexiVoiceConfig'

export { LEXI_VOICE_SETTINGS, LEXI_PHRASE_LIBRARY, getLexiCompanionReport }

/**
 * Phases 7 & 8: Multilingual Mother-Tongue Voice & Bridge Engine (Telugu + Hindi)
 * 
 * CORE PRINCIPLES:
 * 1. Mother tongue is a learning bridge, not a UI language toggle.
 * 2. Provides language-aware TTS utterance synthesis with dialect-matching.
 * 3. Enforces Mother-Tongue Bridge Curriculum:
 *    [Mother Tongue Audio Instruction] -> [Target English Word] -> [Mother Tongue Support Explanation] -> [Speech Practice]
 * 4. Honest reporting: If matching voice is absent, reports local fallback or unavailable status.
 */

export const MULTILINGUAL_VOICE_CONFIG = {
  te: {
    code: 'te',
    langTag: 'te-IN',
    name: 'Telugu',
    script: 'తెలుగు',
    samplePhonemes: ['క', 'ఖ', 'గ', 'ఘ', 'చ', 'ఛ', 'జ'],
    bridgeTemplates: {
      instruction: (target) => `ఈ పదాన్ని శ్రద్ధగా వినండి మరియు చెప్పండి: "${target}"`,
      explanation: (target, meaning) => `"${target}" అంటే "${meaning}". ఇప్పుడు మీ వంతు!`,
      encouragement: 'చాలా బాగా చెప్పారు! మళ్లీ ప్రయత్నిద్దామా?',
    },
    sampleWords: [
      { letter: 'క', word: 'కమలం', english: 'Lotus', roman: 'kamalam', icon: '🪷' },
      { letter: 'గ', word: 'గంట', english: 'Bell', roman: 'ganta', icon: '🔔' },
      { letter: 'చ', word: 'చందమామ', english: 'Moon', roman: 'chandamama', icon: '🌙' },
      { letter: 'న', word: 'నక్క', english: 'Fox', roman: 'nakka', icon: '🦊' },
    ],
  },
  hi: {
    code: 'hi',
    langTag: 'hi-IN',
    name: 'Hindi',
    script: 'हिन्दी',
    samplePhonemes: ['क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज'],
    bridgeTemplates: {
      instruction: (target) => `इस शब्द को ध्यान से सुनें और बोलें: "${target}"`,
      explanation: (target, meaning) => `"${target}" का अर्थ "${meaning}" है। अब आपकी बारी!`,
      encouragement: 'बहुत बढ़िया! चलिए फिर से कोशिश करते हैं!',
    },
    sampleWords: [
      { letter: 'क', word: 'कमल', english: 'Lotus', roman: 'kamal', icon: '🪷' },
      { letter: 'ग', word: 'गमला', english: 'Flowerpot', roman: 'gamla', icon: '🪴' },
      { letter: 'च', word: 'चाँद', english: 'Moon', roman: 'chaand', icon: '🌙' },
      { letter: 'स', word: 'सेब', english: 'Apple', roman: 'seb', icon: '🍎' },
    ],
  },
  en: {
    code: 'en',
    langTag: 'en-IN',
    name: 'Indian English',
    script: 'English',
    samplePhonemes: ['/k/', '/b/', '/s/', '/t/', '/m/'],
    bridgeTemplates: {
      instruction: (target) => `Listen carefully and say: "${target}"`,
      explanation: (target) => `Let's practice the sound for "${target}"!`,
      encouragement: 'Wonderful effort! Let us try once more!',
    },
    sampleWords: [
      { letter: 'C', word: 'Cat', english: 'Cat', roman: 'cat', icon: '🐱' },
      { letter: 'S', word: 'Sun', english: 'Sun', roman: 'sun', icon: '☀️' },
      { letter: 'B', word: 'Book', english: 'Book', roman: 'book', icon: '📖' },
    ],
  },
}

/**
 * Finds best available voice matching requested language code.
 * Prioritizes natural Indian English (en-IN) voices when available.
 */
export function getLanguageAwareVoice(langCode = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices() || []
  if (voices.length === 0) return null

  // Use centralized Indian companion voice selector
  const companionVoice = findLexiCompanionVoice(voices, langCode)
  if (companionVoice) return companionVoice

  const targetTag = MULTILINGUAL_VOICE_CONFIG[langCode]?.langTag || 'en-IN'

  // Look for exact locale match first
  let match = voices.find((v) => (v.lang || '').replace('_', '-').toLowerCase() === targetTag.toLowerCase())
  // Look for prefix match
  if (!match) {
    match = voices.find((v) => (v.lang || '').toLowerCase().startsWith(langCode.toLowerCase()))
  }
  return match || null
}

/**
 * Returns diagnostic metadata about the current voice configuration
 */
export function getVoiceEngineDetails(langCode = 'en') {
  const voice = getLanguageAwareVoice(langCode)
  return {
    targetLang: langCode === 'en' ? 'en-IN (Indian English)' : langCode,
    activeVoiceName: voice?.name || 'Browser Default / Synthesizer',
    activeVoiceLang: voice?.lang || 'en-IN',
    isIndianEnglish: Boolean(
      voice && (
        (voice.lang || '').toLowerCase().includes('en-in') ||
        (voice.name || '').toLowerCase().includes('india') ||
        (voice.name || '').toLowerCase().includes('heera') ||
        (voice.name || '').toLowerCase().includes('ravi') ||
        (voice.name || '').toLowerCase().includes('neerja') ||
        (voice.name || '').toLowerCase().includes('veena')
      )
    ),
  }
}

/**
 * Returns curated phrase library for a given language code
 */
export function getLexiPhrases(langCode = 'en') {
  return LEXI_PHRASE_LIBRARY[langCode] || LEXI_PHRASE_LIBRARY.en
}

/**
 * Executes language-aware SpeechSynthesis with child-friendly Indian companion speed and pitch.
 * Rate: 0.88x (gentle, unhurried pacing)
 * Pitch: 1.05 (warm, soothing companion pitch)
 */
export function speakLanguageAudio({ text, lang = 'en', rate, pitch, onEnd, onError }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('SpeechSynthesis unavailable'))
    return false
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const voice = getLanguageAwareVoice(lang)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang || 'en-US'
    } else {
      if (lang === 'te') utterance.lang = 'te-IN'
      else if (lang === 'hi') utterance.lang = 'hi-IN'
      else utterance.lang = navigator?.language || 'en-US'
    }

    utterance.rate = typeof rate === 'number' ? rate : LEXI_VOICE_SETTINGS.BASE_RATE
    utterance.pitch = typeof pitch === 'number' ? pitch : LEXI_VOICE_SETTINGS.PITCH

    // Retain global reference to prevent Chromium V8 garbage collection dropping speech
    window._activeMultilingualUtterance = utterance

    audioAtmosphere?.duckMusic?.()
    const origOnEnd = onEnd
    utterance.onend = (e) => {
      window._activeMultilingualUtterance = null
      audioAtmosphere?.restoreMusic?.()
      if (origOnEnd) origOnEnd(e)
    }
    const origOnError = onError
    utterance.onerror = (e) => {
      window._activeMultilingualUtterance = null
      audioAtmosphere?.restoreMusic?.()
      if (origOnError) origOnError(e)
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
      window.speechSynthesis.speak(utterance)
    } catch (err) {
      audioAtmosphere?.restoreMusic?.()
      if (onError) onError(err)
    }

    return true
  } catch (err) {
    audioAtmosphere?.restoreMusic?.()
    if (onError) onError(err)
    return false
  }
}

/**
 * Speaks an array of short phrases sequentially with a deliberate micro-pause between phrases.
 * This delivers the core child-friendly experience:
 * "Listen carefully." -> [pause 320ms] -> "Now, say it with me."
 */
export function speakPacedUtterance({
  phrases = [],
  lang = 'en',
  rate,
  pitch,
  pauseMs = LEXI_VOICE_SETTINGS.MICRO_PAUSE_MS,
  onChunkStart,
  onEnd,
  onError,
}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('SpeechSynthesis unavailable'))
    return () => {}
  }

  const phraseList = Array.isArray(phrases)
    ? phrases.filter(Boolean)
    : (typeof phrases === 'string' ? [phrases] : [])

  if (phraseList.length === 0) {
    onEnd?.()
    return () => {}
  }

  let cancelled = false
  let currentIdx = 0
  let timerId = null

  const cancel = () => {
    cancelled = true
    if (timerId) clearTimeout(timerId)
    try {
      window.speechSynthesis.cancel()
    } catch {}
    audioAtmosphere?.restoreMusic?.()
  }

  const speakNext = () => {
    if (cancelled) return
    if (currentIdx >= phraseList.length) {
      audioAtmosphere?.restoreMusic?.()
      onEnd?.()
      return
    }

    const currentText = phraseList[currentIdx]
    onChunkStart?.(currentIdx, currentText)

    speakLanguageAudio({
      text: currentText,
      lang,
      rate: typeof rate === 'number' ? rate : LEXI_VOICE_SETTINGS.BASE_RATE,
      pitch: typeof pitch === 'number' ? pitch : LEXI_VOICE_SETTINGS.PITCH,
      onEnd: () => {
        if (cancelled) return
        currentIdx++
        if (currentIdx < phraseList.length) {
          timerId = setTimeout(speakNext, pauseMs)
        } else {
          audioAtmosphere?.restoreMusic?.()
          onEnd?.()
        }
      },
      onError: (err) => {
        if (cancelled) return
        audioAtmosphere?.restoreMusic?.()
        onError?.(err)
      },
    })
  }

  speakNext()
  return cancel
}
