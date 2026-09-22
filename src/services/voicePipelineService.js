import { audioAtmosphere } from './audioAtmosphereService'

/**
 * Phase 6/11: Multilingual Voice Pipeline Service (Telugu, Hindi, English)
 * 
 * CORE PRINCIPLES:
 * 1. Honest reporting: Discloses whether synthesis uses local browser Web Speech voices
 *    or backend neural pipelines. Never fabricates AI capability.
 * 2. Telugu and Hindi as first-class languages, not mere afterthought translations.
 * 3. Audio Atmosphere ducking: Background music automatically ducks during speech.
 * 4. Lenient child pronunciation scoring with encouraging feedback.
 */

export const SUPPORTED_LANGUAGES = {
  te: { code: 'te', locale: 'te-IN', label: 'తెలుగు', name: 'Telugu' },
  hi: { code: 'hi', locale: 'hi-IN', label: 'हिन्दी', name: 'Hindi' },
  en: { code: 'en', locale: 'en-IN', label: 'English (India)', name: 'Indian English' },
}

export function getVoicePipelineCapabilities() {
  const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window
  const hasSpeechRecognition = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  )
  const hasMic = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  let availableVoices = []
  if (hasSpeechSynthesis) {
    try {
      availableVoices = window.speechSynthesis.getVoices() || []
    } catch {}
  }

  const hasTeluguVoice = availableVoices.some((v) => v.lang && (v.lang.startsWith('te') || v.lang.includes('TEL')))
  const hasHindiVoice = availableVoices.some((v) => v.lang && (v.lang.startsWith('hi') || v.lang.includes('HIN')))
  const hasEnglishVoice = availableVoices.some((v) => v.lang && v.lang.startsWith('en'))

  return {
    pipeline_mode: hasSpeechSynthesis ? 'browser_native' : 'mock',
    tts_available: hasSpeechSynthesis,
    stt_available: hasSpeechRecognition,
    mic_ready: hasMic,
    voice_support: {
      te: hasTeluguVoice,
      hi: hasHindiVoice,
      en: hasEnglishVoice,
    },
    total_voices_detected: availableVoices.length,
    honest_label: hasSpeechSynthesis ? 'Local Device Speech Engine' : 'Voice Synthesis Not Supported',
  }
}

export function findBestVoiceForLanguage(langCode = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null

  const voices = window.speechSynthesis.getVoices() || []
  const targetPrefix = langCode === 'te' ? 'te' : langCode === 'hi' ? 'hi' : 'en'

  // Prefer exact locale match (e.g. te-in, hi-in, en-in)
  let bestVoice = voices.find((v) => v.lang && v.lang.toLowerCase().replace('_', '-') === `${targetPrefix}-in`)
  if (!bestVoice && langCode === 'en') {
    bestVoice = voices.find((v) => {
      const isEn = v.lang && v.lang.toLowerCase().startsWith('en')
      const name = (v.name || '').toLowerCase()
      return isEn && (name.includes('india') || name.includes('heera') || name.includes('ravi') || name.includes('neerja') || name.includes('veena'))
    })
  }
  if (!bestVoice) {
    bestVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(targetPrefix))
  }
  if (!bestVoice && langCode === 'en') {
    bestVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'))
  }
  return bestVoice || null
}

export function speakMultilingual(text, language = 'en', options = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve({ success: false, reason: 'Speech synthesis unavailable' })
  }

  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel()
      audioAtmosphere?.duckMusic?.()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = options.rate || 0.88 // Sweet, gentle child-friendly pacing
      utterance.pitch = options.pitch || 1.05 // Warm companion tone

      const voice = findBestVoiceForLanguage(language)
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      } else {
        utterance.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
      }

      utterance.onend = () => {
        audioAtmosphere?.restoreMusic?.()
        resolve({ success: true, text, language })
      }

      utterance.onerror = (err) => {
        audioAtmosphere?.restoreMusic?.()
        resolve({ success: false, error: err })
      }

      window.speechSynthesis.speak(utterance)
    } catch (err) {
      audioAtmosphere?.restoreMusic?.()
      resolve({ success: false, error: err })
    }
  })
}

function levenshteinDistance(s1 = '', s2 = '') {
  const a = s1.trim().toLowerCase()
  const b = s2.trim().toLowerCase()
  if (a.length < b.length) return levenshteinDistance(b, a)
  if (b.length === 0) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1]
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1
      curr.push(Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost))
    }
    prev = curr
  }
  return prev[b.length]
}

export function evaluatePronunciation(target = '', spoken = '', language = 'te') {
  const cleanTarget = target.trim().toLowerCase()
  const cleanSpoken = spoken.trim().toLowerCase()

  if (!cleanTarget || !cleanSpoken) {
    return {
      accuracyScore: 0,
      isMatch: false,
      feedback: language === 'te' ? 'మాట రికార్డు కాలేదు' : language === 'hi' ? 'आवाज़ रिकॉर्ड नहीं हुई' : 'No speech recorded',
      pipelineMode: 'heuristic_levenshtein',
    }
  }

  if (cleanTarget === cleanSpoken || cleanTarget.includes(cleanSpoken) || cleanSpoken.includes(cleanTarget)) {
    return {
      accuracyScore: 100,
      isMatch: true,
      feedback: language === 'te' ? 'చాలా బాగుంది! 🌟' : language === 'hi' ? 'शाबाश! 🌟' : 'Awesome job! 🌟',
      pipelineMode: 'heuristic_levenshtein',
    }
  }

  const dist = levenshteinDistance(cleanTarget, cleanSpoken)
  const maxLen = Math.max(cleanTarget.length, cleanSpoken.length)
  const accuracy = Math.round(Math.max(0, (1 - dist / maxLen)) * 100)
  const isMatch = accuracy >= 65

  return {
    accuracyScore: accuracy,
    isMatch,
    feedback: isMatch
      ? (language === 'te' ? 'చక్కగా చెప్పారు! 👏' : language === 'hi' ? 'बहुत अच्छा! 👏' : 'Great pronunciation! 👏')
      : (language === 'te' ? 'మళ్ళీ ప్రయత్నించండి! 💪' : language === 'hi' ? 'फिर से कोशिश करें! 💪' : 'Try saying it again! 💪'),
    pipelineMode: 'heuristic_levenshtein',
  }
}
