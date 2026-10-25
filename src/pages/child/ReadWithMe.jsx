import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLink as Link } from '../../components/nav/AppLink'
import { useApp } from '../../context/AppContext'
import { READ_PASSAGES } from '../../data/demoData'
import { RecordingButton } from '../../components/RecordingButton'
import { AudioPlayer } from '../../components/AudioPlayer'
import { WordHighlight } from '../../components/WordHighlight'
import { Card, Button, ProgressBar, Skeleton } from '../../components/ui'
import { analyzeSpeech } from '../../services/mockAiService'
import { generateRecommendations } from '../../services/adaptiveEngine'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { resolveThemePackage } from '../../services/personalizationService'
import { audioAtmosphere } from '../../services/audioAtmosphereService'
import { speakLanguageAudio } from '../../services/multilingualVoiceService'
import VoiceModeIndicator from '../../components/VoiceModeIndicator'
import { ChevronLeft, RotateCcw, Volume2, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react'

function useSafeApp() {
  try {
    return useApp()
  } catch {
    return {
      activeChild: null,
      errorPatterns: [],
      applySessionOutcome: () => {},
      saveReadingSession: async () => {},
      saveReadingSessionAudio: async () => {},
      isRealBackend: false,
      language: 'en',
      nextRecommendedActivity: null,
      fetchMultimodalPresentation: null,
    }
  }
}

export default function ReadWithMe() {
  const [passage, setPassage] = useState(null)
  const [stage, setStage] = useState('select') // select | intro | reading
  const { activeChild, errorPatterns } = useSafeApp()

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

  if (stage === 'select') {
    return <SelectStory onPick={(p) => { setPassage(p); setStage('intro') }} theme={theme} />
  }

  if (stage === 'intro') {
    return <StoryIntro passage={passage} onBack={() => setStage('select')} onStart={() => setStage('reading')} theme={theme} />
  }

  return (
    <ReadingSession
      passage={passage}
      onBack={() => setStage('select')}
      activeChild={activeChild}
      errorPatterns={errorPatterns}
      theme={theme}
    />
  )
}

function SelectStory({ onPick, theme }) {
  return (
    <div className="max-w-2xl mx-auto" data-testid="select-story-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0899AA]">
            {theme.mascot}
          </span>
          <h1 className="font-display font-black text-2xl text-[#08233A]">
            Read With Me 📖
          </h1>
          <p className="text-[#527080] text-sm font-medium">Pick a passage to read out loud together!</p>
        </div>
        <VoiceModeIndicator />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {READ_PASSAGES.map((p) => (
          <button key={p.id} onClick={() => onPick(p)} className="text-left cursor-pointer group">
            <Card hover className="h-full text-center p-5 rounded-3xl border border-[#D7EEF1] group-hover:border-[#13CFE3] shadow-[0_8px_30px_rgba(8,35,58,0.06)] group-hover:shadow-[0_12px_30px_rgba(19,207,227,0.15)] transition-all">
              <div className="text-6xl mb-3 animate-float select-none">{p.cover}</div>
              <p className="font-display font-extrabold text-base text-[#08233A] group-hover:text-[#0899AA] transition-colors">{p.title}</p>
              <p className="text-xs font-bold text-[#0899AA] mt-1 bg-[#DDF9FC] inline-block px-2 py-0.5 rounded-full border border-[#D7EEF1]">{p.difficulty} · {p.duration}</p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}

function StoryIntro({ passage, onBack, onStart, theme }) {
  const { fetchMultimodalPresentation, language } = useSafeApp()
  const [presentation, setPresentation] = useState(null)

  useEffect(() => {
    let active = true
    if (fetchMultimodalPresentation && passage?.id) {
      fetchMultimodalPresentation(passage.id).then((res) => {
        if (active && res) setPresentation(res)
      })
    }
    return () => { active = false }
  }, [fetchMultimodalPresentation, passage?.id])

  return (
    <div className="max-w-xl mx-auto text-center" data-testid="story-intro-container">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[#527080] font-bold text-xs mb-4 hover:text-[#08233A] mx-auto py-2 px-3 rounded-xl hover:bg-[#E6F8FA] min-h-[40px] transition-colors"
      >
        <ChevronLeft size={16} /> Choose another
      </button>

      <Card className="p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white">
        <div className="text-7xl mb-4 select-none">{passage.cover}</div>
        <h1 className="font-display font-black text-2xl text-[#08233A] mb-1">{passage.title}</h1>
        <p className="text-[#527080] font-semibold text-xs mb-3">{passage.difficulty} · {passage.duration}</p>

        {presentation && presentation.support_level && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1]" data-testid="multimodal-mode-badge">
              <Sparkles size={13} className="text-[#0899AA]" /> {presentation.recommended_mode || 'READ_ALONG'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F8FA] text-[#08233A] border border-[#D7EEF1]" data-testid="multimodal-support-level-badge">
              <ShieldCheck size={13} className="text-[#39B87F]" /> {(presentation.support_level || 'GUIDED').replace('_', ' ')}
            </span>
          </div>
        )}

        <p className="text-[#08233A] mb-2 font-bold text-sm">Let's hear it once first with {theme.mascot}!</p>
        <div className="flex justify-center mb-6">
          <AudioPlayer label="Listen to example" text={passage?.words ? passage.words.join(' ') : (passage?.title || '')} lang={language || 'en'} />
        </div>
        <Button
          size="lg"
          onClick={onStart}
          className="min-h-[52px] px-8 rounded-2xl font-display font-black text-base border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 shadow-md bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white transition-all"
        >
          I'm Ready to Read ▶
        </Button>
      </Card>
    </div>
  )
}

function ReadingSession({ passage, onBack, activeChild, errorPatterns, theme }) {
  const [statuses, setStatuses] = useState(passage.words.map(() => 'pending'))
  const [phase, setPhase] = useState('idle') // idle | recording | analyzing | revealing | done
  const [metrics, setMetrics] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [micErrorMsg, setMicErrorMsg] = useState(null)
  const [pendingResults, setPendingResults] = useState(null)
  const [presentation, setPresentation] = useState(null)
  const [currentReadIndex, setCurrentReadIndex] = useState(-1)
  const [isNarrating, setIsNarrating] = useState(false)
  const [isSlowRate, setIsSlowRate] = useState(false)
  const [showReadingGuide, setShowReadingGuide] = useState(false)

  const { applySessionOutcome, saveReadingSession, saveReadingSessionAudio, isRealBackend, language, nextRecommendedActivity, fetchMultimodalPresentation } = useSafeApp()
  const navigate = useNavigate()

  // Comfort Preferences: Typography
  const isDyslexic = Boolean(activeChild?.comfort_preferences?.dyslexia_font)
  const textSize = activeChild?.comfort_preferences?.text_size || 'normal'
  const textSizeClass = textSize === 'xl' ? 'text-3xl' : textSize === 'large' ? 'text-2xl' : 'text-xl'

  useEffect(() => {
    let active = true
    if (fetchMultimodalPresentation && passage?.id) {
      fetchMultimodalPresentation(passage.id).then((res) => {
        if (active && res) setPresentation(res)
      })
    }
    return () => { active = false }
  }, [fetchMultimodalPresentation, passage?.id])

  const {
    duration: recordDuration,
    startRecording: startAudioRecord,
    stopRecording: stopAudioRecord,
    cancelRecording: cancelAudioRecord,
  } = useAudioRecorder()

  // Child-controlled pace narration
  const playWordByWordNarration = () => {
    if (isNarrating) {
      setIsNarrating(false)
      setCurrentReadIndex(-1)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      return
    }

    setIsNarrating(true)
    let idx = 0
    const speakNextWord = () => {
      if (idx >= passage.words.length) {
        setIsNarrating(false)
        setCurrentReadIndex(-1)
        audioAtmosphere?.restoreMusic?.()
        return
      }

      setCurrentReadIndex(idx)
      const currentWord = passage.words[idx]
      speakLanguageAudio({
        text: currentWord,
        lang: language || 'en',
        rate: isSlowRate ? 0.65 : 0.85,
        pitch: 1.05,
        onEnd: () => {
          idx++
          setTimeout(speakNextWord, isSlowRate ? 420 : 280)
        },
        onError: () => {
          setIsNarrating(false)
          setCurrentReadIndex(-1)
        },
      })
    }

    speakNextWord()
  }

  const startRecording = async () => {
    setSaveError(null)
    setMicErrorMsg(null)
    setPendingResults(null)
    setStatuses(passage.words.map(() => 'pending'))

    try {
      await startAudioRecord()
      setPhase('recording')
    } catch (err) {
      setPhase('idle')
      let msg = 'Could not access microphone.'
      if (err.code === 'permission_denied') {
        msg = 'Microphone permission denied. Please allow microphone access in your browser to read aloud.'
      } else if (err.code === 'not_found') {
        msg = 'No microphone found on your device.'
      } else if (err.code === 'unsupported') {
        msg = 'Microphone recording is not supported in this browser.'
      }
      setMicErrorMsg(msg)
    }
  }

  const revealWordByWord = (results) => {
    setPhase('revealing')
    results.forEach((r, i) => {
      setTimeout(() => {
        setStatuses((prev) => {
          const next = [...prev]
          next[i] = r.status
          return next
        })
      }, i * 260)
    })
    setTimeout(() => setPhase('done'), results.length * 260 + 300)
  }

  const handleSaveAndReveal = async (results, m) => {
    const expectedText = passage.words.join(' ')
    const recognizedWords = results.filter((r) => r.status !== 'error').map((r) => r.word).join(' ') || expectedText
    setSaveError(null)
    try {
      await saveReadingSession({
        activity_id: null,
        expected_text: expectedText,
        recognized_text: recognizedWords,
        duration_seconds: 15,
        stars: 4,
        xp: 20,
        outcome: { type: 'reading', title: 'Read With Me', metrics: m, xpGain: 20, starsGain: 4 },
      })
      setMetrics(m)
      revealWordByWord(results)
    } catch (err) {
      setPhase('idle')
      setSaveError(err.message || 'Could not save your reading adventure. Please check your connection and try again.')
      setPendingResults({ results, metrics: m })
    }
  }

  const stopRecording = async () => {
    if (phase === 'analyzing' || phase === 'revealing' || phase === 'done') return
    setPhase('analyzing')
    let audioResult = null
    try {
      audioResult = await stopAudioRecord()
    } catch (err) {
      // If stopping audio recorder throws, proceed cleanly
    }

    if (isRealBackend) {
      try {
        if (!audioResult?.blob) {
          throw new Error('No audio was recorded. Please try again.')
        }

        const expectedText = passage.words.join(' ')
        const res = await saveReadingSessionAudio({
          audioBlob: audioResult.blob,
          expectedText,
          durationSeconds: audioResult.duration || 15,
          stars: 4,
          xp: 20,
          language,
          filename: audioResult.filename || 'reading.webm',
        })

        const recognizedWords = (res.transcription || '').toLowerCase().split(/\s+/).filter(Boolean)
        const wordResults = passage.words.map((w) => {
          const cleanW = w.toLowerCase().replace(/[^a-z0-9]/g, '')
          const isCorrect = recognizedWords.some((rw) => rw.replace(/[^a-z0-9]/g, '') === cleanW)
          return {
            word: w,
            status: isCorrect ? 'correct' : 'error',
            subtype: isCorrect ? null : 'substitution',
          }
        })

        const accuracy = res.words_attempted > 0
          ? Math.round(((res.words_correct || 0) / res.words_attempted) * 100)
          : 85

        const m = {
          wordsRead: res.words_attempted || passage.words.length,
          accuracy,
          hesitations: res.hesitations || 0,
          omissions: res.omissions || 0,
          substitutions: res.substitutions || 0,
          repetitions: res.repetitions || 0,
          wordsPerMinute: res.words_per_minute || null,
          errors: Math.max(0, (res.words_attempted || passage.words.length) - (res.words_correct || 0)),
          friendlyFeedback: accuracy >= 85
            ? 'Great reading! You read the story clearly and smoothly.'
            : "Good effort! Let's keep practicing this story together.",
          transcription: res.transcription || '',
          is_mock: !!res.stt_is_mock,
          ai_mode: res.ai_mode || (res.stt_is_mock ? 'mock' : 'real'),
          pronunciation_analysis_available: res.pronunciation_analysis_available ?? false,
        }

        setMetrics(m)
        revealWordByWord(wordResults)
      } catch (err) {
        setPhase('idle')
        setSaveError(err.message || 'Could not process your reading session. Please try again.')
      }
    } else {
      // Demo / Mock path
      try {
        const { results, metrics: m } = await analyzeSpeech({ passageWords: passage.words })
        await handleSaveAndReveal(results, m)
      } catch (err) {
        setPhase('idle')
        setSaveError(err.message || 'Speech simulation failed.')
      }
    }
  }

  const replay = () => {
    cancelAudioRecord()
    setPhase('idle')
    setMetrics(null)
    setSaveError(null)
    setMicErrorMsg(null)
    setPendingResults(null)
    setStatuses(passage.words.map(() => 'pending'))
    setCurrentReadIndex(-1)
  }

  const readingProgress = phase === 'idle' ? 0 : phase === 'recording' ? 25 : phase === 'analyzing' ? 55 : phase === 'revealing' ? 80 : 100
  const nextActivity = isRealBackend
    ? nextRecommendedActivity
    : (nextRecommendedActivity || generateRecommendations(activeChild?.fingerprint || {}, errorPatterns, { excludeRoute: '/child/read' })[0])

  return (
    <div className="max-w-2xl mx-auto" data-testid="reading-session-container">
      {/* Top Bar with Choose Another and Voice Mode */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-600 font-display font-bold text-xs hover:text-slate-800 py-2 px-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 min-h-[40px] shadow-xs"
        >
          <ChevronLeft size={16} /> Choose another
        </button>
        <VoiceModeIndicator />
      </div>

      {/* 4-Stage Story Step Flow Indicator */}
      <div className="bg-white border border-[#D7EEF1] rounded-2xl p-2.5 mb-4 shadow-2xs">
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className={`py-2 px-1 rounded-xl text-[11px] font-display font-extrabold flex items-center justify-center gap-1 transition-all ${
            isNarrating ? 'bg-[#DDF9FC] text-[#08233A] ring-2 ring-[#13CFE3]' : 'text-[#527080] bg-[#F2FBFC]'
          }`}>
            <span>🔊</span>
            <span className="hidden sm:inline">1. Listen</span>
          </div>
          <div className={`py-2 px-1 rounded-xl text-[11px] font-display font-extrabold flex items-center justify-center gap-1 transition-all ${
            phase === 'idle' && !isNarrating ? 'bg-[#DDF9FC] text-[#08233A] ring-2 ring-[#13CFE3]' : 'text-[#527080] bg-[#F2FBFC]'
          }`}>
            <span>📖</span>
            <span className="hidden sm:inline">2. Read Along</span>
          </div>
          <div className={`py-2 px-1 rounded-xl text-[11px] font-display font-extrabold flex items-center justify-center gap-1 transition-all ${
            phase === 'recording' || phase === 'analyzing' ? 'bg-[#FFF2ED] text-[#D95C5C] ring-2 ring-[#D95C5C]' : 'text-[#527080] bg-[#F2FBFC]'
          }`}>
            <span>🎤</span>
            <span className="hidden sm:inline">3. Your Turn</span>
          </div>
          <div className={`py-2 px-1 rounded-xl text-[11px] font-display font-extrabold flex items-center justify-center gap-1 transition-all ${
            phase === 'done' ? 'bg-[#FFF9E6] text-[#08233A] ring-2 ring-[#FFC857]' : 'text-[#527080] bg-[#F2FBFC]'
          }`}>
            <span>⭐</span>
            <span className="hidden sm:inline">4. Star Reward</span>
          </div>
        </div>
      </div>

      <ProgressBar value={readingProgress} label="Reading progress" colorHex={theme.primaryColor || "#13CFE3"} />

      {presentation && presentation.support_level && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 px-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1]" data-testid="multimodal-mode-badge">
            <Sparkles size={13} className="text-[#0899AA]" /> {presentation.recommended_mode || 'READ_ALONG'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F8FA] text-[#08233A] border border-[#D7EEF1]" data-testid="multimodal-support-level-badge">
            <ShieldCheck size={13} className="text-[#39B87F]" /> {(presentation.support_level || 'GUIDED').replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Main Reading Board with Storybook Feel */}
      <Card className="my-4 text-center p-6 sm:p-8 rounded-3xl border-2 border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white">
        <div className="inline-block p-4 rounded-3xl bg-[#DDF9FC] border border-[#D7EEF1] text-6xl mb-3 shadow-inner">
          {passage.cover}
        </div>
        <p className="text-xs font-black text-[#0899AA] uppercase tracking-wider mb-3">{passage.title}</p>

        {presentation?.scaffolds?.show_word_cards && (
          <div className="my-3 p-3 bg-[#E6F8FA] rounded-2xl border border-[#D7EEF1] text-left" data-testid="visual-word-scaffold">
            <p className="text-xs font-bold text-[#08233A] mb-1.5 flex items-center gap-1">👀 Word Spotter</p>
            <div className="flex flex-wrap gap-1.5">
              {passage.words.slice(0, 5).map((w, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-white text-[#08233A] rounded-xl font-bold text-xs border border-[#D7EEF1] shadow-2xs">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Passage with comfort typography and child-paced active highlighting */}
        <div
          className={`my-4 p-4 rounded-2xl transition-all leading-loose font-display font-medium ${textSizeClass} ${
            isDyslexic ? 'font-dyslexic tracking-wider' : ''
          } ${
            showReadingGuide
              ? 'bg-[#FFF9E6]/60 border-2 border-dashed border-[#FFC857] shadow-inner'
              : 'bg-[#F2FBFC] border border-[#D7EEF1]'
          }`}
        >
          {passage.words.map((w, i) => {
            const isCurrentlyRead = currentReadIndex === i
            return (
              <span
                key={i}
                onClick={() => {
                  speakLanguageAudio({
                    text: w,
                    lang: language || 'en',
                    rate: isSlowRate ? 0.65 : 0.82,
                    pitch: 1.05,
                  })
                }}
                className={`inline-block mx-1 my-0.5 px-2 py-1 rounded-xl cursor-pointer transition-all select-none ${
                  isCurrentlyRead
                    ? 'bg-[#13CFE3] text-[#08233A] scale-110 font-black shadow-md ring-2 ring-[#0899AA]'
                    : 'hover:bg-[#E6F8FA]'
                }`}
                title="Tap to hear word"
              >
                <WordHighlight word={w} status={statuses[i]} />
              </span>
            )
          })}
        </div>

        {/* Child-Paced Audio Controls (Section 20: Listen, Replay, Slow, Guide, Read Aloud) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
          <AudioPlayer label="Play audio" text={passage?.words ? passage.words.join(' ') : ''} />

          <button
            type="button"
            onClick={playWordByWordNarration}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-display font-extrabold text-xs border transition-all min-h-[44px] cursor-pointer ${
              isNarrating
                ? 'bg-[#08233A] border-[#08233A] text-white shadow-md animate-pulse'
                : 'bg-[#DDF9FC] border-[#D7EEF1] text-[#08233A] hover:bg-[#13CFE3]'
            }`}
          >
            <Volume2 size={16} className="text-[#0899AA]" />
            {isNarrating ? 'Reading with you…' : 'Read Aloud with Me'}
          </button>

          <button
            type="button"
            onClick={() => setIsSlowRate((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl font-display font-bold text-xs border transition-all min-h-[44px] cursor-pointer ${
              isSlowRate
                ? 'bg-[#FFF9E6] border-[#FFE8A3] text-[#B87D00] shadow-xs'
                : 'bg-white border-[#D7EEF1] text-[#527080] hover:bg-[#F2FBFC]'
            }`}
            title="Toggle slow reading pace"
          >
            <span>🐢</span>
            <span>{isSlowRate ? 'Slow ON' : 'Slow'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReadingGuide((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl font-display font-bold text-xs border transition-all min-h-[44px] cursor-pointer ${
              showReadingGuide
                ? 'bg-[#FFF9E6] border-[#FFE8A3] text-[#B87D00] shadow-xs'
                : 'bg-white border-[#D7EEF1] text-[#527080] hover:bg-[#F2FBFC]'
            }`}
            title="Toggle reading focus guide"
          >
            <span>📖</span>
            <span>Reading Guide</span>
          </button>

          <button
            type="button"
            onClick={replay}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl font-display font-bold text-xs border border-[#D7EEF1] bg-white text-[#527080] hover:text-[#08233A] hover:bg-[#F2FBFC] transition-all min-h-[44px] cursor-pointer"
            title="Reset and practice again"
          >
            <RotateCcw size={15} />
            <span>Replay</span>
          </button>
        </div>
      </Card>

      {micErrorMsg && (
        <Card className="my-4 bg-amber-50 border border-amber-200 text-center p-4 rounded-2xl">
          <p className="font-display font-bold text-amber-900 mb-1">Microphone Access Needed 🎤</p>
          <p className="text-xs text-slate-600 mb-3">{micErrorMsg}</p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={startRecording} className="min-h-[44px] rounded-xl">Try Again 🔄</Button>
          </div>
        </Card>
      )}

      {saveError && (
        <Card className="my-4 bg-amber-50 border border-amber-200 text-center p-4 rounded-2xl">
          <p className="font-display font-bold text-amber-900 mb-1">Could not save your reading adventure ⚠️</p>
          <p className="text-xs text-slate-600 mb-3">{saveError}</p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={() => (pendingResults ? handleSaveAndReveal(pendingResults?.results, pendingResults?.metrics) : stopRecording())} className="min-h-[44px] rounded-xl">
              Tap to Retry 🔄
            </Button>
          </div>
        </Card>
      )}

      {phase === 'idle' && !micErrorMsg && (
        <div className="flex justify-center my-6">
          <RecordingButton
            onStart={startRecording}
            onStop={stopRecording}
            onError={(err) => {
              setPhase('idle')
              let msg = 'Could not access microphone.'
              if (err?.code === 'permission_denied') {
                msg = 'Microphone permission denied. Please allow microphone access in your browser to read aloud.'
              } else if (err?.code === 'not_found') {
                msg = 'No microphone found on your device.'
              } else if (err?.code === 'unsupported') {
                msg = 'Microphone recording is not supported in this browser.'
              }
              setMicErrorMsg(msg)
            }}
            idleLabel="🎤 Start Reading"
          />
        </div>
      )}

      {phase === 'recording' && (
        <div className="flex flex-col items-center gap-3 my-6">
          <div className="w-20 h-20 rounded-full bg-brand-500 border-4 border-brand-300 flex items-center justify-center text-white animate-pulse shadow-lg">
            <div className="w-4 h-4 rounded-sm bg-white" />
          </div>
          <p className="font-display font-bold text-sm text-slate-600">
            Listening closely with {theme.mascot}… ({recordDuration}s)
          </p>
          <Button variant="secondary" size="sm" onClick={stopRecording} className="min-h-[44px] px-6 rounded-2xl">
            ⏹ Stop
          </Button>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="text-center my-6">
          <Skeleton className="h-16 max-w-sm mx-auto mb-3 rounded-2xl" />
          <p className="text-slate-500 font-bold text-sm">Checking your reading with {theme.mascot}… 🧠</p>
        </div>
      )}

      {phase === 'revealing' && (
        <p className="text-center text-slate-400 font-semibold text-sm my-6">✨</p>
      )}

      {phase === 'done' && metrics && (
        <Card className="animate-pop text-center p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl my-6">
          <div className="text-6xl mb-2">{theme.badgeIcon || '🎉'}</div>
          <div className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            {theme.mascot} cheers:
          </div>
          <p className="font-display font-bold text-xl mb-3">Great job!</p>
          <div className="flex justify-center gap-1 mb-4 text-3xl">
            {starsFor(metrics.accuracy).map((filled, i) => (
              <span key={i} className={filled ? 'text-amber-400' : 'text-slate-300'}>
                {filled ? '⭐' : '☆'}
              </span>
            ))}
          </div>
          <p className="text-sm font-bold text-slate-600 mb-6">{metrics.friendlyFeedback}</p>
          <Button
            className="w-full min-h-[52px] rounded-2xl font-display font-extrabold text-base border-b-4 active:border-b-0 active:translate-y-1 shadow-md"
            onClick={() => navigate('/child/results')}
          >
            Continue to Results &rarr;
          </Button>

          {nextActivity && (
            <Link to={nextActivity.route || '/child/home'} className="block mt-4">
              <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-left flex items-center gap-3 hover:bg-brand-100 transition-colors shadow-xs">
                <span className="text-2xl">{nextActivity.icon || '✨'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">Try This Next</p>
                  <p className="font-display font-extrabold text-sm text-slate-800">{nextActivity.title || nextActivity.activity}</p>
                </div>
                <span className="text-brand-600 font-bold">▶</span>
              </div>
            </Link>
          )}
        </Card>
      )}
    </div>
  )
}

function starsFor(accuracy) {
  const count = accuracy >= 85 ? 3 : accuracy >= 60 ? 2 : 1
  return [1, 2, 3].map((n) => n <= count)
}
