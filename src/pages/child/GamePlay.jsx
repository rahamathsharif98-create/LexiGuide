import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppLink as Link } from '../../components/nav/AppLink'
import { GAMES } from '../../data/demoData'
import { GAME_CONTENT } from '../../data/gameContent'
import { GAMING_ZONE_GAMES } from '../../data/gamingZoneRegistry'
import { useApp } from '../../context/AppContext'
import { generateRecommendations } from '../../services/adaptiveEngine'
import { Card, Button, colorFor, ProgressBar } from '../../components/ui'
import { AudioPlayer } from '../../components/AudioPlayer'
import { SoundSafariAudio } from '../../components/SoundSafariAudio'
import VoiceModeIndicator from '../../components/VoiceModeIndicator'
import { resolveThemePackage } from '../../services/personalizationService'
import { audioAtmosphere } from '../../services/audioAtmosphereService'
import { ChevronLeft, Lightbulb } from 'lucide-react'
import { HelpButton } from '../../components/child/HelpButton'

const GAME_ALIAS_MAP = {
  'sound-safari': 'match-sound',
  'letter-detective': 'find-sound',
  'word-builder': 'build-word',
  'picture-match': 'picture-word',
}

const ALL_GAMES_CATALOG = [
  ...GAMES,
  ...GAMING_ZONE_GAMES.filter((gz) => !GAMES.some((g) => g.id === gz.id)),
]

function useSafeApp() {
  try {
    return useApp()
  } catch {
    return {
      activeChild: null,
      isRealBackend: false,
      errorPatterns: [],
      applySessionOutcome: () => {},
      saveLearningSession: () => {},
    }
  }
}

export default function GamePlay() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const resolvedGameId = GAME_ALIAS_MAP[gameId] || gameId
  const game = ALL_GAMES_CATALOG.find((g) => g.id === resolvedGameId) || GAMES.find((g) => g.id === resolvedGameId)

  const rounds = GAME_CONTENT[resolvedGameId] || []
  const { applySessionOutcome, saveLearningSession, isRealBackend, activeChild, errorPatterns, nextRecommendedActivity, language } = useSafeApp()

  const [stage, setStage] = useState('intro') // intro | playing | finished
  const [roundIdx, setRoundIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong' | null
  const [builtWord, setBuiltWord] = useState([])
  const [selectedWords, setSelectedWords] = useState([])
  const [showHint, setShowHint] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Resolve Child's Theme Package (Cosmetics ONLY - Never pedagogy)
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

  if (!game) return <EmptyGame navigate={navigate} />

  const c = colorFor(game.color)
  const round = rounds[roundIdx]
  const total = rounds.length

  const finishGame = async (finalScore) => {
    if (saving) return
    const pct = Math.round((finalScore / total) * 100)
    const outcome = {
      type: 'game',
      skill: game.skill,
      title: game.title,
      score: pct,
      accuracy: pct,
      xpGain: 15 + finalScore * 3,
      starsGain: finalScore,
      _savedToBackend: isRealBackend,
    }
    setStage('finished')
    if (isRealBackend) {
      setSaving(true)
      setSaveError(null)
      try {
        await saveLearningSession({
          skill: game.skill,
          outcome,
          stars: finalScore,
          xp: 15 + finalScore * 3,
        })
      } catch (err) {
        setSaveError(err.message || 'Could not save game results.')
      } finally {
        setSaving(false)
      }
    } else {
      applySessionOutcome(outcome)
    }
  }

  const nextRound = (wasCorrect) => {
    const newScore = score + (wasCorrect ? 1 : 0)
    setScore(newScore)
    setFeedback(wasCorrect ? 'correct' : 'wrong')
    try {
      if (wasCorrect) {
        audioAtmosphere?.playSuccess?.()
      } else {
        audioAtmosphere?.playRetry?.()
      }
    } catch {}
    setTimeout(() => {
      setFeedback(null)
      setBuiltWord([])
      setSelectedWords([])
      setShowHint(false)
      if (roundIdx + 1 >= total) {
        finishGame(newScore)
      } else {
        setRoundIdx((i) => i + 1)
      }
    }, 900)
  }


  const restart = () => {
    setStage('intro')
    setRoundIdx(0)
    setScore(0)
    setFeedback(null)
    setBuiltWord([])
    setSelectedWords([])
    setShowHint(false)
    setSaveError(null)
    setSaving(false)
  }

  const nextActivity = isRealBackend
    ? nextRecommendedActivity
    : (nextRecommendedActivity || generateRecommendations(activeChild?.fingerprint || {}, errorPatterns, { excludeRoute: `/child/games/${gameId}` })[0])

  return (
    <div className="max-w-xl mx-auto" data-testid="gameplay-container">
      {/* Top bar with back and voice indicator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/child/games')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-600 font-display font-bold text-xs hover:bg-slate-50 min-h-[40px] shadow-xs"
        >
          <ChevronLeft size={16} /> Back to games
        </button>
        <VoiceModeIndicator />
      </div>

      {stage === 'intro' && (
        <Card className="text-center p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white">
          <div className="text-xs font-black text-[#0899AA] uppercase tracking-wider mb-2">
            {theme.mascot}
          </div>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#DDF9FC] border border-[#D7EEF1] flex items-center justify-center text-4xl mb-4 shadow-inner">
            {game.icon}
          </div>
          <h1 className="font-display font-black text-2xl text-[#08233A]">{game.title}</h1>
          <p className="text-[#527080] font-medium mt-2 mb-4">{instructionsFor(gameId)}</p>
          <div className="flex justify-center mb-6">
            <AudioPlayer label="Hear instructions" text={instructionsFor(gameId)} />
          </div>
          <Button
            size="lg"
            onClick={() => setStage('playing')}
            className="w-full sm:w-auto min-h-[52px] px-8 rounded-2xl font-display font-black text-base border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 shadow-md bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white transition-all cursor-pointer"
          >
            Start Game ▶
          </Button>
        </Card>
      )}

      {stage === 'playing' && round && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#527080]">Round {roundIdx + 1} of {total}</span>
            <span className="text-sm font-bold flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={i < score ? 'text-[#FFC857]' : 'text-slate-300'}>
                  {i < score ? '⭐' : '☆'}
                </span>
              ))}
            </span>
          </div>
          <ProgressBar value={(roundIdx / total) * 100} colorHex={theme.primaryColor || "#13CFE3"} />
          
          <Card className="mt-4 text-center relative min-h-[280px] flex flex-col items-center justify-center p-6 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white">
            {feedback && (
              <div
                className={`absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl font-display font-black rounded-3xl z-20 transition-all ${
                  feedback === 'correct'
                    ? 'bg-[#E6F8FA]/95 text-[#0899AA] border-2 border-[#13CFE3] shadow-lg'
                    : 'bg-[#FFF9E6]/95 text-[#B87D00] border-2 border-[#FFC857] shadow-lg'
                }`}
                data-testid="feedback-overlay"
              >
                {feedback === 'correct' ? '🎉 Great job!' : "💪 Let's try again!"}
              </div>
            )}
            <GameRound
              gameId={resolvedGameId}
              round={round}
              builtWord={builtWord}
              setBuiltWord={setBuiltWord}
              selectedWords={selectedWords}
              setSelectedWords={setSelectedWords}
              onAnswer={nextRound}
              language={language}
              theme={theme}
            />
          </Card>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            {showHint ? (
              <p className="text-sm text-[#08233A] bg-[#FFF9E6] border border-[#FFE8A3] px-4 py-2 rounded-2xl font-bold animate-pop shadow-2xs">
                💡 {game.hint}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#527080] hover:text-[#08233A] py-2 px-3 rounded-xl hover:bg-[#E6F8FA] min-h-[44px] transition-colors cursor-pointer"
              >
                <Lightbulb size={16} className="text-[#FFC857]" /> Need a hint?
              </button>
            )}
            <HelpButton
              instruction={instructionsFor(gameId)}
              visualHint={game.hint}
              modelSound={round?.sound || round?.word || ''}
              lang={language}
            />
          </div>
        </div>
      )}

      {saveError && (
        <Card className="my-4 bg-coral-50 border border-coral-200 text-center p-4 rounded-2xl">
          <p className="font-display font-bold text-coral-600 mb-1">Could not save game results ⚠️</p>
          <p className="text-xs text-slate-500 mb-3">{saveError}</p>
          <div className="flex justify-center gap-2">
            <Button size="sm" onClick={() => finishGame(score)}>Tap to Retry 🔄</Button>
          </div>
        </Card>
      )}

      {stage === 'finished' && (
        <Card className="text-center p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white animate-pop">
          <div className="text-6xl mb-3 select-none">{theme.badgeIcon || '🏆'}</div>
          <h2 className="font-display font-black text-2xl text-[#08233A]">Nice work!</h2>
          <div className="text-xs font-black text-[#0899AA] uppercase tracking-wider mb-2 mt-1">
            {theme.mascot} cheers: "{theme.rewardTitle || 'Awesome Adventurer'}"! 🎉
          </div>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            You got {score} out of {total} correct.
          </p>
          
          <div className="flex justify-center mt-4">
            <div className="bg-sun-50 text-sun-600 font-display font-bold px-4 py-2 rounded-2xl">
              ⭐ +{score} Stars earned
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Button
              variant="secondary"
              onClick={restart}
              className="min-h-[48px] px-5 rounded-2xl border-2 border-slate-200"
            >
              Play Again
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/child/results')}
              className="min-h-[48px] px-5 rounded-2xl"
            >
              See Results
            </Button>
          </div>
          
          {nextActivity && (
            <Link to={nextActivity.route || '/child/read'} className="block mt-5">
              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-left flex items-center gap-3 hover:bg-brand-100 transition-colors shadow-xs">
                <span className="text-2xl">{nextActivity.icon || '✨'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wide">Try This Next</p>
                  <p className="font-display font-bold text-sm text-slate-800">{nextActivity.title || nextActivity.activity}</p>
                </div>
                <span className="text-brand-500 font-bold">▶</span>
              </div>
            </Link>
          )}
        </Card>
      )}
    </div>
  )
}

function instructionsFor(id) {
  const resolved = GAME_ALIAS_MAP[id] || id
  return {
    'match-sound': 'Listen to the sound, then tap the picture that matches it.',
    'sound-hunt': 'Listen to the sound and find the picture that starts with it.',
    'sound-match': 'Listen to the word, then tap the picture that matches it.',
    'sound-rhythm': 'Listen to the gentle rhythm and tap the matching pattern.',
    'build-word': 'Look at the picture and tap the letters in the right order to build the word.',
    'word-train': 'Load the train carriages in order to spell the word.',
    'missing-letter': 'Look at the picture and choose the missing letter to complete the word.',
    'find-sound': 'Tap every word that has the target sound in it.',
    'picture-word': 'Look at the picture and tap the word that matches it.',
    'story-puzzle': 'Put the story pictures in order: what happens first, next, and last?',
    'sound-detective': 'Listen closely, then tap the sound you heard.',
  }[resolved] || 'Have fun and do your best!'
}

function GameRound({ gameId, round, builtWord, setBuiltWord, selectedWords, setSelectedWords, onAnswer, language, theme }) {
  if (gameId === 'match-sound') {
    return (
      <div>
        <div className="mb-6">
          <SoundSafariAudio sound={round.sound} label={round.label} language={language} />
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          {round.options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                try {
                  audioAtmosphere?.playChime?.(640, 0.08)
                } catch {}
                onAnswer(opt === round.correct)
              }}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-[#F2FBFC] hover:bg-[#E6F8FA] rounded-3xl flex items-center justify-center text-4xl sm:text-5xl transition-all border-2 border-[#D7EEF1] hover:border-[#13CFE3] shadow-xs hover:scale-105 active:scale-95 cursor-pointer select-none"
              aria-label={`Option ${opt}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (gameId === 'sound-hunt') {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#DDF9FC] border border-[#BCEBF2] text-[#08233A] mb-4 shadow-2xs">
          <span className="text-2xl">🔤</span>
          <span className="font-display font-black text-2xl text-[#0899AA]">{round.letter}</span>
          <span className="text-xs font-bold text-[#527080]">({round.sound})</span>
        </div>
        <p className="font-display font-black text-lg text-[#08233A] mb-6">
          {round.prompt}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          {round.options.map((opt) => (
            <button
              key={opt.name}
              onClick={() => {
                try {
                  audioAtmosphere?.playChime?.(640, 0.08)
                } catch {}
                onAnswer(opt.emoji === round.correct)
              }}
              className="w-24 h-24 sm:w-28 sm:h-28 bg-[#F2FBFC] hover:bg-[#E6F8FA] rounded-3xl flex flex-col items-center justify-center p-2 transition-all border-2 border-[#D7EEF1] hover:border-[#13CFE3] shadow-xs hover:scale-105 active:scale-95 cursor-pointer select-none"
              aria-label={opt.name}
            >
              <span className="text-4xl sm:text-5xl">{opt.emoji}</span>
              <span className="text-xs font-extrabold text-[#08233A] mt-1 truncate">{opt.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (gameId === 'sound-match') {
    return (
      <div className="text-center">
        <div className="mb-5 inline-flex items-center gap-3 bg-[#FEF8EC] border border-[#FDE6BE] px-5 py-2.5 rounded-2xl shadow-2xs">
          <span className="text-2xl">🔊</span>
          <span className="font-display font-black text-2xl text-[#B45309]">{round.word}</span>
        </div>
        <p className="font-display font-bold text-sm text-[#527080] mb-5">
          Listen and tap the matching picture!
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          {round.options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                try {
                  audioAtmosphere?.playChime?.(640, 0.08)
                } catch {}
                onAnswer(opt === round.correct)
              }}
              className="w-22 h-22 sm:w-26 sm:h-26 bg-[#F2FBFC] hover:bg-[#E6F8FA] rounded-3xl flex items-center justify-center text-4xl sm:text-5xl transition-all border-2 border-[#D7EEF1] hover:border-[#13CFE3] shadow-xs hover:scale-105 active:scale-95 cursor-pointer select-none"
              aria-label={`Option ${opt}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (gameId === 'word-train') {
    const target = round.word
    const handleLetter = (letter, idx) => {
      const nextWord = [...builtWord, letter]
      setBuiltWord(nextWord)
      if (nextWord.length === target.length) {
        onAnswer(nextWord.join('') === target)
      }
    }
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2 text-4xl select-none animate-float">
          <span>🚂</span>
          <span>{round.image}</span>
        </div>
        <p className="text-xs text-[#527080] font-semibold mb-4">
          Load the train carriages to spell the word!
        </p>
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#08233A] text-white flex items-center justify-center font-black text-xl shadow-xs">
            🚂
          </div>
          {target.split('').map((_, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-2xl bg-[#DDF9FC] border-2 border-[#BCEBF2] flex items-center justify-center font-display font-black text-xl text-[#08233A] shadow-2xs"
            >
              {builtWord[i] || '—'}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          {round.scrambled.map((l, i) => (
            <button
              key={i}
              onClick={() => handleLetter(l, i)}
              disabled={builtWord.length >= target.length}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-white hover:bg-[#E6F8FA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] rounded-2xl font-display font-black text-2xl text-[#08233A] transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40"
              aria-label={`Carriage ${l}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (gameId === 'missing-letter') {
    return (
      <div className="text-center">
        <div className="text-6xl mb-3 select-none animate-float">{round.image}</div>
        <div className="inline-flex items-center justify-center px-6 py-2.5 rounded-2xl bg-[#F2FBFC] border-2 border-[#D7EEF1] text-2xl font-display font-black text-[#08233A] mb-5 tracking-widest shadow-inner">
          {round.wordDisplay}
        </div>
        <p className="text-xs text-[#527080] font-semibold mb-4">
          Which letter is missing? Tap to complete!
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          {round.options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                try {
                  audioAtmosphere?.playChime?.(640, 0.08)
                } catch {}
                onAnswer(opt === round.missing)
              }}
              className="w-14 h-14 bg-white hover:bg-[#E6F8FA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] rounded-2xl font-display font-black text-2xl text-[#08233A] transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (gameId === 'story-puzzle') {
    const handlePick = (item) => {
      const nextSelected = [...selectedWords, item.id]
      setSelectedWords(nextSelected)
      if (nextSelected.length === round.correctOrder.length) {
        const isMatch = nextSelected.every((id, idx) => id === round.correctOrder[idx])
        onAnswer(isMatch)
      }
    }
    return (
      <div className="text-center">
        <h3 className="font-display font-black text-base text-[#08233A] mb-1">{round.title}</h3>
        <p className="text-xs text-[#527080] font-semibold mb-5">{round.prompt}</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {round.items.map((item) => {
            const isPicked = selectedWords.includes(item.id)
            const pickedIndex = selectedWords.indexOf(item.id) + 1
            return (
              <button
                key={item.id}
                onClick={() => {
                  try { audioAtmosphere?.playChime?.(640, 0.08) } catch {}
                  !isPicked && handlePick(item)
                }}
                disabled={isPicked}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isPicked
                    ? 'bg-[#DDF9FC] border-[#13CFE3] scale-95 opacity-80'
                    : 'bg-white border-[#D7EEF1] hover:border-[#13CFE3] hover:scale-105'
                }`}
              >
                <span className="text-4xl mb-1">{item.emoji}</span>
                <span className="text-xs font-bold text-[#08233A]">{item.label}</span>
                {isPicked && (
                  <span className="mt-1 text-[10px] font-black bg-[#13CFE3] text-[#08233A] px-2 py-0.5 rounded-full">
                    Step {pickedIndex}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (gameId === 'sound-rhythm') {
    return (
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 bg-[#F3F0FF] border border-[#DDD6FE] px-4 py-2 rounded-2xl text-[#6D28D9]">
          <span className="text-2xl">🎵</span>
          <span className="font-display font-black text-sm">{round.pattern}</span>
        </div>
        <p className="font-display font-bold text-sm text-[#08233A] mb-5">
          {round.prompt}
        </p>
        <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
          {round.options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                try { audioAtmosphere?.playChime?.(640, 0.08) } catch {}
                onAnswer(opt === round.correct)
              }}
              className="px-5 py-3 rounded-2xl bg-[#F2FBFC] hover:bg-[#E6F8FA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] font-display font-black text-sm text-[#08233A] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (gameId === 'build-word') {
    const target = round.word
    const handleLetter = (letter, idx) => {
      const nextWord = [...builtWord, letter]
      setBuiltWord(nextWord)
      if (nextWord.length === target.length) {
        onAnswer(nextWord.join('') === target)
      }
    }
    return (
      <div>
        <div className="text-7xl mb-4 select-none animate-float">{round.image}</div>
        <div className="flex justify-center gap-2 mb-6 min-h-[3rem]">
          {target.split('').map((_, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-2xl bg-[#F2FBFC] border-2 border-[#D7EEF1] flex items-center justify-center font-display font-black text-xl text-[#08233A] shadow-2xs"
            >
              {builtWord[i] || ''}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          {round.letters.map((l, i) => (
            <button
              key={i}
              onClick={() => handleLetter(l, i)}
              disabled={builtWord.length >= target.length}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-white hover:bg-[#E6F8FA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] rounded-2xl font-display font-black text-2xl text-[#08233A] transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
              aria-label={`Letter ${l}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (gameId === 'find-sound') {
    const toggle = (w) => {
      setSelectedWords((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]))
    }
    const submit = () => {
      const correct = round.answers.every((a) => selectedWords.includes(a)) && selectedWords.length === round.answers.length
      onAnswer(correct)
    }
    return (
      <div>
        <p className="font-display font-bold text-[#08233A] text-base mb-4">
          Find words with <span className="text-[#0899AA] bg-[#DDF9FC] px-2.5 py-0.5 rounded-lg border border-[#D7EEF1]">/{round.target}/</span>
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-6">
          {round.words.map((w) => (
            <button
              key={w}
              onClick={() => toggle(w)}
              className={`px-5 py-3 rounded-xl font-display font-semibold font-black text-base border-2 transition-all shadow-xs cursor-pointer ${
                selectedWords.includes(w)
                  ? 'bg-[#08233A] border-[#08233A] text-white shadow-md scale-105'
                  : 'bg-[#F2FBFC] border-[#D7EEF1] text-[#08233A] hover:border-[#13CFE3] hover:bg-[#E6F8FA]'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
        <Button
          onClick={submit}
          disabled={selectedWords.length === 0}
          className="min-h-[48px] px-8 rounded-2xl font-display font-black bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 shadow-md cursor-pointer"
        >
          Check Answer
        </Button>
      </div>
    )
  }

  if (gameId === 'picture-word') {
    return (
      <div>
        <div className="text-7xl mb-6 select-none animate-float">{round.emoji}</div>
        <div className="flex gap-3 justify-center flex-wrap">
          {round.options.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(opt === round.correct)}
              className="px-6 py-3.5 rounded-2xl bg-peach-100 bg-[#F2FBFC] hover:bg-[#E6F8FA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] font-display font-black text-lg text-[#08233A] transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (gameId === 'sound-detective') {
    return (
      <div>
        <div className="mb-4">
          <AudioPlayer label="Play the sound" text={round.correctSound || 'sound'} />
        </div>
        <div className="flex gap-4 justify-center">
          {round.options.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(opt === round.correctSound)}
              className="w-16 h-16 rounded-2xl bg-sun-100 hover:bg-sun-300 font-display font-bold text-lg text-sun-700 transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return null
}


function EmptyGame({ navigate }) {
  return (
    <div className="text-center py-16">
      <p className="text-slate-500 font-medium">Game not found.</p>
      <Button className="mt-4 min-h-[48px] rounded-2xl" onClick={() => navigate('/child/games')}>
        Back to Games
      </Button>
    </div>
  )
}
