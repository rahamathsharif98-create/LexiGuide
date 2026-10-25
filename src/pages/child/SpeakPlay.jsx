import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { RecordingButton } from '../../components/RecordingButton'
import { AudioPlayer } from '../../components/AudioPlayer'
import { Card, Button, Skeleton } from '../../components/ui'
import { endpoints } from '../../services/api'
import { analyzeSpeech } from '../../services/mockAiService'
import { resolveThemePackage } from '../../services/personalizationService'
import { audioAtmosphere } from '../../services/audioAtmosphereService'
import VoiceModeIndicator from '../../components/VoiceModeIndicator'
import { isMediaRecorderSupported } from '../../utils/audioRecorder'
import { RotateCcw, Mic, ShieldCheck, ChevronLeft } from 'lucide-react'
import {
  SPEAK_SHINE_CURRICULUM,
  TOTAL_SPEAK_SHINE_LEVELS,
} from '../../games/speak-shine/engine/speakShineCurriculum'
import {
  loadSpeakShineCheckpointData,
  saveSpeakShineCheckpoint,
} from '../../games/speak-shine/engine/speakShineCheckpoint'

// ── Safe context accessor ────────────────────────────────────────────────────
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

// ── Derive scaled XP/stars from average accuracy ────────────────────────────
function outcomeForAccuracy(avgAccuracy) {
  if (avgAccuracy >= 85) return { xpGain: 30, starsGain: 6 }
  if (avgAccuracy >= 60) return { xpGain: 22, starsGain: 4 }
  return { xpGain: 12, starsGain: 2 }
}

// ── Star display helper ──────────────────────────────────────────────────────
function starsFor(accuracy) {
  const count = accuracy >= 85 ? 3 : accuracy >= 60 ? 2 : 1
  return [1, 2, 3].map((n) => n <= count)
}

// ────────────────────────────────────────────────────────────────────────────
export default function SpeakPlay() {
  const {
    applySessionOutcome,
    saveLearningSession,
    isRealBackend,
    language,
    activeChild,
    fetchMultimodalPresentation,
  } = useSafeApp()
  const navigate = useNavigate()

  // ── MediaRecorder preflight ──────────────────────────────────────────────
  const [micSupported] = useState(() => isMediaRecorderSupported())

  // ── Checkpoint: restore saved progress on mount ──────────────────────────
  const checkpointLoaded = useRef(false)
  const initialCheckpoint = useRef(
    loadSpeakShineCheckpointData(activeChild?.id, TOTAL_SPEAK_SHINE_LEVELS)
  )

  const [wordIdx, setWordIdx] = useState(() => {
    const cp = initialCheckpoint.current
    if (cp.isCompleted) return 0
    return Math.min(cp.wordIndex, TOTAL_SPEAK_SHINE_LEVELS - 1)
  })

  // phase: 'idle' | 'recording' | 'analyzing' | 'done'
  const [phase, setPhase] = useState('idle')
  const [metrics, setMetrics] = useState(null)
  const [roundResults, setRoundResults] = useState([])
  const [saveError, setSaveError] = useState(null)
  const [speechError, setSpeechError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [presentation, setPresentation] = useState(null)

  // Prevent double-submission on Next/Finish
  const isAdvancingRef = useRef(false)
  // Prevent duplicate finish saves
  const isSavedRef = useRef(false)

  // ── Re-read checkpoint when the active child profile changes ─────────────
  useEffect(() => {
    if (checkpointLoaded.current) {
      const cp = loadSpeakShineCheckpointData(activeChild?.id, TOTAL_SPEAK_SHINE_LEVELS)
      setWordIdx(cp.isCompleted ? 0 : Math.min(cp.wordIndex, TOTAL_SPEAK_SHINE_LEVELS - 1))
      setPhase('idle')
      setMetrics(null)
      setRoundResults([])
      isAdvancingRef.current = false
      isSavedRef.current = false
    }
    checkpointLoaded.current = true
  }, [activeChild?.id])

  // ── Theme ────────────────────────────────────────────────────────────────
  const theme = resolveThemePackage(activeChild?.interests)

  // ── Quiet Mode ───────────────────────────────────────────────────────────
  const quietMode = Boolean(activeChild?.comfort_preferences?.quiet_mode)
  useEffect(() => {
    if (quietMode) audioAtmosphere?.setQuietMode?.(true)
    return () => { if (quietMode) audioAtmosphere?.setQuietMode?.(false) }
  }, [quietMode])

  // ── Multimodal presentation ──────────────────────────────────────────────
  useEffect(() => {
    let active = true
    if (fetchMultimodalPresentation) {
      fetchMultimodalPresentation('speak-play').then((res) => {
        if (active && res) setPresentation(res)
      })
    }
    return () => { active = false }
  }, [fetchMultimodalPresentation])

  // ── Clean up any pending audio synthesis on unmount ──────────────────────
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // ── Derived values ───────────────────────────────────────────────────────
  const current = SPEAK_SHINE_CURRICULUM[wordIdx] || SPEAK_SHINE_CURRICULUM[0]
  const isLastWord = wordIdx === TOTAL_SPEAK_SHINE_LEVELS - 1

  // ── Recording callbacks ──────────────────────────────────────────────────
  const handleRecordingStart = useCallback(() => {
    setPhase('recording')
    setSpeechError(null)
    setSaveError(null)
  }, [])

  const handleRecordingError = useCallback((err) => {
    setPhase('idle')
    let msg = 'Could not access your microphone. Please try again.'
    if (err?.code === 'permission_denied') {
      msg = 'Microphone permission was denied. Please allow microphone access in your browser settings.'
    } else if (err?.code === 'not_found') {
      msg = 'No microphone was found on this device.'
    } else if (err?.code === 'recording_failed') {
      msg = 'Recording stopped unexpectedly. Please try again.'
    }
    setSpeechError(msg)
  }, [])

  const handleRecordingStop = useCallback(async (seconds, audioResult) => {
    setPhase('analyzing')
    setSaveError(null)
    setSpeechError(null)

    if (isRealBackend) {
      try {
        if (!audioResult?.blob) {
          throw new Error('No audio was captured. Please try speaking into your microphone.')
        }

        const formData = new FormData()
        formData.append('audio', audioResult.blob, audioResult.filename || 'word.webm')
        formData.append('expected_text_hint', current.word)
        if (language) formData.append('language', language)

        const sttResult = await endpoints.transcribeAudio(formData)
        const recognized = (sttResult.transcription || '').trim().toLowerCase()
        const expected = current.word.trim().toLowerCase()

        let accuracy = 60
        let feedback = "Let's try that word once more."
        if (recognized === expected) {
          accuracy = 100
          feedback = 'Perfect! That sounded great! ⭐'
        } else if (recognized && recognized.length > 0) {
          accuracy = 70
          feedback = 'Good try! Keep practising this word. 🌟'
        } else {
          accuracy = 50
          feedback = "Let's try speaking a little louder next time."
        }

        setMetrics({
          accuracy,
          wordsRead: 1,
          errors: recognized === expected ? 0 : 1,
          friendlyFeedback: feedback,
          // Only set transcription when genuine recognition returned text
          transcription: sttResult.transcription && sttResult.transcription.trim()
            ? sttResult.transcription
            : null,
          is_mock: !!sttResult.is_mock,
          ai_mode: sttResult.ai_mode || (sttResult.is_mock ? 'mock' : 'real'),
          pronunciation_analysis_available: false,
        })
        setPhase('done')
      } catch (err) {
        setPhase('idle')
        setSpeechError(
          err.message || 'Could not process your speech. Please check your microphone and try again.'
        )
      }
    } else {
      // ── Demo / Practice mode ─────────────────────────────────────────────
      // Real speech recognition is not available in this mode.
      // We do NOT claim the child said the target word.
      // We use a fixed deterministic accuracy (75) so feedback is stable and
      // encouraging without being random or misleading.
      try {
        await analyzeSpeech({ passageWords: [current.word] }) // side-effects only; result not used
        setMetrics({
          accuracy: 75,
          wordsRead: 1,
          errors: 0,
          friendlyFeedback: 'Great speaking practice! Keep it up! 🌟',
          transcription: null,   // No fabricated "You said" text
          is_mock: true,
          ai_mode: 'demo',
          pronunciation_analysis_available: false,
        })
        setPhase('done')
      } catch (err) {
        setPhase('idle')
        setSpeechError(err.message || 'Practice session failed. Please try again.')
      }
    }
  }, [isRealBackend, current.word, language])

  // ── Retry ────────────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    setPhase('idle')
    setMetrics(null)
    setSaveError(null)
    setSpeechError(null)
  }, [])

  // ── Finish: save session and navigate ────────────────────────────────────
  const handleFinish = useCallback(async (resultsToSave) => {
    if (saving || isSavedRef.current) return
    const avgAccuracy = Math.round(
      resultsToSave.reduce((a, b) => a + b, 0) / (resultsToSave.length || 1)
    )
    const { xpGain, starsGain } = outcomeForAccuracy(avgAccuracy)
    const outcome = {
      type: 'reading',
      skill: 'pronunciation',
      title: 'Speak & Shine',
      accuracy: avgAccuracy,
      metrics: { accuracy: avgAccuracy, hesitations: 0 },
      xpGain,
      starsGain,
      _savedToBackend: isRealBackend,
    }

    if (isRealBackend) {
      setSaving(true)
      setSaveError(null)
      try {
        await saveLearningSession({ skill: 'pronunciation', outcome, stars: starsGain, xp: xpGain })
        isSavedRef.current = true
        navigate('/child/results')
      } catch (err) {
        // Do NOT navigate on save failure — show the error so the child can retry
        setSaveError(err.message || 'Could not save your speaking adventure. Please try again.')
      } finally {
        setSaving(false)
      }
    } else {
      isSavedRef.current = true
      applySessionOutcome(outcome)
      navigate('/child/results')
    }
  }, [saving, isRealBackend, saveLearningSession, applySessionOutcome, navigate])

  // ── Advance to next word ─────────────────────────────────────────────────
  const nextWord = useCallback(() => {
    if (isAdvancingRef.current) return
    isAdvancingRef.current = true

    const updatedResults = [...roundResults, metrics?.accuracy ?? 75]
    setRoundResults(updatedResults)
    const completedLevel = wordIdx + 1 // 1-based

    if (isLastWord) {
      saveSpeakShineCheckpoint(activeChild?.id, {
        isCompleted: true,
        wordIndex: 0,
        completedLevel,
        score: updatedResults.length,
      })
      handleFinish(updatedResults)
      // Guard released in handleFinish's finally / after navigate
    } else {
      const nextIdx = wordIdx + 1
      saveSpeakShineCheckpoint(activeChild?.id, {
        wordIndex: nextIdx,
        completedLevel,
        highestUnlockedLevel: nextIdx + 1,
        score: updatedResults.length,
      })
      setWordIdx(nextIdx)
      setPhase('idle')
      setMetrics(null)
      setSaveError(null)
      setSpeechError(null)
      // Release guard after state settles
      setTimeout(() => { isAdvancingRef.current = false }, 300)
    }
  }, [
    isAdvancingRef, roundResults, metrics, wordIdx, isLastWord,
    activeChild?.id, handleFinish,
  ])

  // ── Determine recording availability notice ──────────────────────────────
  // Show an honest unsupported notice when MediaRecorder is unavailable.
  // For Indic languages, recording itself still works via MediaRecorder —
  // the limitation is transcription accuracy, not capture.
  const showUnsupportedNotice = !micSupported
  const isIndicLanguage = language === 'te' || language === 'hi'

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto text-center" data-testid="speak-play-container">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/child/games')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-[#D7EEF1] text-[#08233A] font-display font-bold text-xs hover:bg-[#E6F8FA] min-h-[44px] shadow-xs transition-colors"
          aria-label="Back to Games"
        >
          <ChevronLeft size={16} /> Games
        </button>
        <VoiceModeIndicator />
      </div>

      {/* ── Title ────────────────────────────────────────────────────────── */}
      <div className="mb-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#0899AA]">
          {theme.mascot}
        </span>
        <h1 className="font-display font-black text-2xl text-[#08233A]">
          Speak &amp; Shine 🎤
        </h1>
        <p className="text-[#527080] font-medium mb-4">Say this word!</p>
      </div>

      {/* ── Multimodal badges (when backend provides presentation) ─────── */}
      {presentation && presentation.support_level && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1]"
            data-testid="multimodal-mode-badge"
          >
            <Mic size={13} className="text-[#0899AA]" />
            {presentation.recommended_mode || 'SPEAK'}
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F8FA] text-[#08233A] border border-[#D7EEF1]"
            data-testid="multimodal-support-level-badge"
          >
            <ShieldCheck size={13} className="text-[#39B87F]" />
            {(presentation.support_level || 'GUIDED').replace('_', ' ')}
          </span>
        </div>
      )}

      {/* ── Honest notice: microphone/MediaRecorder unsupported ───────── */}
      {showUnsupportedNotice && (
        <div
          className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-semibold max-w-md mx-auto mb-4"
          data-testid="mic-unsupported-notice"
          role="status"
        >
          🎙️ <strong>Speaking practice mode:</strong> Your browser does not support microphone
          recording. You can still listen to each word and practise saying it aloud with{' '}
          {theme.mascot}!
        </div>
      )}

      {/* ── Honest notice: Indic language — transcription limitation ────── */}
      {!showUnsupportedNotice && isIndicLanguage && (
        <div
          className="p-3 bg-[#E6F8FA] rounded-2xl border border-[#D7EEF1] text-[#08233A] text-xs font-semibold max-w-md mx-auto mb-4"
          data-testid="voice-honest-status"
          role="status"
        >
          🎙️ <strong>Speaking practice mode:</strong> Your microphone will record your voice, but
          automatic word recognition may not be available for this language. Keep practising aloud
          with {theme.mascot}!
        </div>
      )}

      {/* ── 4-Stage voice state indicator ────────────────────────────────── */}
      <div
        className="bg-white border border-[#D7EEF1] rounded-2xl p-2.5 mb-4 shadow-xs"
        aria-label={`Recording stage: ${phase}`}
        role="status"
        aria-live="polite"
      >
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            { key: 'idle',      emoji: '🟢', label: 'READY' },
            { key: 'recording', emoji: '🎙️', label: 'LISTENING' },
            { key: 'analyzing', emoji: '⏳', label: 'PROCESSING' },
            { key: 'done',      emoji: '⭐', label: 'RESULT' },
          ].map(({ key, emoji, label }) => (
            <div
              key={key}
              className={`py-1.5 px-1 rounded-xl text-[11px] font-display font-extrabold flex items-center justify-center gap-1 transition-all ${
                phase === key
                  ? key === 'idle'
                    ? 'bg-[#DDF9FC] text-[#08233A] ring-2 ring-[#13CFE3]'
                    : key === 'recording'
                    ? 'bg-[#13CFE3]/25 text-[#08233A] ring-2 ring-[#13CFE3] animate-pulse'
                    : key === 'analyzing'
                    ? 'bg-[#FFF9E6] text-[#B87D00] ring-2 ring-[#FFC857] animate-pulse'
                    : 'bg-[#39B87F]/20 text-[#08233A] ring-2 ring-[#39B87F]'
                  : 'text-[#527080] bg-[#E6F8FA]/40'
              }`}
              aria-current={phase === key ? 'step' : undefined}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Progress indicator ────────────────────────────────────────────── */}
      <p
        className="text-xs font-bold text-[#527080] mb-2"
        data-testid="speak-progress-indicator"
        aria-label={`Word ${wordIdx + 1} of ${TOTAL_SPEAK_SHINE_LEVELS}`}
      >
        Word {wordIdx + 1} of {TOTAL_SPEAK_SHINE_LEVELS}
      </p>

      {/* ── Word card ─────────────────────────────────────────────────────── */}
      <Card className="my-5 p-6 sm:p-8 rounded-3xl border-2 border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white">
        <div
          className="inline-block p-4 rounded-3xl bg-[#DDF9FC] border border-[#D7EEF1] text-7xl mb-4 animate-float shadow-inner select-none"
          aria-label={`Picture: ${current.word.charAt(0) + current.word.slice(1).toLowerCase()}`}
          role="img"
        >
          {current.emoji}
        </div>
        <p className="text-4xl sm:text-5xl font-display font-black text-[#08233A] mb-2 tracking-wide">
          {current.word}
        </p>
        <p className="text-xs font-bold text-[#527080] mb-4" data-testid="speak-instruction">
          {current.prompt}
        </p>
        {current.phonicsHint && (
          <p className="text-xs text-[#527080] italic mb-4" data-testid="phonics-hint">
            💡 {current.phonicsHint}
          </p>
        )}
        <div className="flex justify-center">
          <AudioPlayer label="🔊 Listen to word" text={current.word} lang={language || 'en'} />
        </div>
      </Card>

      {/* ── Speech / microphone error (single consolidated display) ─────── */}
      {speechError && (
        <Card
          className="my-4 bg-amber-50 border border-amber-200 text-center p-4 rounded-2xl"
          role="alert"
          data-testid="speech-error-card"
        >
          <p className="font-display font-bold text-amber-900 mb-1">Could not hear your voice ⚠️</p>
          <p className="text-xs text-slate-600 mb-3">{speechError}</p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={retry} className="min-h-[44px] rounded-xl">
              Tap to Try Again 🔄
            </Button>
          </div>
        </Card>
      )}

      {/* ── Recording button (hidden only during analyze/done phases, or when mic unsupported) */}
      {(phase === 'idle' || phase === 'recording') && !speechError && (
        <div className="flex justify-center my-6" data-testid="recording-button-container">
          {micSupported ? (
            <RecordingButton
              onStart={handleRecordingStart}
              onStop={handleRecordingStop}
              onError={handleRecordingError}
              size={100}
              idleLabel="🎤 Tap to speak"
            />
          ) : (
            <div className="flex flex-col items-center gap-3" data-testid="mic-unavailable-placeholder">
              <div
                className="w-[100px] h-[100px] rounded-full flex items-center justify-center bg-slate-100 border-4 border-slate-300 text-slate-400"
                aria-label="Microphone unavailable"
              >
                <Mic size={42} />
              </div>
              <p className="text-xs font-bold text-slate-500">Microphone unavailable</p>
              <Button
                onClick={() => handleRecordingStop(0, null)}
                className="min-h-[44px] px-6 rounded-2xl font-display font-bold bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1]"
              >
                Mark as Practised ✔️
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Analyzing skeleton ───────────────────────────────────────────── */}
      {phase === 'analyzing' && (
        <div className="my-6" role="status" aria-live="polite">
          <Skeleton className="h-16 max-w-sm mx-auto mb-3 rounded-2xl" />
          <p className="text-slate-500 font-bold text-sm">
            Listening closely with {theme.mascot}… 🧠
          </p>
        </div>
      )}

      {/* ── Save error (distinct from speech error) ──────────────────────── */}
      {saveError && (
        <Card
          className="my-4 bg-amber-50 border border-amber-200 text-center p-4 rounded-2xl"
          role="alert"
          data-testid="save-error-card"
        >
          <p className="font-display font-bold text-amber-900 mb-1">
            Could not save your speaking progress ⚠️
          </p>
          <p className="text-xs text-slate-600 mb-3">{saveError}</p>
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              disabled={saving}
              onClick={() => {
                isSavedRef.current = false
                handleFinish(roundResults)
              }}
              className="min-h-[44px] rounded-xl"
            >
              {saving ? 'Saving…' : 'Tap to Retry 🔄'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Result card ──────────────────────────────────────────────────── */}
      {phase === 'done' && metrics && (
        <Card className="animate-pop p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white">
          <p className="font-display font-black text-2xl text-[#08233A] mb-2" data-testid="result-heading">
            {metrics.accuracy >= 85
              ? 'Well done! 🌟'
              : metrics.accuracy >= 60
                ? 'Good try! ⭐'
                : 'Keep practising! 💪'}
          </p>

          {/* Real transcription from speech recognition */}
          {metrics.transcription && (
            <div className="bg-[#F2FBFC] border border-[#D7EEF1] rounded-2xl p-4 mb-4 text-center">
              <p className="text-xs text-[#527080] font-black uppercase tracking-wider">You said</p>
              <p className="font-display font-black text-xl text-[#08233A]">
                "{metrics.transcription}"
              </p>
            </div>
          )}

          {/* Practice mode: honest message instead of fabricated transcript */}
          {!metrics.transcription && (
            <div
              className="bg-[#F0FFF4] border border-[#A7F3D0] rounded-2xl p-4 mb-4 text-center"
              data-testid="practice-mode-notice"
            >
              <p className="text-sm text-[#065F46] font-bold">
                🎤 {metrics.ai_mode === 'demo'
                  ? 'Practice mode — keep saying the word aloud!'
                  : 'Your voice was heard — great practice!'}
              </p>
            </div>
          )}

          <p className="text-sm font-bold text-[#527080] mb-2">{metrics.friendlyFeedback}</p>
          <p className="text-[11px] text-[#527080] font-medium mb-6">
            Word recognition check • Acoustic phoneme scoring not available
          </p>

          <div className="flex justify-center gap-1 mb-6 text-3xl" aria-label={`${starsFor(metrics.accuracy).filter(Boolean).length} out of 3 stars`}>
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
              aria-label="Try this word again"
            >
              Try Again
            </Button>
            <Button
              disabled={saving}
              onClick={nextWord}
              className="min-h-[48px] px-7 rounded-2xl font-display font-black border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 shadow-md bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white transition-all cursor-pointer"
              aria-label={isLastWord ? 'Finish' : 'Next'}
            >
              {saving ? 'Saving…' : isLastWord ? 'Finish 🏆' : 'Next'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
