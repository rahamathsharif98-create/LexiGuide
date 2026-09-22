import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { SPEAK_WORDS } from '../../data/demoData'
import { RecordingButton } from '../../components/RecordingButton'
import { AudioPlayer } from '../../components/AudioPlayer'
import { Card, Button, Skeleton } from '../../components/ui'
import { endpoints } from '../../services/api'
import { analyzeSpeech } from '../../services/mockAiService'
import { resolveThemePackage } from '../../services/personalizationService'
import { audioAtmosphere } from '../../services/audioAtmosphereService'
import VoiceModeIndicator from '../../components/VoiceModeIndicator'
import { RotateCcw, Mic, ShieldCheck, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'

function useSafeApp() {
  try {
    return useApp()
  } catch {
    return {
      applySessionOutcome: () => {},
      saveLearningSession: async () => {},
      isRealBackend: false,
      language: 'en',
      activeChild: null,
      fetchMultimodalPresentation: null,
    }
  }
}

export default function SpeakPlay() {
  const [wordIdx, setWordIdx] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | recording | analyzing | done
  const [metrics, setMetrics] = useState(null)
  const [roundResults, setRoundResults] = useState([])
  const [saveError, setSaveError] = useState(null)
  const [speechError, setSpeechError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [presentation, setPresentation] = useState(null)
  const { applySessionOutcome, saveLearningSession, isRealBackend, language, activeChild, fetchMultimodalPresentation } = useSafeApp()
  const navigate = useNavigate()

  // Resolve Theme Package (Cosmetics ONLY - Never pedagogy)
  const theme = resolveThemePackage(activeChild?.interests)

  // Comfort Preferences: Quiet Mode
  const quietMode = Boolean(activeChild?.comfort_preferences?.quiet_mode)
  useEffect(() => {
    if (quietMode) {
      audioAtmosphere?.setQuietMode?.(true)
    }
    return () => {
      if (quietMode) audioAtmosphere?.setQuietMode?.(false)
    }
  }, [quietMode])

  useEffect(() => {
    let active = true
    if (fetchMultimodalPresentation) {
      fetchMultimodalPresentation('speak-play').then((res) => {
        if (active && res) setPresentation(res)
      })
    }
    return () => { active = false }
  }, [fetchMultimodalPresentation])

  const current = SPEAK_WORDS[wordIdx]
  const isLastWord = wordIdx === SPEAK_WORDS.length - 1

  const stop = async (seconds, audioResult) => {
    setPhase('analyzing')
    setSaveError(null)
    setSpeechError(null)

    if (isRealBackend) {
      try {
        if (!audioResult?.blob) {
          throw new Error('No audio was recorded. Please try speaking into your microphone.')
        }

        const formData = new FormData()
        formData.append('audio', audioResult.blob, audioResult.filename || 'word.webm')
        formData.append('expected_text_hint', current.word)
        if (language) {
          formData.append('language', language)
        }

        const sttResult = await endpoints.transcribeAudio(formData)
        const recognized = (sttResult.transcription || '').trim().toLowerCase()
        const expected = current.word.trim().toLowerCase()

        let accuracy = 60
        let feedback = "Let's try that word once more."
        if (recognized === expected) {
          accuracy = 100
          feedback = 'Great speaking! ⭐'
        } else if (!recognized) {
          accuracy = 50
          feedback = "Let's try speaking a little louder."
        }

        const m = {
          accuracy,
          wordsRead: 1,
          errors: recognized === expected ? 0 : 1,
          friendlyFeedback: feedback,
          transcription: sttResult.transcription || current.word,
          is_mock: !!sttResult.is_mock,
          ai_mode: sttResult.ai_mode || (sttResult.is_mock ? 'mock' : 'real'),
          pronunciation_analysis_available: false,
        }

        setMetrics(m)
        setPhase('done')
      } catch (err) {
        setPhase('idle')
        setSpeechError(err.message || 'Could not process your speech. Please check your microphone and try again.')
      }
    } else {
      // Demo / Mock path
      try {
        const { metrics: m } = await analyzeSpeech({ passageWords: [current.word] })
        m.transcription = current.word
        m.ai_mode = 'mock'
        m.pronunciation_analysis_available = false
        setMetrics(m)
        setPhase('done')
      } catch (err) {
        setPhase('idle')
        setSpeechError(err.message || 'Speech simulation failed.')
      }
    }
  }

  const retry = () => {
    setPhase('idle')
    setMetrics(null)
    setSaveError(null)
    setSpeechError(null)
  }

  const handleFinish = async (resultsToSave) => {
    if (saving) return
    const avgAccuracy = Math.round(resultsToSave.reduce((a, b) => a + b, 0) / (resultsToSave.length || 1))
    const outcome = {
      type: 'reading',
      skill: 'pronunciation',
      title: 'Speak & Shine',
      accuracy: avgAccuracy,
      metrics: { accuracy: avgAccuracy, hesitations: 0 },
      xpGain: 22,
      starsGain: 5,
      _savedToBackend: isRealBackend,
    }
    if (isRealBackend) {
      setSaving(true)
      setSaveError(null)
      try {
        await saveLearningSession({
          skill: 'pronunciation',
          outcome,
          stars: 5,
          xp: 22,
        })
      } catch (err) {
        setSaveError(err.message || 'Could not save your speaking adventure.')
      } finally {
        setSaving(false)
      }
    } else {
      applySessionOutcome(outcome)
    }
    navigate('/child/results')
  }

  const nextWord = () => {
    const updatedResults = [...roundResults, metrics?.accuracy ?? 75]
    setRoundResults(updatedResults)

    if (isLastWord) {
      handleFinish(updatedResults)
    } else {
      setWordIdx((i) => i + 1)
      setPhase('idle')
      setMetrics(null)
      setSaveError(null)
      setSpeechError(null)
    }
  }

  const isIndicLanguage = language === 'te' || language === 'hi'

  return (
    <div className="max-w-xl mx-auto text-center" data-testid="speak-play-container">
      {/* Top Bar with Voice Mode Indicator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/child/home')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-[#D7EEF1] text-[#08233A] font-display font-bold text-xs hover:bg-[#E6F8FA] min-h-[40px] shadow-xs transition-colors"
        >
          <ChevronLeft size={16} /> Home
        </button>
        <VoiceModeIndicator />
      </div>

      <div className="mb-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#0899AA]">
          {theme.mascot}
        </span>
        <h1 className="font-display font-black text-2xl text-[#08233A]">
          Speak &amp; Shine 🎤
        </h1>
        <p className="text-[#527080] font-medium mb-4">Say this word!</p>
      </div>

      {presentation && presentation.support_level && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1]" data-testid="multimodal-mode-badge">
            <Mic size={13} className="text-[#0899AA]" /> {presentation.recommended_mode || 'SPEAK'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F8FA] text-[#08233A] border border-[#D7EEF1]" data-testid="multimodal-support-level-badge">
            <ShieldCheck size={13} className="text-[#39B87F]" /> {(presentation.support_level || 'GUIDED').replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Honest Status Notice for Indic Languages */}
      {isIndicLanguage && (
        <div className="p-3 bg-[#E6F8FA] rounded-2xl border border-[#D7EEF1] text-[#08233A] text-xs font-semibold max-w-md mx-auto mb-4" data-testid="voice-honest-status">
          🎙️ <strong>Listen & Practice Aloud Mode:</strong> Device speech recognition is not available for this language. Practice speaking aloud with {theme.mascot}!
        </div>
      )}

      {/* 4-Stage Voice State Indicator (Section 19: READY -> LISTENING -> PROCESSING -> RESULT) */}
      <div className="bg-white border border-[#D7EEF1] rounded-2xl p-2.5 mb-4 shadow-xs">
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className={`py-1.5 px-1 rounded-xl text-[11px] font-display font-extrabold flex items-center justify-center gap-1 transition-all ${
            phase === 'idle' ? 'bg-[#DDF9FC] text-[#08233A] ring-2 ring-[#13CFE3]' : 'text-[#527080] bg-[#E6F8FA]/40'
          }`}>
            <span>🟢</span>
            <span>READY</span>
          </div>
          <div className={`py-1.5 px-1 rounded-xl text-[11px] font-display font-extrabold flex items-center justify-center gap-1 transition-all ${
            phase === 'recording' ? 'bg-[#13CFE3]/25 text-[#08233A] ring-2 ring-[#13CFE3] animate-pulse' : 'text-[#527080] bg-[#E6F8FA]/40'
          }`}>
            <span>🎙️</span>
            <span>LISTENING</span>
          </div>
          <div className={`py-1.5 px-1 rounded-xl text-[11px] font-display font-extrabold flex items-center justify-center gap-1 transition-all ${
            phase === 'analyzing' ? 'bg-[#FFF9E6] text-[#B87D00] ring-2 ring-[#FFC857] animate-pulse' : 'text-[#527080] bg-[#E6F8FA]/40'
          }`}>
            <span>⏳</span>
            <span>PROCESSING</span>
          </div>
          <div className={`py-1.5 px-1 rounded-xl text-[11px] font-display font-extrabold flex items-center justify-center gap-1 transition-all ${
            phase === 'done' ? 'bg-[#39B87F]/20 text-[#08233A] ring-2 ring-[#39B87F]' : 'text-[#527080] bg-[#E6F8FA]/40'
          }`}>
            <span>⭐</span>
            <span>RESULT</span>
          </div>
        </div>
      </div>

      <Card className="my-5 p-6 sm:p-8 rounded-3xl border-2 border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white">
        <div className="inline-block p-4 rounded-3xl bg-[#DDF9FC] border border-[#D7EEF1] text-7xl mb-4 animate-float shadow-inner select-none">
          {current.emoji}
        </div>
        <p className="text-4xl sm:text-5xl font-display font-black text-[#08233A] mb-2 tracking-wide">{current.word}</p>
        <p className="text-xs font-bold text-[#527080] mb-6" data-testid="speak-instruction">
          Speak clearly into your microphone 🎤
        </p>
        <div className="flex justify-center">
          <AudioPlayer label="🔊 Listen to word" text={current.word} lang={language || 'en'} />
        </div>
      </Card>

      {speechError && (
        <Card className="my-4 bg-amber-50 border border-amber-200 text-center p-4 rounded-2xl">
          <p className="font-display font-bold text-amber-900 mb-1">Could not hear your voice ⚠️</p>
          <p className="text-xs text-slate-600 mb-3">{speechError}</p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={retry} className="min-h-[44px] rounded-xl">Tap to Try Again 🔄</Button>
          </div>
        </Card>
      )}

      {phase === 'idle' && !speechError && (
        <div className="flex justify-center my-6">
          <RecordingButton onStop={stop} size={100} idleLabel="🎤 Tap to speak" />
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="my-6">
          <Skeleton className="h-16 max-w-sm mx-auto mb-3 rounded-2xl" />
          <p className="text-slate-500 font-bold text-sm">Listening closely with {theme.mascot}… 🧠</p>
        </div>
      )}

      {saveError && (
        <Card className="my-4 bg-amber-50 border border-amber-200 text-center p-4 rounded-2xl">
          <p className="font-display font-bold text-amber-900 mb-1">Could not save your speaking progress ⚠️</p>
          <p className="text-xs text-slate-600 mb-3">{saveError}</p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={() => handleFinish(roundResults)} className="min-h-[44px] rounded-xl">Tap to Retry 🔄</Button>
          </div>
        </Card>
      )}

      {phase === 'done' && metrics && (
        <Card className="animate-pop p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white">
          <p className="font-display font-black text-2xl text-[#08233A] mb-2">Nice try! ⭐</p>

          {metrics.transcription && (
            <div className="bg-[#F2FBFC] border border-[#D7EEF1] rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-[#527080] font-black uppercase tracking-wider">You said</p>
              <p className="font-display font-black text-xl text-[#08233A]">"{metrics.transcription}"</p>
            </div>
          )}

          <p className="text-sm font-bold text-[#527080] mb-2">{metrics.friendlyFeedback}</p>
          <p className="text-[11px] text-[#527080] font-medium mb-6">
            Word recognition check • Acoustic phoneme scoring not available
          </p>

          <div className="flex justify-center gap-1 mb-6 text-3xl">
            {starsFor(metrics.accuracy).map((filled, i) => (
              <span key={i} className={filled ? 'text-[#FFC857]' : 'text-slate-300'}>
                {filled ? '⭐' : '☆'}
              </span>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              icon={<RotateCcw size={16} />}
              onClick={retry}
              className="min-h-[48px] px-5 rounded-2xl border-2 border-[#D7EEF1] bg-white text-[#08233A] hover:bg-[#F2FBFC]"
            >
              Try Again
            </Button>
            <Button
              disabled={saving}
              onClick={nextWord}
              className="min-h-[48px] px-7 rounded-2xl font-display font-black border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 shadow-md bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white transition-all cursor-pointer"
            >
              {saving ? 'Saving…' : isLastWord ? 'Finish' : 'Next'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

function starsFor(accuracy) {
  const count = accuracy >= 85 ? 3 : accuracy >= 60 ? 2 : 1
  return [1, 2, 3].map((n) => n <= count)
}
