import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppLink as Link } from '../../components/nav/AppLink'
import { STORIES } from '../../data/demoData'
import { useApp } from '../../context/AppContext'
import { Card, Button, colorFor, ProgressBar } from '../../components/ui'
import { AudioPlayer } from '../../components/AudioPlayer'
import { evaluateComprehension } from '../../services/mockAiService'
import { generateRecommendations } from '../../services/adaptiveEngine'
import { ChevronLeft, Play, Pause, ChevronRight, Headphones, BookOpenText } from 'lucide-react'

const COLOR_HEX = { brand: '#12aeef', berry: '#a86bff', mint: '#2fd486', peach: '#ff8a4c', sun: '#ffc93c' }

export default function StoryReader() {
  const { storyId } = useParams()
  const navigate = useNavigate()
  const story = STORIES.find((s) => s.id === storyId)
  const { applySessionOutcome, saveLearningSession, isRealBackend, activeChild, errorPatterns, nextRecommendedActivity } = useApp()

  const [mode, setMode] = useState('intro') // intro | listen | reading | questions | results
  const [lineIdx, setLineIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  if (!story) return <div className="text-center py-16 text-slate-500">Story not found.</div>
  const c = colorFor(story.color)

  const togglePlay = () => {
    setPlaying(true)
    setTimeout(() => setPlaying(false), 1200)
  }

  const startReading = (autoAdvance) => {
    setLineIdx(0)
    setSaveError(null)
    setMode(autoAdvance ? 'listen' : 'reading')
    if (autoAdvance) {
      // "Listen" mode auto-narrates through the passage
      story.passage.forEach((_, i) => {
        setTimeout(() => setLineIdx(i), i * 2200)
      })
      setTimeout(() => setMode('questions'), story.passage.length * 2200)
    }
  }

  const handleSaveResult = async (compResult) => {
    if (saving) return
    const outcome = {
      type: 'story',
      skill: 'comprehension',
      title: 'Story Challenge',
      accuracy: compResult.accuracy,
      xpGain: 20,
      starsGain: 4,
      _savedToBackend: isRealBackend,
    }
    if (isRealBackend) {
      setSaving(true)
      setSaveError(null)
      try {
        await saveLearningSession({
          skill: 'comprehension',
          outcome,
          stars: 4,
          xp: 20,
        })
      } catch (err) {
        setSaveError(err.message || 'Could not save story progress.')
      } finally {
        setSaving(false)
      }
    } else {
      applySessionOutcome(outcome)
    }
    setTimeout(() => setMode('results'), 500)
  }

  const answerQuestion = async (opt) => {
    const q = story.questions[qIdx]
    const correct = opt === q.answer
    const nextAnswers = [...answers, { correct }]
    setAnswers(nextAnswers)
    if (qIdx + 1 < story.questions.length) {
      setTimeout(() => setQIdx((i) => i + 1), 500)
    } else {
      const r = await evaluateComprehension({ answers: nextAnswers })
      setResult(r)
      handleSaveResult(r)
    }
  }

  const nextActivity = isRealBackend
    ? nextRecommendedActivity
    : (nextRecommendedActivity || generateRecommendations(activeChild.fingerprint, errorPatterns, { excludeRoute: `/child/stories/${storyId}` })[0])

  return (
    <div className="max-w-xl mx-auto pb-8">
      <button
        onClick={() => navigate('/child/stories')}
        className="flex items-center gap-1 text-[#527080] font-bold text-xs mb-4 hover:text-[#08233A] py-2 px-3 rounded-2xl bg-white border border-[#D7EEF1] hover:bg-[#F2FBFC] min-h-[40px] shadow-2xs transition-colors"
      >
        <ChevronLeft size={16} /> Back to stories
      </button>

      {mode === 'intro' && (
        <Card className="p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white text-center">
          <div className="h-36 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-5 rounded-t-3xl bg-[#DDF9FC] flex items-center justify-center text-7xl select-none">
            {story.cover}
          </div>
          <h1 className="font-display font-black text-2xl text-[#08233A] mb-1">{story.title}</h1>
          <p className="text-[#527080] font-semibold text-xs mb-4">{story.difficulty} · {story.duration}</p>
          {story.characters?.length > 0 && (
            <div className="flex justify-center gap-2 flex-wrap mb-6">
              {story.characters.map((ch) => (
                <span key={ch} className="text-xs font-bold bg-[#E6F8FA] text-[#08233A] border border-[#D7EEF1] px-3 py-1 rounded-full">
                  {ch}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 min-h-[48px] rounded-2xl border-2 border-[#D7EEF1] bg-white text-[#08233A] hover:bg-[#F2FBFC] font-display font-bold text-sm"
              icon={<Headphones size={18} />}
              onClick={() => startReading(true)}
            >
              Listen Along
            </Button>
            <Button
              className="flex-1 min-h-[48px] rounded-2xl font-display font-black text-sm bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 shadow-md cursor-pointer"
              icon={<BookOpenText size={18} />}
              onClick={() => startReading(false)}
            >
              Read
            </Button>
          </div>
        </Card>
      )}

      {(mode === 'reading' || mode === 'listen') && (
        <Card className="p-6 sm:p-8 rounded-3xl border-2 border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white">
          <div className="h-32 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-5 rounded-t-3xl bg-[#DDF9FC] flex items-center justify-center text-7xl select-none">
            {story.cover}
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#08233A] bg-[#13CFE3] hover:bg-[#0899AA] hover:text-white shadow-md transition-all cursor-pointer"
              aria-label="Play page audio"
            >
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <AudioPlayer label="Narrate page" text={story?.passage?.[lineIdx] || ''} />
            <button
              type="button"
              onClick={() => {
                togglePlay()
              }}
              className="px-3 py-2 rounded-2xl border border-[#D7EEF1] bg-white text-[#527080] hover:text-[#08233A] hover:bg-[#F2FBFC] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Replay page narration"
            >
              <span>↻</span>
              <span>Replay</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGuide((v) => !v)}
              className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                showGuide
                  ? 'bg-[#FFF9E6] border-[#FFE8A3] text-[#B87D00]'
                  : 'bg-white border-[#D7EEF1] text-[#527080] hover:bg-[#F2FBFC]'
              }`}
              title="Toggle reading guide ruler"
            >
              <span>📖</span>
              <span className="hidden sm:inline">Guide</span>
            </button>
          </div>

          <div
            className={`transition-all ${
              showGuide
                ? 'p-2 rounded-2xl bg-[#FFF9E6]/50 border-2 border-dashed border-[#FFC857]'
                : ''
            }`}
          >
            <p className="text-xl sm:text-2xl font-display font-medium text-[#08233A] leading-relaxed text-center min-h-[6rem] flex items-center justify-center px-4 py-4 bg-[#F2FBFC] rounded-2xl border border-[#D7EEF1]">
              "{story.passage[lineIdx]}"
            </p>
          </div>

          {mode === 'reading' ? (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#D7EEF1]">
              <Button
                variant="ghost"
                size="sm"
                disabled={lineIdx === 0}
                onClick={() => setLineIdx((i) => i - 1)}
                className="min-h-[44px] px-4 rounded-xl text-xs font-bold"
              >
                ◀ Prev
              </Button>
              <span className="text-xs text-[#527080] font-black bg-[#DDF9FC] px-3 py-1 rounded-full border border-[#D7EEF1]">
                Page {lineIdx + 1} of {story.passage.length}
              </span>
              {lineIdx + 1 < story.passage.length ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLineIdx((i) => i + 1)}
                  className="min-h-[44px] px-4 rounded-xl text-xs font-bold text-[#08233A]"
                >
                  Next ▶
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setMode('questions')}
                  className="min-h-[44px] px-5 rounded-2xl font-display font-black bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white border-b-2 border-[#0899AA]"
                >
                  Continue <ChevronRight size={16} />
                </Button>
              )}
            </div>
          ) : (
            <div className="mt-6 pt-4 border-t border-[#D7EEF1]">
              <ProgressBar value={((lineIdx + 1) / story.passage.length) * 100} colorHex="#13CFE3" label="Listening along" />
            </div>
          )}
        </Card>
      )}

      {saveError && (
        <Card className="my-4 bg-coral-50 border border-coral-200 text-center p-4 rounded-2xl">
          <p className="font-display font-bold text-coral-600 mb-1">Could not save story results ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{saveError}</p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={() => handleSaveResult(result)}>Tap to Retry 🔄</Button>
          </div>
        </Card>
      )}

      {mode === 'questions' && (
        <Card className="p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white text-center animate-pop">
          <p className="text-xs font-black text-[#0899AA] uppercase tracking-wider mb-2">
            Question {qIdx + 1} of {story.questions.length}
          </p>
          <p className="font-display font-black text-xl text-[#08233A] mb-6">{story.questions[qIdx].q}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {story.questions[qIdx].options.map((opt) => (
              <button
                key={opt.text}
                onClick={() => answerQuestion(opt.text)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 bg-[#F2FBFC] hover:bg-[#E6F8FA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <span className="text-4xl select-none">{opt.emoji}</span>
                <span className="font-display font-black text-[#08233A] text-sm">{opt.text}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {mode === 'results' && result && (
        <Card className="p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white text-center animate-pop">
          <div className="text-6xl mb-3 select-none">🎉</div>
          <h2 className="font-display font-black text-2xl text-[#08233A] mb-2">Story Complete!</h2>
          <p className="text-sm font-bold text-[#527080] mb-4">
            You scored {result.accuracy}% on comprehension!
          </p>
          <div className="flex justify-center gap-1 mb-6 text-3xl">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className="text-[#FFC857]">⭐</span>
            ))}
          </div>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => navigate('/child/stories')}
              className="min-h-[48px] px-8 rounded-2xl font-display font-black bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 shadow-md cursor-pointer"
            >
              Choose Next Story ▶
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
