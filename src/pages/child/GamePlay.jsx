import { useState, useEffect, useRef, useMemo } from 'react'
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
import { gameSound } from '../../services/gameSoundService'
import { ChevronLeft, Lightbulb, RotateCcw, Volume2 } from 'lucide-react'
import { HelpButton } from '../../components/child/HelpButton'
import {
  loadWordTrainCheckpoint,
  loadWordTrainCheckpointData,
  saveWordTrainCheckpoint,
  resetWordTrainCheckpoint,
} from '../../games/word-train/engine/wordTrainCheckpoint'
import {
  loadSoundHuntCheckpoint,
  loadSoundHuntCheckpointData,
  saveSoundHuntCheckpoint,
  resetSoundHuntCheckpoint,
} from '../../games/sound-hunt/engine/soundHuntCheckpoint'
import {
  loadCosmicSafariCheckpoint,
  loadCosmicSafariCheckpointData,
  saveCosmicSafariCheckpoint,
  resetCosmicSafariCheckpoint,
} from '../../games/cosmic-safari/engine/cosmicSafariCheckpoint'
import {
  loadSoundSafariCheckpoint,
  loadSoundSafariCheckpointData,
  saveSoundSafariCheckpoint,
  resetSoundSafariCheckpoint,
} from '../../games/sound-safari/engine/soundSafariCheckpoint'
import {
  loadSoundMatchCheckpoint,
  loadSoundMatchCheckpointData,
  saveSoundMatchCheckpoint,
  resetSoundMatchCheckpoint,
} from '../../games/sound-match/engine/soundMatchCheckpoint'
import {
  loadSoundRhythmCheckpoint,
  loadSoundRhythmCheckpointData,
  saveSoundRhythmCheckpoint,
  resetSoundRhythmCheckpoint,
} from '../../games/sound-rhythm/engine/soundRhythmCheckpoint'
import {
  SOUND_MATCH_STAGES,
  getSoundMatchMilestone,
  getSoundMatchStageBadge,
} from '../../games/sound-match/engine/soundMatchCurriculum'
import {
  SOUND_RHYTHM_STAGES,
  getSoundRhythmStageBadge,
  getSoundRhythmMilestone,
} from '../../games/sound-rhythm/engine/soundRhythmCurriculum'
import {
  loadLetterDetectiveCheckpoint,
  loadLetterDetectiveCheckpointData,
  saveLetterDetectiveCheckpoint,
  resetLetterDetectiveCheckpoint,
} from '../../games/letter-detective/engine/letterDetectiveCheckpoint'
import {
  LETTER_DETECTIVE_STAGES,
  getLetterDetectiveStageBadge,
  getLetterDetectiveMilestone,
} from '../../games/letter-detective/engine/letterDetectiveCurriculum'
import {
  loadMissingLetterCheckpoint,
  loadMissingLetterCheckpointData,
  saveMissingLetterCheckpoint,
  resetMissingLetterCheckpoint,
} from '../../games/missing-letter/engine/missingLetterCheckpoint'
import {
  MISSING_LETTER_STAGES,
  getMissingLetterStageBadge,
  getMissingLetterMilestone,
} from '../../games/missing-letter/engine/missingLetterCurriculum'
import {
  loadWordBuilderCheckpoint,
  loadWordBuilderCheckpointData,
  saveWordBuilderCheckpoint,
  resetWordBuilderCheckpoint,
} from '../../games/word-builder/engine/wordBuilderCheckpoint'
import {
  WORD_BUILDER_STAGES,
  getWordBuilderStageBadge,
  getWordBuilderMilestone,
} from '../../games/word-builder/engine/wordBuilderCurriculum'
import {
  loadPictureMatchCheckpoint,
  loadPictureMatchCheckpointData,
  savePictureMatchCheckpoint,
  resetPictureMatchCheckpoint,
} from '../../games/picture-match/engine/pictureMatchCheckpoint'
import {
  PICTURE_MATCH_STAGES,
  getPictureMatchStageBadge,
  getPictureMatchMilestone,
} from '../../games/picture-match/engine/pictureMatchCurriculum'
import {
  loadStoryPuzzleCheckpoint,
  loadStoryPuzzleCheckpointData,
  saveStoryPuzzleCheckpoint,
  resetStoryPuzzleCheckpoint,
} from '../../games/story-puzzle/engine/storyPuzzleCheckpoint'
import {
  STORY_PUZZLE_STAGES,
  getStoryPuzzleStageBadge,
  getStoryPuzzleMilestone,
} from '../../games/story-puzzle/engine/storyPuzzleCurriculum'
import SoundMatchRound from '../../games/sound-match/components/SoundMatchRound'
import SoundRhythmRound from '../../games/sound-rhythm/components/SoundRhythmRound'
import LetterDetectiveRound from '../../games/letter-detective/components/LetterDetectiveRound'
import MissingLetterRound from '../../games/missing-letter/components/MissingLetterRound'
import WordBuilderRound from '../../games/word-builder/components/WordBuilderRound'
import PictureMatchRound from '../../games/picture-match/components/PictureMatchRound'
import StoryPuzzleRound from '../../games/story-puzzle/components/StoryPuzzleRound'
import { SOUND_HUNT_STAGES } from '../../games/sound-hunt/engine/soundHuntCurriculum'
import { WORD_TRAIN_STATIONS } from '../../games/word-train/engine/wordTrainCurriculum'
import { COSMIC_SAFARI_STAGES, shuffleOptions } from '../../games/cosmic-safari/engine/cosmicSafariCurriculum'
import {
  SOUND_SAFARI_STAGES,
  shuffleSoundSafariOptions,
  getAnimalName,
} from '../../games/sound-safari/engine/soundSafariCurriculum'
import GameProgressionHub from '../../components/games/GameProgressionHub'

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
  const isWordTrain = resolvedGameId === 'word-train'
  const isSoundHunt = resolvedGameId === 'sound-hunt'
  const isCosmicSafari = resolvedGameId === 'cosmic-safari'
  const isSoundSafari = resolvedGameId === 'match-sound' || resolvedGameId === 'sound-safari'
  const isSoundMatch = resolvedGameId === 'sound-match'
  const isSoundRhythm = resolvedGameId === 'sound-rhythm'
  const isLetterDetective = resolvedGameId === 'find-sound' || resolvedGameId === 'letter-detective'
  const isMissingLetter = resolvedGameId === 'missing-letter'
  const isWordBuilder = resolvedGameId === 'build-word'
  const isPictureWord = resolvedGameId === 'picture-word'
  const isStoryPuzzle = resolvedGameId === 'story-puzzle'

  const [stage, setStage] = useState('intro') // intro | playing | finished
  const [roundIdx, setRoundIdx] = useState(() => {
    if (isWordTrain && rounds.length > 0) {
      return loadWordTrainCheckpoint(activeChild?.id, rounds.length)
    }
    if (isSoundHunt && rounds.length > 0) {
      return loadSoundHuntCheckpoint(activeChild?.id, rounds.length)
    }
    if (isCosmicSafari && rounds.length > 0) {
      return loadCosmicSafariCheckpoint(activeChild?.id, rounds.length)
    }
    if (isSoundSafari && rounds.length > 0) {
      return loadSoundSafariCheckpoint(activeChild?.id, rounds.length)
    }
    if (isSoundMatch && rounds.length > 0) {
      return loadSoundMatchCheckpoint(activeChild?.id, rounds.length)
    }
    if (isSoundRhythm && rounds.length > 0) {
      return loadSoundRhythmCheckpoint(activeChild?.id, rounds.length)
    }
    if (isLetterDetective && rounds.length > 0) {
      return loadLetterDetectiveCheckpoint(activeChild?.id, rounds.length)
    }
    if (isMissingLetter && rounds.length > 0) {
      return loadMissingLetterCheckpoint(activeChild?.id, rounds.length)
    }
    if (isWordBuilder && rounds.length > 0) {
      return loadWordBuilderCheckpoint(activeChild?.id, rounds.length)
    }
    if (isPictureWord && rounds.length > 0) {
      return loadPictureMatchCheckpoint(activeChild?.id, rounds.length)
    }
    if (isStoryPuzzle && rounds.length > 0) {
      return loadStoryPuzzleCheckpoint(activeChild?.id, rounds.length)
    }
    return 0
  })

  const [score, setScore] = useState(() => {
    if (isSoundHunt && rounds.length > 0) {
      return loadSoundHuntCheckpointData(activeChild?.id, rounds.length).score
    }
    if (isCosmicSafari && rounds.length > 0) {
      return loadCosmicSafariCheckpointData(activeChild?.id, rounds.length).score
    }
    if (isSoundSafari && rounds.length > 0) {
      return loadSoundSafariCheckpointData(activeChild?.id, rounds.length).score
    }
    if (isSoundMatch && rounds.length > 0) {
      return loadSoundMatchCheckpointData(activeChild?.id, rounds.length).score
    }
    if (isSoundRhythm && rounds.length > 0) {
      return loadSoundRhythmCheckpointData(activeChild?.id, rounds.length).score
    }
    if (isLetterDetective && rounds.length > 0) {
      return loadLetterDetectiveCheckpointData(activeChild?.id, rounds.length).score
    }
    if (isMissingLetter && rounds.length > 0) {
      return loadMissingLetterCheckpointData(activeChild?.id, rounds.length).score
    }
    if (isWordBuilder && rounds.length > 0) {
      return loadWordBuilderCheckpointData(activeChild?.id, rounds.length).score
    }
    if (isPictureWord && rounds.length > 0) {
      return loadPictureMatchCheckpointData(activeChild?.id, rounds.length).score
    }
    if (isStoryPuzzle && rounds.length > 0) {
      return loadStoryPuzzleCheckpointData(activeChild?.id, rounds.length).score
    }
    return 0
  })

  // Synchronize checkpoint on child switch or round list update
  useEffect(() => {
    if (isWordTrain && rounds.length > 0) {
      setRoundIdx(loadWordTrainCheckpoint(activeChild?.id, rounds.length))
    }
    if (isSoundHunt && rounds.length > 0) {
      const data = loadSoundHuntCheckpointData(activeChild?.id, rounds.length)
      setRoundIdx(data.roundIndex)
      setScore(data.score)
    }
    if (isCosmicSafari && rounds.length > 0) {
      const data = loadCosmicSafariCheckpointData(activeChild?.id, rounds.length)
      setRoundIdx(data.roundIndex)
      setScore(data.score)
    }
    if (isSoundSafari && rounds.length > 0) {
      const data = loadSoundSafariCheckpointData(activeChild?.id, rounds.length)
      setRoundIdx(data.roundIndex)
      setScore(data.score)
    }
    if (isSoundMatch && rounds.length > 0) {
      const data = loadSoundMatchCheckpointData(activeChild?.id, rounds.length)
      setRoundIdx(data.roundIndex)
      setScore(data.score)
    }
    if (isSoundRhythm && rounds.length > 0) {
      const data = loadSoundRhythmCheckpointData(activeChild?.id, rounds.length)
      setRoundIdx(data.roundIndex)
      setScore(data.score)
    }
    if (isLetterDetective && rounds.length > 0) {
      const data = loadLetterDetectiveCheckpointData(activeChild?.id, rounds.length)
      setRoundIdx(data.roundIndex)
      setScore(data.score)
    }
    if (isMissingLetter && rounds.length > 0) {
      const data = loadMissingLetterCheckpointData(activeChild?.id, rounds.length)
      setRoundIdx(data.roundIndex)
      setScore(data.score)
    }
    if (isWordBuilder && rounds.length > 0) {
      const data = loadWordBuilderCheckpointData(activeChild?.id, rounds.length)
      setRoundIdx(data.roundIndex)
      setScore(data.score)
    }
    if (isPictureWord && rounds.length > 0) {
      const data = loadPictureMatchCheckpointData(activeChild?.id, rounds.length)
      setRoundIdx(data.roundIndex)
      setScore(data.score)
    }
    if (isStoryPuzzle && rounds.length > 0) {
      const data = loadStoryPuzzleCheckpointData(activeChild?.id, rounds.length)
      setRoundIdx(data.roundIndex)
      setScore(data.score)
    }
  }, [activeChild?.id, isWordTrain, isSoundHunt, isCosmicSafari, isSoundSafari, isSoundMatch, isSoundRhythm, isLetterDetective, isMissingLetter, isWordBuilder, isPictureWord, isStoryPuzzle, rounds.length])
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong' | null
  const [builtWord, setBuiltWord] = useState([])
  const [selectedWords, setSelectedWords] = useState([])
  const [showHint, setShowHint] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showStageRoadmap, setShowStageRoadmap] = useState(false)

  const checkpointData = isSoundHunt && rounds.length > 0
    ? loadSoundHuntCheckpointData(activeChild?.id, rounds.length)
    : isWordTrain && rounds.length > 0
    ? loadWordTrainCheckpointData(activeChild?.id, rounds.length)
    : isCosmicSafari && rounds.length > 0
    ? loadCosmicSafariCheckpointData(activeChild?.id, rounds.length)
    : isSoundSafari && rounds.length > 0
    ? loadSoundSafariCheckpointData(activeChild?.id, rounds.length)
    : isSoundMatch && rounds.length > 0
    ? loadSoundMatchCheckpointData(activeChild?.id, rounds.length)
    : isSoundRhythm && rounds.length > 0
    ? loadSoundRhythmCheckpointData(activeChild?.id, rounds.length)
    : isLetterDetective && rounds.length > 0
    ? loadLetterDetectiveCheckpointData(activeChild?.id, rounds.length)
    : isMissingLetter && rounds.length > 0
    ? loadMissingLetterCheckpointData(activeChild?.id, rounds.length)
    : isWordBuilder && rounds.length > 0
    ? loadWordBuilderCheckpointData(activeChild?.id, rounds.length)
    : isPictureWord && rounds.length > 0
    ? loadPictureMatchCheckpointData(activeChild?.id, rounds.length)
    : isStoryPuzzle && rounds.length > 0
    ? loadStoryPuzzleCheckpointData(activeChild?.id, rounds.length)
    : null
  const highestUnlockedLevel = checkpointData?.highestUnlockedLevel || Math.max(1, roundIdx + 1)

  // Synchronous guard against rapid round transitions, duplicate saves, and unmount timer safety
  const roundTransitionRef = useRef(false)
  const isSavedRef = useRef(false)
  const transitionTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

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
  const completedCount = Math.max(0, Math.min(total, roundIdx))
  const progressPercent = total > 0 ? Math.min(100, Math.max(0, Math.round((completedCount / total) * 100))) : 0
  const levelLabel = total > 5 ? `Level ${roundIdx + 1} of ${total}` : `Round ${roundIdx + 1} of ${total}`

  const finishGame = async (finalScore) => {
    if (saving || isSavedRef.current) return
    isSavedRef.current = true
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
        isSavedRef.current = false
        setSaveError(err.message || 'Could not save game results.')
      } finally {
        setSaving(false)
      }
    } else {
      applySessionOutcome(outcome)
    }
  }

  const nextRound = (wasCorrect) => {
    if (roundTransitionRef.current) return
    roundTransitionRef.current = true

    // Check if this level was already completed previously to prevent duplicate score
    let isReplay = false
    if (isSoundMatch && activeChild?.id) {
      const cpData = loadSoundMatchCheckpointData(activeChild?.id, total)
      if (Array.isArray(cpData.completedLevels) && cpData.completedLevels.includes(roundIdx + 1)) {
        isReplay = true
      }
    }
    if (isSoundRhythm) {
      const cpData = loadSoundRhythmCheckpointData(activeChild?.id, total)
      if (Array.isArray(cpData.completedLevels) && cpData.completedLevels.includes(roundIdx + 1)) {
        isReplay = true
      }
    }
    if (isLetterDetective) {
      const cpData = loadLetterDetectiveCheckpointData(activeChild?.id, total)
      if (Array.isArray(cpData.completedLevels) && cpData.completedLevels.includes(roundIdx + 1)) {
        isReplay = true
      }
    }
    if (isMissingLetter) {
      const cpData = loadMissingLetterCheckpointData(activeChild?.id, total)
      if (Array.isArray(cpData.completedLevels) && cpData.completedLevels.includes(roundIdx + 1)) {
        isReplay = true
      }
    }
    if (isWordBuilder) {
      const cpData = loadWordBuilderCheckpointData(activeChild?.id, total)
      if (Array.isArray(cpData.completedLevels) && cpData.completedLevels.includes(roundIdx + 1)) {
        isReplay = true
      }
    }
    if (isPictureWord) {
      const cpData = loadPictureMatchCheckpointData(activeChild?.id, total)
      if (Array.isArray(cpData.completedLevels) && cpData.completedLevels.includes(roundIdx + 1)) {
        isReplay = true
      }
    }
    if (isStoryPuzzle && activeChild?.id) {
      const cpData = loadStoryPuzzleCheckpointData(activeChild?.id, total)
      if (Array.isArray(cpData.completedLevels) && cpData.completedLevels.includes(roundIdx + 1)) {
        isReplay = true
      }
    }

    const newScore = score + (wasCorrect && !isReplay ? 1 : 0)
    setScore(newScore)

    const isStageBoundary = (isSoundMatch || isSoundRhythm || isLetterDetective || isMissingLetter || isWordBuilder || isPictureWord)
      ? wasCorrect && (roundIdx + 1) % 10 === 0 && roundIdx + 1 < total
      : (isSoundHunt || isCosmicSafari || isSoundSafari || isStoryPuzzle) && wasCorrect && (roundIdx + 1) % 5 === 0 && roundIdx + 1 < total

    const isMilestone = (isSoundMatch || isSoundRhythm || isLetterDetective || isMissingLetter || isWordBuilder || isPictureWord) && wasCorrect && (roundIdx + 1) % 5 === 0 && (roundIdx + 1) % 10 !== 0 && roundIdx + 1 < total

    setFeedback(isStageBoundary ? 'stage-clear' : isMilestone ? 'milestone-reward' : wasCorrect ? 'correct' : 'wrong')

    if (wasCorrect && isWordTrain && total > 0) {
      const nextCheckpointIndex = Math.min(roundIdx + 1, total - 1)
      saveWordTrainCheckpoint(activeChild?.id, nextCheckpointIndex, total)
    }

    if (isSoundHunt && total > 0) {
      const nextCheckpointIndex = Math.min(roundIdx + 1, total - 1)
      saveSoundHuntCheckpoint(activeChild?.id, {
        roundIndex: nextCheckpointIndex,
        score: newScore,
        isCompleted: roundIdx + 1 >= total,
      }, total)
    }

    if (isCosmicSafari && total > 0) {
      const nextCheckpointIndex = Math.min(roundIdx + 1, total - 1)
      saveCosmicSafariCheckpoint(activeChild?.id, {
        roundIndex: nextCheckpointIndex,
        score: newScore,
        isCompleted: roundIdx + 1 >= total,
      }, total)
    }

    if (isSoundSafari && total > 0) {
      const nextCheckpointIndex = Math.min(roundIdx + 1, total - 1)
      saveSoundSafariCheckpoint(activeChild?.id, {
        roundIndex: nextCheckpointIndex,
        score: newScore,
        isCompleted: roundIdx + 1 >= total,
      }, total)
    }

    if (isSoundMatch && total > 0) {
      const nextCheckpointIndex = Math.min(roundIdx + 1, total - 1)
      saveSoundMatchCheckpoint(activeChild?.id, {
        roundIndex: nextCheckpointIndex,
        completedLevel: wasCorrect ? roundIdx + 1 : undefined,
        score: newScore,
        isCompleted: roundIdx + 1 >= total,
      }, total)
    }

    if (isSoundRhythm && total > 0) {
      const nextCheckpointIndex = Math.min(roundIdx + 1, total - 1)
      saveSoundRhythmCheckpoint(activeChild?.id, {
        roundIndex: nextCheckpointIndex,
        completedLevel: wasCorrect ? roundIdx + 1 : undefined,
        score: newScore,
        isCompleted: roundIdx + 1 >= total,
      }, total)
    }

    if (isLetterDetective && total > 0) {
      const nextCheckpointIndex = Math.min(roundIdx + 1, total - 1)
      saveLetterDetectiveCheckpoint(activeChild?.id, {
        roundIndex: nextCheckpointIndex,
        completedLevel: wasCorrect ? roundIdx + 1 : undefined,
        score: newScore,
        isCompleted: roundIdx + 1 >= total,
      }, total)
    }

    if (isMissingLetter && total > 0) {
      const nextCheckpointIndex = Math.min(roundIdx + 1, total - 1)
      saveMissingLetterCheckpoint(activeChild?.id, {
        roundIndex: nextCheckpointIndex,
        completedLevel: wasCorrect ? roundIdx + 1 : undefined,
        score: newScore,
        isCompleted: roundIdx + 1 >= total,
      }, total)
    }

    if (isWordBuilder && total > 0) {
      const nextCheckpointIndex = Math.min(roundIdx + 1, total - 1)
      saveWordBuilderCheckpoint(activeChild?.id, {
        roundIndex: nextCheckpointIndex,
        completedLevel: wasCorrect ? roundIdx + 1 : undefined,
        score: newScore,
        isCompleted: roundIdx + 1 >= total,
      }, total)
    }

    if (isPictureWord && total > 0) {
      const nextCheckpointIndex = Math.min(roundIdx + 1, total - 1)
      savePictureMatchCheckpoint(activeChild?.id, {
        roundIndex: nextCheckpointIndex,
        completedLevel: wasCorrect ? roundIdx + 1 : undefined,
        score: newScore,
        isCompleted: roundIdx + 1 >= total,
      }, total)
    }

    if (isStoryPuzzle && total > 0) {
      const nextCheckpointIndex = wasCorrect
        ? Math.min(roundIdx + 1, total - 1)
        : roundIdx
      saveStoryPuzzleCheckpoint(activeChild?.id, {
        roundIndex: nextCheckpointIndex,
        completedLevel: wasCorrect ? roundIdx + 1 : undefined,
        score: newScore,
        isCompleted: wasCorrect && roundIdx + 1 >= total,
      }, total)
    }

    try {
      if (wasCorrect) {
        audioAtmosphere?.playSuccess?.()
      } else {
        audioAtmosphere?.playRetry?.()
      }
    } catch {}
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
    }
    transitionTimerRef.current = setTimeout(() => {
      roundTransitionRef.current = false
      setFeedback(null)
      setBuiltWord([])
      setSelectedWords([])
      setShowHint(false)
      if (isWordTrain || isStoryPuzzle) {
        if (wasCorrect) {
          if (roundIdx + 1 >= total) {
            finishGame(newScore)
          } else {
            setRoundIdx((i) => i + 1)
          }
        }
        // In Word Train and Story Puzzle, incorrect answer keeps current level so child can try again
      } else {
        if (roundIdx + 1 >= total) {
          if (isSoundHunt) {
            saveSoundHuntCheckpoint(activeChild?.id, { isCompleted: true, score: newScore }, total)
          }
          if (isCosmicSafari) {
            saveCosmicSafariCheckpoint(activeChild?.id, { isCompleted: true, score: newScore }, total)
          }
          if (isSoundSafari) {
            saveSoundSafariCheckpoint(activeChild?.id, { isCompleted: true, score: newScore }, total)
          }
          if (isSoundMatch) {
            saveSoundMatchCheckpoint(activeChild?.id, { isCompleted: true, score: newScore }, total)
          }
          if (isSoundRhythm) {
            saveSoundRhythmCheckpoint(activeChild?.id, { isCompleted: true, score: newScore }, total)
          }
          if (isLetterDetective) {
            saveLetterDetectiveCheckpoint(activeChild?.id, { isCompleted: true, score: newScore }, total)
          }
          if (isMissingLetter) {
            saveMissingLetterCheckpoint(activeChild?.id, { isCompleted: true, score: newScore }, total)
          }
          if (isWordBuilder) {
            saveWordBuilderCheckpoint(activeChild?.id, { isCompleted: true, score: newScore }, total)
          }
          if (isPictureWord) {
            savePictureMatchCheckpoint(activeChild?.id, { isCompleted: true, score: newScore }, total)
          }
          if (isStoryPuzzle) {
            saveStoryPuzzleCheckpoint(activeChild?.id, { isCompleted: true, score: newScore }, total)
          }
          finishGame(newScore)
        } else {
          setRoundIdx((i) => i + 1)
        }
      }
    }, 900)
  }

  const restart = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
    }
    roundTransitionRef.current = false
    isSavedRef.current = false
    setStage('intro')
    setRoundIdx(0)
    setScore(0)
    setFeedback(null)
    setBuiltWord([])
    setSelectedWords([])
    setShowHint(false)
    setSaveError(null)
    setSaving(false)
    if (isWordTrain && total > 0) {
      resetWordTrainCheckpoint(activeChild?.id, total)
    }
    if (isSoundHunt && total > 0) {
      resetSoundHuntCheckpoint(activeChild?.id)
    }
    if (isCosmicSafari && total > 0) {
      resetCosmicSafariCheckpoint(activeChild?.id)
    }
    if (isSoundSafari && total > 0) {
      resetSoundSafariCheckpoint(activeChild?.id)
    }
    if (isSoundMatch && total > 0) {
      resetSoundMatchCheckpoint(activeChild?.id)
    }
    if (isSoundRhythm && total > 0) {
      resetSoundRhythmCheckpoint(activeChild?.id)
    }
    if (isLetterDetective && total > 0) {
      resetLetterDetectiveCheckpoint(activeChild?.id)
    }
    if (isMissingLetter && total > 0) {
      resetMissingLetterCheckpoint(activeChild?.id)
    }
    if (isWordBuilder && total > 0) {
      resetWordBuilderCheckpoint(activeChild?.id)
    }
    if (isPictureWord && total > 0) {
      resetPictureMatchCheckpoint(activeChild?.id)
    }
    if (isStoryPuzzle && total > 0) {
      resetStoryPuzzleCheckpoint(activeChild?.id)
    }
  }

  const handleSelectStage = ({ startLevelIndex }) => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
    }
    roundTransitionRef.current = false
    const targetIndex = Math.min(Math.max(0, startLevelIndex), Math.max(0, total - 1))
    setRoundIdx(targetIndex)
    setFeedback(null)
    setBuiltWord([])
    setSelectedWords([])
    setShowHint(false)
    if (isWordTrain && total > 0) {
      saveWordTrainCheckpoint(activeChild?.id, targetIndex, total)
    } else if (isSoundHunt && total > 0) {
      saveSoundHuntCheckpoint(
        activeChild?.id,
        { roundIndex: targetIndex, score: Math.min(score, targetIndex) },
        total
      )
    } else if (isCosmicSafari && total > 0) {
      saveCosmicSafariCheckpoint(
        activeChild?.id,
        { roundIndex: targetIndex, score: Math.min(score, targetIndex) },
        total
      )
    } else if (isSoundSafari && total > 0) {
      saveSoundSafariCheckpoint(
        activeChild?.id,
        { roundIndex: targetIndex, score: Math.min(score, targetIndex) },
        total
      )
    } else if (isSoundMatch && total > 0) {
      saveSoundMatchCheckpoint(
        activeChild?.id,
        { roundIndex: targetIndex, score: Math.min(score, targetIndex) },
        total
      )
    } else if (isSoundRhythm && total > 0) {
      saveSoundRhythmCheckpoint(
        activeChild?.id,
        { roundIndex: targetIndex, score: Math.min(score, targetIndex) },
        total
      )
    } else if (isLetterDetective && total > 0) {
      saveLetterDetectiveCheckpoint(
        activeChild?.id,
        { roundIndex: targetIndex, score: Math.min(score, targetIndex) },
        total
      )
    } else if (isMissingLetter && total > 0) {
      saveMissingLetterCheckpoint(
        activeChild?.id,
        { roundIndex: targetIndex, score: Math.min(score, targetIndex) },
        total
      )
    } else if (isWordBuilder && total > 0) {
      saveWordBuilderCheckpoint(
        activeChild?.id,
        { roundIndex: targetIndex, score: Math.min(score, targetIndex) },
        total
      )
    } else if (isPictureWord && total > 0) {
      savePictureMatchCheckpoint(
        activeChild?.id,
        { roundIndex: targetIndex, score: Math.min(score, targetIndex) },
        total
      )
    } else if (isStoryPuzzle && total > 0) {
      saveStoryPuzzleCheckpoint(
        activeChild?.id,
        { roundIndex: targetIndex, score: Math.min(score, targetIndex) },
        total
      )
    }
    setShowStageRoadmap(false)
    setStage('playing')
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
        <div className="flex items-center gap-2">
          {stage === 'playing' && (isSoundHunt || isWordTrain || isCosmicSafari || isSoundSafari || isSoundMatch || isSoundRhythm || isLetterDetective || isMissingLetter || isWordBuilder || isPictureWord || isStoryPuzzle) && (
            <button
              type="button"
              onClick={() => setShowStageRoadmap(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D7EEF1] hover:border-[#13CFE3] text-[#08233A] font-display font-extrabold text-xs shadow-xs transition-all cursor-pointer hover:bg-[#F2FCFD]"
              data-testid="in-game-stages-button"
            >
              <span>🗺️</span>
              <span>Stages</span>
            </button>
          )}
          <VoiceModeIndicator />
        </div>
      </div>

      {stage === 'intro' && (
        <GameProgressionHub
          gameTitle={game.title}
          gameIcon={game.icon}
          gameBadge={isSoundHunt ? '🚀 Space Sound Mission' : isCosmicSafari ? '🛸 Cosmic Safari' : isSoundSafari ? '🦁 Sound Safari' : isSoundMatch ? '🎧 Sound Match' : isSoundRhythm ? '🥁 Sound & Rhythm' : isLetterDetective ? '🔍 Letter Detective' : isMissingLetter ? '🧩 Missing Letter' : isWordBuilder ? '🧱 Word Builder' : isPictureWord ? '📸 Picture Match' : isStoryPuzzle ? '🧩 Story Puzzle' : null}
          gameBadgeTestId={isSoundHunt ? 'space-sound-mission-badge' : isCosmicSafari ? 'cosmic-safari-badge' : isSoundSafari ? 'sound-safari-badge' : isSoundMatch ? 'sound-match-badge' : isSoundRhythm ? 'sound-rhythm-badge' : isLetterDetective ? 'letter-detective-badge' : isMissingLetter ? 'missing-letter-badge' : isWordBuilder ? 'word-builder-badge' : isPictureWord ? 'picture-match-badge' : isStoryPuzzle ? 'story-puzzle-badge' : undefined}
          instructions={instructionsFor(gameId)}
          stages={isSoundHunt ? SOUND_HUNT_STAGES : isWordTrain ? WORD_TRAIN_STATIONS : isCosmicSafari ? COSMIC_SAFARI_STAGES : isSoundSafari ? SOUND_SAFARI_STAGES : isSoundMatch ? SOUND_MATCH_STAGES : isSoundRhythm ? SOUND_RHYTHM_STAGES : isLetterDetective ? LETTER_DETECTIVE_STAGES : isMissingLetter ? MISSING_LETTER_STAGES : isWordBuilder ? WORD_BUILDER_STAGES : isPictureWord ? PICTURE_MATCH_STAGES : isStoryPuzzle ? STORY_PUZZLE_STAGES : []}
          currentLevel={roundIdx + 1}
          highestUnlockedLevel={highestUnlockedLevel}
          hasSavedProgress={(isWordTrain || isSoundHunt || isCosmicSafari || isSoundSafari || isSoundMatch || isSoundRhythm || isLetterDetective || isMissingLetter || isWordBuilder || isPictureWord || isStoryPuzzle) && roundIdx > 0}
          theme={theme}
          onStart={() => setStage('playing')}
          onResume={() => setStage('playing')}
          onSelectStage={handleSelectStage}
          onRestart={restart}
        />
      )}

      {showStageRoadmap && (
        <GameProgressionHub
          mode="modal"
          initialView="stages"
          gameTitle={game.title}
          gameIcon={game.icon}
          stages={isSoundHunt ? SOUND_HUNT_STAGES : isWordTrain ? WORD_TRAIN_STATIONS : isCosmicSafari ? COSMIC_SAFARI_STAGES : isSoundSafari ? SOUND_SAFARI_STAGES : isSoundMatch ? SOUND_MATCH_STAGES : isSoundRhythm ? SOUND_RHYTHM_STAGES : isLetterDetective ? LETTER_DETECTIVE_STAGES : isMissingLetter ? MISSING_LETTER_STAGES : isWordBuilder ? WORD_BUILDER_STAGES : isPictureWord ? PICTURE_MATCH_STAGES : isStoryPuzzle ? STORY_PUZZLE_STAGES : []}
          currentLevel={roundIdx + 1}
          highestUnlockedLevel={highestUnlockedLevel}
          hasSavedProgress={(isWordTrain || isSoundHunt || isCosmicSafari || isSoundSafari || isSoundMatch || isSoundRhythm || isLetterDetective || isMissingLetter || isWordBuilder || isPictureWord || isStoryPuzzle) && roundIdx > 0}
          theme={theme}
          onSelectStage={handleSelectStage}
          onRestart={restart}
          onClose={() => setShowStageRoadmap(false)}
        />
      )}

      {stage === 'playing' && round && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#527080]" data-testid="round-progress-label">
              {levelLabel}
            </span>
            {total <= 5 ? (
              <span className="text-sm font-bold flex gap-1" data-testid="score-star-row">
                {Array.from({ length: total }).map((_, i) => (
                  <span key={i} className={i < score ? 'text-[#FFC857]' : 'text-slate-300'}>
                    {i < score ? '⭐' : '☆'}
                  </span>
                ))}
              </span>
            ) : (
              <span
                className="text-xs sm:text-sm font-black text-[#08233A] bg-[#FFF9E6] border border-[#FFE8A3] px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1.5"
                data-testid="compact-score-display"
                aria-label={`Score: ${score} of ${total}`}
              >
                <span className="text-[#FFC857]">⭐</span>
                <span>{score} / {total}</span>
              </span>
            )}
          </div>
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={levelLabel}
            data-testid="gameplay-progress-bar-container"
            className="w-full"
          >
            <ProgressBar value={progressPercent} colorHex={theme.primaryColor || "#13CFE3"} />
          </div>
          
          <Card className="mt-4 text-center relative min-h-[280px] flex flex-col items-center justify-center p-6 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white">
            {feedback && (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-2xl sm:text-3xl font-display font-black rounded-3xl z-20 transition-all ${
                  feedback === 'stage-clear'
                    ? 'bg-[#E6F8FA]/98 text-[#0899AA] border-2 border-[#13CFE3] shadow-lg animate-pop'
                    : feedback === 'milestone-reward'
                    ? 'bg-[#FFF9E6]/98 text-[#B87D00] border-2 border-[#FFC857] shadow-lg animate-pop'
                    : feedback === 'correct'
                    ? 'bg-[#E6F8FA]/95 text-[#0899AA] border-2 border-[#13CFE3] shadow-lg'
                    : 'bg-[#FFF9E6]/95 text-[#B87D00] border-2 border-[#FFC857] shadow-lg'
                }`}
                data-testid="feedback-overlay"
              >
                {feedback === 'stage-clear' ? (
                  <>
                    <div className="text-4xl mb-1 select-none animate-bounce">
                      {isSoundMatch
                        ? (getSoundMatchStageBadge(Math.floor(roundIdx / 10) + 1)?.icon || '🏅')
                        : isSoundRhythm
                        ? (getSoundRhythmStageBadge(Math.floor(roundIdx / 10) + 1)?.icon || '🥁')
                        : isLetterDetective
                        ? (getLetterDetectiveStageBadge(Math.floor(roundIdx / 10) + 1)?.icon || '🔍')
                        : isMissingLetter
                        ? (MISSING_LETTER_STAGES.find((s) => s.stage === Math.floor(roundIdx / 10) + 1)?.icon || '🧩')
                        : isWordBuilder
                        ? (getWordBuilderStageBadge(Math.floor(roundIdx / 10) + 1)?.icon || '🧱')
                        : isPictureWord
                        ? (getPictureMatchStageBadge(Math.floor(roundIdx / 10) + 1)?.icon || '📸')
                        : isStoryPuzzle
                        ? (getStoryPuzzleStageBadge(Math.floor(roundIdx / 5) + 1)?.icon || '📖')
                        : '🚀'} ⭐ 🪐
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#08233A]">
                      Stage {Math.floor(roundIdx / ((isSoundMatch || isSoundRhythm || isLetterDetective || isMissingLetter || isWordBuilder || isPictureWord) ? 10 : 5)) + 1} Cleared!
                    </div>
                    {(isSoundMatch || isSoundRhythm || isLetterDetective || isMissingLetter || isWordBuilder || isPictureWord || isStoryPuzzle) && (
                      <div
                        className="text-xs sm:text-sm font-extrabold text-[#0899AA] mt-1 bg-white/80 px-3 py-1 rounded-full border border-[#13CFE3]/40"
                        data-testid="stage-badge-earned"
                      >
                        🏅 Stage Badge Earned: {isSoundMatch
                          ? (getSoundMatchStageBadge(Math.floor(roundIdx / 10) + 1)?.name || 'Stage Champion')
                          : isSoundRhythm
                          ? (getSoundRhythmStageBadge(Math.floor(roundIdx / 10) + 1)?.name || 'Stage Champion')
                          : isLetterDetective
                          ? (getLetterDetectiveStageBadge(Math.floor(roundIdx / 10) + 1)?.name || 'Stage Champion')
                          : isMissingLetter
                          ? getMissingLetterStageBadge(Math.floor(roundIdx / 10) + 1)
                          : isWordBuilder
                          ? (getWordBuilderStageBadge(Math.floor(roundIdx / 10) + 1)?.name || 'Stage Champion')
                          : isPictureWord
                          ? (getPictureMatchStageBadge(Math.floor(roundIdx / 10) + 1)?.title || 'Stage Champion')
                          : isStoryPuzzle
                          ? (getStoryPuzzleStageBadge(Math.floor(roundIdx / 5) + 1)?.name || 'Story Champion')
                          : 'Stage Champion'}
                      </div>
                    )}
                    <div className="text-xs sm:text-sm font-bold text-[#0899AA] mt-1">
                      Advancing to Stage {Math.floor(roundIdx / ((isSoundMatch || isSoundRhythm || isLetterDetective || isMissingLetter || isWordBuilder || isPictureWord) ? 10 : 5)) + 2}…
                    </div>
                  </>
                ) : feedback === 'milestone-reward' ? (
                  <>
                    <div className="text-4xl mb-1 select-none animate-pulse">
                      {isSoundMatch
                        ? (getSoundMatchMilestone(roundIdx + 1)?.icon || '🌟')
                        : isSoundRhythm
                        ? (getSoundRhythmMilestone(roundIdx + 1)?.icon || '🌟')
                        : isLetterDetective
                        ? (getLetterDetectiveMilestone(roundIdx + 1)?.icon || '⭐')
                        : isMissingLetter
                        ? (getMissingLetterMilestone(roundIdx + 1)?.icon || '🧩')
                        : isWordBuilder
                        ? (getWordBuilderMilestone(roundIdx + 1)?.icon || '⭐')
                        : isPictureWord
                        ? (getPictureMatchMilestone(roundIdx + 1)?.icon || '⭐')
                        : '🌟'}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#08233A]">
                      Milestone Reached!
                    </div>
                    <div
                      className="text-xs sm:text-sm font-extrabold text-amber-900 mt-1 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300"
                      data-testid="milestone-badge-earned"
                    >
                      🌟 Reward Unlocked: {isSoundMatch
                        ? (getSoundMatchMilestone(roundIdx + 1)?.name || 'Milestone Charm')
                        : isSoundRhythm
                        ? (getSoundRhythmMilestone(roundIdx + 1)?.name || 'Milestone Charm')
                        : isLetterDetective
                        ? (getLetterDetectiveMilestone(roundIdx + 1)?.name || 'Detective Charm')
                        : isMissingLetter
                        ? (getMissingLetterMilestone(roundIdx + 1)?.name || 'Word Builder Charm')
                        : isWordBuilder
                        ? (getWordBuilderMilestone(roundIdx + 1)?.name || 'Word Builder Charm')
                        : isPictureWord
                        ? (getPictureMatchMilestone(roundIdx + 1)?.name || 'Picture Charm')
                        : 'Milestone Charm'}
                    </div>
                    <div className="text-xs font-bold text-[#527080] mt-1">
                      Super listening! Keep going!
                    </div>
                  </>
                ) : feedback === 'correct' ? (
                  '🎉 Great job!'
                ) : (
                  "💪 Let's try again!"
                )}
              </div>
            )}
            <GameRound
              gameId={resolvedGameId}
              round={round}
              roundIdx={roundIdx}
              builtWord={builtWord}
              setBuiltWord={setBuiltWord}
              selectedWords={selectedWords}
              setSelectedWords={setSelectedWords}
              onAnswer={nextRound}
              language={language}
              theme={theme}
              isTransitioning={roundTransitionRef.current || feedback !== null}
              quietMode={quietMode}
            />
          </Card>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            {showHint ? (
              <p className="text-sm text-[#08233A] bg-[#FFF9E6] border border-[#FFE8A3] px-4 py-2 rounded-2xl font-bold animate-pop shadow-2xs">
                💡 {round?.hint || game.hint || 'Think about what happens first, next, and last!'}
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
              visualHint={round?.hint || game.hint || 'Think about what happens first, next, and last!'}
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
          {isSoundMatch && total === 100 ? (
            <div data-testid="sound-match-finale-banner" className="mb-4">
              <div className="text-6xl mb-2 select-none animate-bounce">🏆</div>
              <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                <span>🏆</span>
                <span>Grand 100-Level Sound Master!</span>
              </span>
            </div>
          ) : isSoundRhythm && total === 30 ? (
            <div data-testid="sound-rhythm-finale-banner" className="mb-4">
              <div className="text-6xl mb-2 select-none animate-bounce">🏆</div>
              <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                <span>🥁</span>
                <span>Grand 30-Level Rhythm Maestro!</span>
              </span>
            </div>
          ) : isMissingLetter && total === 30 ? (
            <div data-testid="missing-letter-finale-banner" className="mb-4">
              <div className="text-6xl mb-2 select-none animate-bounce">🏆</div>
              <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                <span>🧩</span>
                <span>Grand 30-Level Missing Letter Champion!</span>
              </span>
            </div>
          ) : isWordBuilder && total === 30 ? (
            <div data-testid="word-builder-finale-banner" className="mb-4">
              <div className="text-6xl mb-2 select-none animate-bounce">🏆</div>
              <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                <span>🧱</span>
                <span>Grand 30-Level Master Word Builder!</span>
              </span>
            </div>
          ) : isPictureWord && total === 30 ? (
            <div data-testid="picture-match-finale-banner" className="mb-4">
              <div className="text-6xl mb-2 select-none animate-bounce">🏆</div>
              <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                <span>📸</span>
                <span>Grand 30-Level Master Picture Reader!</span>
              </span>
            </div>
          ) : isStoryPuzzle && total === 15 ? (
            <div data-testid="story-puzzle-finale-banner" className="mb-4">
              <div className="text-6xl mb-2 select-none animate-bounce">🏆</div>
              <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                <span>📖</span>
                <span>Grand 15-Level Master Storyteller!</span>
              </span>
            </div>
          ) : (
            <div className="text-6xl mb-3 select-none">{theme.badgeIcon || '🏆'}</div>
          )}

          <h2 className="font-display font-black text-2xl text-[#08233A]">Nice work!</h2>
          <div className="text-xs font-black text-[#0899AA] uppercase tracking-wider mb-2 mt-1">
            {theme.mascot} cheers: "{theme.rewardTitle || 'Awesome Adventurer'}"! 🎉
          </div>

          {isSoundMatch && total === 100 ? (
            <p
              className="text-emerald-800 font-bold text-sm sm:text-base my-3 bg-emerald-50 border border-emerald-200 py-2.5 px-4 rounded-2xl shadow-2xs"
              data-testid="sound-match-completion-message"
            >
              🌟 Incredible! You have completed all 100 levels of Sound Match across all 10 stages!
            </p>
          ) : isSoundRhythm && total === 30 ? (
            <p
              className="text-emerald-800 font-bold text-sm sm:text-base my-3 bg-emerald-50 border border-emerald-200 py-2.5 px-4 rounded-2xl shadow-2xs"
              data-testid="sound-rhythm-completion-message"
            >
              🌟 Incredible! You have completed all 30 levels of Sound & Rhythm across all 3 stages!
            </p>
          ) : isMissingLetter && total === 30 ? (
            <p
              className="text-emerald-800 font-bold text-sm sm:text-base my-3 bg-emerald-50 border border-emerald-200 py-2.5 px-4 rounded-2xl shadow-2xs"
              data-testid="missing-letter-completion-message"
            >
              🌟 Incredible! You have completed all 30 levels of Missing Letter across all 3 stages!
            </p>
          ) : isWordBuilder && total === 30 ? (
            <p
              className="text-emerald-800 font-bold text-sm sm:text-base my-3 bg-emerald-50 border border-emerald-200 py-2.5 px-4 rounded-2xl shadow-2xs"
              data-testid="word-builder-completion-message"
            >
              🌟 Incredible! You have completed all 30 levels of Word Builder across all 3 stages!
            </p>
          ) : isPictureWord && total === 30 ? (
            <p
              className="text-emerald-800 font-bold text-sm sm:text-base my-3 bg-emerald-50 border border-emerald-200 py-2.5 px-4 rounded-2xl shadow-2xs"
              data-testid="picture-match-completion-message"
            >
              🌟 Incredible! You have completed all 30 levels of Picture Match across all 3 stages!
            </p>
          ) : isStoryPuzzle && total === 15 ? (
            <p
              className="text-emerald-800 font-bold text-sm sm:text-base my-3 bg-emerald-50 border border-emerald-200 py-2.5 px-4 rounded-2xl shadow-2xs"
              data-testid="story-puzzle-completion-message"
            >
              🌟 Incredible! You have completed all 15 levels of Story Puzzle across all 3 stages!
            </p>
          ) : null}

          <p className="text-slate-500 mt-1 font-medium text-sm">
            You got {score} out of {total} correct.
          </p>

          {isSoundMatch && total === 100 && (
            <div className="mt-4 p-4 rounded-2xl bg-[#E6F8FA]/60 border border-[#BCEBF2]" data-testid="sound-match-stage-badges-gallery">
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#0899AA] mb-2.5">
                🏅 All 10 Mastered Stage Badges Earned
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 justify-center">
                {SOUND_MATCH_STAGES.map((stg) => (
                  <div
                    key={`badge-${stg.stage}`}
                    className="p-2 rounded-xl bg-white border border-[#13CFE3]/40 flex flex-col items-center shadow-2xs"
                    title={`Stage ${stg.stage}: ${stg.title}`}
                    data-testid={`mastery-badge-stage-${stg.stage}`}
                  >
                    <span className="text-2xl">{stg.icon || '⭐'}</span>
                    <span className="text-[10px] font-black text-[#08233A] mt-0.5">S{stg.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSoundRhythm && total === 30 && (
            <div className="mt-4 p-4 rounded-2xl bg-[#E6F8FA]/60 border border-[#BCEBF2]" data-testid="sound-rhythm-stage-badges-gallery">
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#0899AA] mb-2.5">
                🏅 All 3 Mastered Rhythm Badges Earned
              </h3>
              <div className="grid grid-cols-3 gap-3 justify-center max-w-sm mx-auto">
                {SOUND_RHYTHM_STAGES.map((stg) => (
                  <div
                    key={`rhythm-badge-${stg.stage}`}
                    className="p-3 rounded-xl bg-white border border-[#13CFE3]/40 flex flex-col items-center shadow-2xs"
                    title={`Stage ${stg.stage}: ${stg.title}`}
                    data-testid={`rhythm-mastery-badge-stage-${stg.stage}`}
                  >
                    <span className="text-3xl">{stg.icon || '⭐'}</span>
                    <span className="text-xs font-black text-[#08233A] mt-1 text-center">{stg.title}</span>
                    <span className="text-[10px] font-bold text-[#0899AA]">Stage {stg.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isMissingLetter && total === 30 && (
            <div className="mt-4 p-4 rounded-2xl bg-[#E6F8FA]/60 border border-[#BCEBF2]" data-testid="missing-letter-stage-badges-gallery">
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#0899AA] mb-2.5">
                🏅 All 3 Mastered Word Stages Earned
              </h3>
              <div className="grid grid-cols-3 gap-3 justify-center max-w-sm mx-auto">
                {MISSING_LETTER_STAGES.map((stg) => (
                  <div
                    key={`missing-letter-badge-${stg.stage}`}
                    className="p-3 rounded-xl bg-white border border-[#13CFE3]/40 flex flex-col items-center shadow-2xs"
                    title={`Stage ${stg.stage}: ${stg.title}`}
                    data-testid={`missing-letter-mastery-badge-stage-${stg.stage}`}
                  >
                    <span className="text-3xl">{stg.icon || '🧩'}</span>
                    <span className="text-xs font-black text-[#08233A] mt-1 text-center">{stg.title}</span>
                    <span className="text-[10px] font-bold text-[#0899AA]">Stage {stg.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isWordBuilder && total === 30 && (
            <div className="mt-4 p-4 rounded-2xl bg-[#E6F8FA]/60 border border-[#BCEBF2]" data-testid="word-builder-stage-badges-gallery">
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#0899AA] mb-2.5">
                🏅 All 3 Mastered Word Stages Earned
              </h3>
              <div className="grid grid-cols-3 gap-3 justify-center max-w-sm mx-auto">
                {WORD_BUILDER_STAGES.map((stg) => (
                  <div
                    key={`word-builder-badge-${stg.stage}`}
                    className="p-3 rounded-xl bg-white border border-[#13CFE3]/40 flex flex-col items-center shadow-2xs"
                    title={`Stage ${stg.stage}: ${stg.title}`}
                    data-testid={`word-builder-mastery-badge-stage-${stg.stage}`}
                  >
                    <span className="text-3xl">{stg.icon || '🧱'}</span>
                    <span className="text-xs font-black text-[#08233A] mt-1 text-center">{stg.title}</span>
                    <span className="text-[10px] font-bold text-[#0899AA]">Stage {stg.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isPictureWord && total === 30 && (
            <div className="mt-4 p-4 rounded-2xl bg-[#E6F8FA]/60 border border-[#BCEBF2]" data-testid="picture-match-stage-badges-gallery">
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#0899AA] mb-2.5">
                🏅 All 3 Mastered Picture Stages Earned
              </h3>
              <div className="grid grid-cols-3 gap-3 justify-center max-w-sm mx-auto">
                {PICTURE_MATCH_STAGES.map((stg) => (
                  <div
                    key={`picture-match-badge-${stg.stage}`}
                    className="p-3 rounded-xl bg-white border border-[#13CFE3]/40 flex flex-col items-center shadow-2xs"
                    title={`Stage ${stg.stage}: ${stg.title}`}
                    data-testid={`picture-match-mastery-badge-stage-${stg.stage}`}
                  >
                    <span className="text-3xl">{stg.icon || '📸'}</span>
                    <span className="text-xs font-black text-[#08233A] mt-1 text-center">{stg.title}</span>
                    <span className="text-[10px] font-bold text-[#0899AA]">Stage {stg.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isStoryPuzzle && total === 15 && (
            <div className="mt-4 p-4 rounded-2xl bg-[#E6F8FA]/60 border border-[#BCEBF2]" data-testid="story-puzzle-stage-badges-gallery">
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#0899AA] mb-2.5">
                🏅 All 3 Mastered Story Stages Earned
              </h3>
              <div className="grid grid-cols-3 gap-3 justify-center max-w-sm mx-auto">
                {STORY_PUZZLE_STAGES.map((stg) => (
                  <div
                    key={`story-puzzle-badge-${stg.stage}`}
                    className="p-3 rounded-xl bg-white border border-[#13CFE3]/40 flex flex-col items-center shadow-2xs"
                    title={`Stage ${stg.stage}: ${stg.title}`}
                    data-testid={`story-puzzle-mastery-badge-stage-${stg.stage}`}
                  >
                    <span className="text-3xl">{stg.icon || '📖'}</span>
                    <span className="text-xs font-black text-[#08233A] mt-1 text-center">{stg.title}</span>
                    <span className="text-[10px] font-bold text-[#0899AA]">Stage {stg.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
    'cosmic-safari': 'Hear the sound, then tap the matching cosmic animal buddy!',
    'match-sound': 'Listen to the real animal sound, then tap the matching animal friend!',
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

/**
 * Word Train Round Component (Step 2 Implementation):
 * - Individual tile tracking by index (each scrambled letter button is tracked independently).
 * - Full support for duplicate letters (e.g. BELL, MOON, TREE, CLOCK, APPLE).
 * - Undo support via clicking any loaded train carriage or using the explicit "Undo Letter" button.
 * - Synchronous ref guards against rapid double-clicks and repeated submissions.
 * - Responsive carriage scaling and wrapping for words from 3 to 7 letters.
 */
function WordTrainRound({ round, builtWord, setBuiltWord, onAnswer }) {
  const target = round.word
  const [selectedTileIndices, setSelectedTileIndices] = useState([])
  const isAnswerSubmittedRef = useRef(false)

  // Reset local tile tracking whenever the round changes
  useEffect(() => {
    setSelectedTileIndices([])
    isAnswerSubmittedRef.current = false
  }, [round])

  // Synchronize tile tracking when builtWord is reset from parent (e.g. on retry or round restart)
  useEffect(() => {
    if (builtWord.length === 0) {
      setSelectedTileIndices([])
      isAnswerSubmittedRef.current = false
    }
  }, [builtWord.length])

  const handleLetter = (letter, tileIdx) => {
    if (isAnswerSubmittedRef.current) return
    if (selectedTileIndices.includes(tileIdx)) return
    if (builtWord.length >= target.length) return

    try {
      audioAtmosphere?.playChime?.(580 + selectedTileIndices.length * 50, 0.08)
    } catch {}

    const nextIndices = [...selectedTileIndices, tileIdx]
    setSelectedTileIndices(nextIndices)
    const nextLetters = nextIndices.map((i) => round.scrambled[i])
    setBuiltWord(nextLetters)

    if (nextLetters.length === target.length) {
      isAnswerSubmittedRef.current = true
      onAnswer(nextLetters.join('') === target)
    }
  }

  const handleUndo = (slotIdx) => {
    if (isAnswerSubmittedRef.current) return
    if (selectedTileIndices.length === 0) return

    const targetSlot = typeof slotIdx === 'number' ? slotIdx : selectedTileIndices.length - 1
    if (targetSlot < 0 || targetSlot >= selectedTileIndices.length) return

    try {
      audioAtmosphere?.playChime?.(440, 0.06)
    } catch {}

    const nextIndices = selectedTileIndices.filter((_, idx) => idx !== targetSlot)
    setSelectedTileIndices(nextIndices)
    const nextLetters = nextIndices.map((i) => round.scrambled[i])
    setBuiltWord(nextLetters)
  }

  const isLongWord = target.length > 5
  const slotSizeClass = isLongWord
    ? 'w-9 h-9 sm:w-11 sm:h-11 text-base sm:text-lg'
    : 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl'
  const engineSizeClass = isLongWord
    ? 'w-9 h-9 sm:w-11 sm:h-11 text-base sm:text-lg'
    : 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl'
  const tileBtnSizeClass = isLongWord
    ? 'w-10 h-10 sm:w-13 sm:h-13 text-lg sm:text-xl'
    : 'w-11 h-11 sm:w-14 sm:h-14 text-xl sm:text-2xl'

  return (
    <div className="text-center w-full max-w-lg mx-auto" data-testid="word-train-round">
      {/* Train Engine & Word Image Display */}
      <div className="flex items-center justify-center gap-2 mb-2 text-4xl select-none animate-float">
        <span>🚂</span>
        <span>{round.image}</span>
      </div>
      {round.stationName && (
        <div className="text-[10px] sm:text-xs font-bold text-[#0899AA] uppercase tracking-wider mb-1" data-testid="station-name-badge">
          {round.stationName}
        </div>
      )}
      <p className="text-xs text-[#527080] font-semibold mb-4">
        Load the train carriages to spell the word!
      </p>

      {/* Train Carriages Track (Responsive Slots with Undo on Tap) */}
      <div
        className="flex justify-center items-center gap-1.5 sm:gap-2 mb-4 flex-wrap max-w-full px-1"
        data-testid="train-carriages-track"
      >
        <div className={`${engineSizeClass} rounded-xl sm:rounded-2xl bg-[#08233A] text-white flex items-center justify-center font-black shadow-xs shrink-0 select-none`}>
          🚂
        </div>
        {target.split('').map((_, i) => (
          <button
            key={`slot-${i}`}
            type="button"
            onClick={() => handleUndo(i)}
            disabled={!builtWord[i] || isAnswerSubmittedRef.current}
            className={`${slotSizeClass} rounded-xl sm:rounded-2xl border-2 flex items-center justify-center font-display font-black transition-all shadow-2xs shrink-0 ${
              builtWord[i]
                ? 'bg-[#DDF9FC] border-[#13CFE3] text-[#08233A] hover:border-rose-400 hover:bg-rose-50 cursor-pointer active:scale-95'
                : 'bg-[#F2FBFC] border-[#BCEBF2] text-[#08233A]/40 cursor-default'
            }`}
            aria-label={builtWord[i] ? `Slot ${i + 1}: ${builtWord[i]}` : `Empty slot ${i + 1}`}
          >
            {builtWord[i] || '—'}
          </button>
        ))}
      </div>

      {/* Scrambled Carriage Tiles Dock */}
      <div
        className="flex gap-2 sm:gap-3 justify-center flex-wrap mb-4 max-w-full px-2"
        data-testid="scrambled-tiles-dock"
      >
        {round.scrambled.map((l, i) => {
          const isUsed = selectedTileIndices.includes(i)
          return (
            <button
              key={`carriage-${i}`}
              type="button"
              onClick={() => handleLetter(l, i)}
              disabled={isUsed || builtWord.length >= target.length || isAnswerSubmittedRef.current}
              className={`${tileBtnSizeClass} rounded-2xl font-display font-black transition-all shadow-xs select-none ${
                isUsed
                  ? 'bg-slate-100 border-2 border-slate-200 text-slate-300 opacity-40 cursor-not-allowed scale-95'
                  : 'bg-white hover:bg-[#E6F8FA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] text-[#08233A] hover:scale-105 active:scale-95 cursor-pointer'
              } disabled:opacity-40`}
              aria-label={`Carriage ${l}`}
            >
              {l}
            </button>
          )
        })}
      </div>

      {/* Action Row: Child-Friendly Undo Button */}
      <div className="flex justify-center items-center gap-2">
        <button
          type="button"
          onClick={() => handleUndo()}
          disabled={selectedTileIndices.length === 0 || isAnswerSubmittedRef.current}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-300 font-display font-bold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95 shadow-xs"
          aria-label="Undo letter"
          data-testid="undo-letter-button"
        >
          <RotateCcw size={14} className="text-slate-500" />
          <span>Undo Letter</span>
        </button>
      </div>
    </div>
  )
}

function SoundHuntRound({ round, onAnswer, isTransitioning }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const isSubmittedRef = useRef(false)
  const prevLevelRef = useRef(round?.level)

  // Synchronously reset submission lock whenever round level changes
  if (prevLevelRef.current !== round?.level) {
    prevLevelRef.current = round?.level
    isSubmittedRef.current = false
  }

  // Also reset local submission guard and audio state when round changes or transition ends
  useEffect(() => {
    isSubmittedRef.current = false
    setIsPlayingAudio(false)
  }, [round?.id, round?.level])

  useEffect(() => {
    if (!isTransitioning) {
      isSubmittedRef.current = false
    }
  }, [isTransitioning])

  const handlePlayAudio = () => {
    if (isPlayingAudio) return
    setIsPlayingAudio(true)

    try {
      audioAtmosphere?.playChime?.(540, 0.1)
    } catch {}

    const textToSpeak = `${round.soundSpoken || round.sound || round.letter}. ${round.prompt || ''}`

    try {
      gameSound?.speakCompanion?.(textToSpeak, {
        onEnd: () => setIsPlayingAudio(false),
      })
    } catch {}

    // Fallback timer to reset playing state smoothly in tests or unsupported environments
    setTimeout(() => {
      setIsPlayingAudio(false)
    }, 1200)
  }

  const handleSelectOption = (opt) => {
    if (isSubmittedRef.current || isTransitioning) return
    isSubmittedRef.current = true

    try {
      audioAtmosphere?.playChime?.(640, 0.08)
    } catch {}

    onAnswer(opt.emoji === round.correct)
  }

  const currentStage = SOUND_HUNT_STAGES.find((s) => s.stage === round?.stage) || SOUND_HUNT_STAGES[0]

  return (
    <div className="text-center w-full max-w-lg mx-auto" data-testid="sound-hunt-round">
      {/* 5-Stage Progression Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F8FA] border border-[#BCEBF2] text-[#0899AA] text-xs font-black uppercase tracking-wider shadow-2xs"
          data-testid="sound-hunt-stage-badge"
        >
          <span>{currentStage.badge || '🚀'}</span>
          <span>Stage {currentStage.stage} of 5: {currentStage.shortTitle}</span>
        </span>
        {round.missionStation && (
          <span
            className="text-[11px] font-bold text-[#527080] bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full"
            data-testid="sound-hunt-station-badge"
          >
            {round.missionStation}
          </span>
        )}
      </div>

      {/* 5-Stage Progression Indicators */}
      <div
        className="flex items-center justify-center gap-1.5 mb-3"
        data-testid="stage-progression-indicators"
        aria-label={`Stage ${currentStage.stage} of 5`}
      >
        {SOUND_HUNT_STAGES.map((s) => {
          const isCompleted = (round?.stage || 1) > s.stage
          const isCurrent = (round?.stage || 1) === s.stage
          return (
            <div
              key={s.stage}
              className={`h-2 rounded-full transition-all duration-300 ${
                isCurrent
                  ? 'w-7 bg-[#13CFE3] shadow-xs'
                  : isCompleted
                  ? 'w-4 bg-[#0899AA]'
                  : 'w-3 bg-slate-200'
              }`}
              title={s.title}
              data-testid={`stage-pip-${s.stage}`}
            />
          )
        })}
      </div>

      {/* Target Letter & Sound Badge with Accessible Audio Playback Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#DDF9FC] border border-[#BCEBF2] text-[#08233A] shadow-2xs">
          <span className="text-2xl">🔤</span>
          <span className="font-display font-black text-2xl text-[#0899AA]">{round.letter}</span>
          <span className="text-xs font-bold text-[#527080]">({round.sound})</span>
        </div>

        <button
          type="button"
          onClick={handlePlayAudio}
          disabled={isTransitioning}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-display font-extrabold text-xs transition-all border shadow-xs cursor-pointer select-none active:scale-95 ${
            isPlayingAudio
              ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] scale-105'
              : 'bg-white hover:bg-[#E6F8FA] text-[#08233A] border-[#D7EEF1] hover:border-[#13CFE3]'
          }`}
          aria-label={`Listen to sound ${round.letter}`}
          data-testid="sound-hunt-audio-btn"
        >
          <Volume2 size={16} className={isPlayingAudio ? 'animate-bounce text-[#08233A]' : 'text-[#0899AA]'} />
          <span>{isPlayingAudio ? 'Playing Sound…' : `Hear Sound (${round.sound})`}</span>
        </button>
      </div>

      <p className="font-display font-black text-lg text-[#08233A] mb-6">
        {round.prompt}
      </p>

      {/* Interactive 3-Option Picture Grid */}
      <div className="flex gap-4 justify-center flex-wrap" data-testid="sound-hunt-options-grid">
        {round.options.map((opt) => (
          <button
            key={opt.name}
            type="button"
            onClick={() => handleSelectOption(opt)}
            disabled={isSubmittedRef.current || isTransitioning}
            className="w-24 h-24 sm:w-28 sm:h-28 bg-[#F2FBFC] hover:bg-[#E6F8FA] rounded-3xl flex flex-col items-center justify-center p-2 transition-all border-2 border-[#D7EEF1] hover:border-[#13CFE3] shadow-xs hover:scale-105 active:scale-95 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
            aria-label={opt.name}
            data-testid={`option-${opt.name.toLowerCase()}`}
          >
            <span className="text-4xl sm:text-5xl select-none">{opt.emoji}</span>
            <span className="text-xs font-extrabold text-[#08233A] mt-1 truncate">{opt.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function CosmicSafariRound({ round, onAnswer, language, isTransitioning }) {
  const isSubmittedRef = useRef(false)
  const prevLevelRef = useRef(round?.level)
  const [selectedOptName, setSelectedOptName] = useState(null)

  // Synchronously reset submission lock whenever round level changes during render
  if (prevLevelRef.current !== round?.level) {
    prevLevelRef.current = round?.level
    isSubmittedRef.current = false
  }

  // Shuffle options across positions 1, 2, and 3; stay stable during re-renders of the same round
  const displayedOptions = useMemo(() => {
    if (round?.shuffledOptions && Array.isArray(round.shuffledOptions)) {
      return round.shuffledOptions
    }
    if (round?.disableShuffle) {
      return round?.options || []
    }
    return shuffleOptions(round?.options || [])
  }, [round?.id, round?.level, round?.options])

  // Reset local submission guard and selection state when round changes or transition ends
  useEffect(() => {
    isSubmittedRef.current = false
    setSelectedOptName(null)
  }, [round?.id, round?.level])

  useEffect(() => {
    if (!isTransitioning) {
      isSubmittedRef.current = false
      setSelectedOptName(null)
    }
  }, [isTransitioning])

  const handleSelectOption = (opt) => {
    if (isSubmittedRef.current || isTransitioning) return
    isSubmittedRef.current = true

    const optEmoji = typeof opt === 'object' ? opt.emoji : opt
    const optName = typeof opt === 'object' ? opt.name : (opt === round.correct ? round.label : opt)
    setSelectedOptName(optName || optEmoji)

    try {
      audioAtmosphere?.playChime?.(640, 0.08)
    } catch {}

    const isCorrect = optEmoji === round.correct || (typeof opt === 'object' && opt.name === round.correctName)
    onAnswer(isCorrect)
  }

  const currentStage = COSMIC_SAFARI_STAGES.find((s) => s.stage === round?.stage) || COSMIC_SAFARI_STAGES[0]

  return (
    <div className="text-center w-full max-w-lg mx-auto" data-testid="cosmic-safari-round">
      {/* 5-Stage Progression Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F8FA] border border-[#BCEBF2] text-[#0899AA] text-xs font-black uppercase tracking-wider shadow-2xs"
          data-testid="cosmic-safari-stage-badge"
        >
          <span>{currentStage.badge || '🛸'}</span>
          <span>Stage {currentStage.stage} of 5: {currentStage.shortTitle}</span>
        </span>
        {round.missionSector && (
          <span
            className="text-[11px] font-bold text-[#527080] bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full"
            data-testid="cosmic-safari-sector-badge"
          >
            {round.missionSector}
          </span>
        )}
      </div>

      {/* 5-Stage Progression Indicators */}
      <div
        className="flex items-center justify-center gap-1.5 mb-3"
        data-testid="stage-progression-indicators"
        aria-label={`Stage ${currentStage.stage} of 5`}
      >
        {COSMIC_SAFARI_STAGES.map((s) => {
          const isCompleted = (round?.stage || 1) > s.stage
          const isCurrent = (round?.stage || 1) === s.stage
          return (
            <div
              key={s.stage}
              className={`h-2 rounded-full transition-all duration-300 ${
                isCurrent
                  ? 'w-7 bg-[#13CFE3] shadow-xs'
                  : isCompleted
                  ? 'w-4 bg-[#0899AA]'
                  : 'w-3 bg-slate-200'
              }`}
              title={s.title}
              data-testid={`stage-pip-${s.stage}`}
            />
          )
        })}
      </div>

      {/* Audio Playback Component */}
      <div className="mb-4">
        <SoundSafariAudio sound={round.sound} label={round.label} language={language} />
      </div>

      {round.prompt && (
        <p className="font-display font-black text-lg text-[#08233A] mb-5">
          {round.prompt}
        </p>
      )}

      {/* Interactive 3-Option Picture Grid */}
      <div className="flex gap-4 justify-center flex-wrap" data-testid="cosmic-safari-options-grid">
        {displayedOptions.map((opt, optIndex) => {
          const optEmoji = typeof opt === 'object' ? opt.emoji : opt
          const optName = typeof opt === 'object' ? opt.name : (opt === round.correct ? round.label : opt)
          const isSelected = selectedOptName === (optName || optEmoji)
          return (
            <button
              key={optName || optEmoji}
              type="button"
              onClick={() => handleSelectOption(opt)}
              disabled={isSubmittedRef.current || isTransitioning}
              className={`w-20 h-20 sm:w-28 sm:h-28 rounded-3xl flex flex-col items-center justify-center p-2 transition-all border-2 shadow-xs cursor-pointer select-none touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/50 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-[#E6F8FA] border-[#13CFE3] ring-4 ring-[#13CFE3]/40 scale-95'
                  : 'bg-[#F2FBFC] hover:bg-[#E6F8FA] border-[#D7EEF1] hover:border-[#13CFE3] hover:scale-105 active:scale-95'
              } ${isTransitioning ? 'opacity-60 pointer-events-none' : ''}`}
              aria-label={optName || optEmoji}
              data-testid={`option-${(optName || optEmoji).toLowerCase()}`}
              data-option-index={optIndex}
            >
              <span className="text-4xl sm:text-5xl select-none">{optEmoji}</span>
              {optName && optName !== optEmoji && (
                <span className="text-xs font-extrabold text-[#08233A] mt-1 truncate">{optName}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SoundSafariRound({
  round,
  roundIdx,
  onAnswer,
  language,
  theme,
  isTransitioning,
}) {
  const isSubmittedRef = useRef(false)
  const [selectedOpt, setSelectedOpt] = useState(null)

  // Reset local submission guard and selection state when round changes or transition ends
  useEffect(() => {
    isSubmittedRef.current = false
    setSelectedOpt(null)
  }, [roundIdx, round?.sound, round?.id])

  useEffect(() => {
    if (!isTransitioning) {
      isSubmittedRef.current = false
      setSelectedOpt(null)
    }
  }, [isTransitioning])

  // Fisher-Yates shuffled options; stable across re-renders of the same round
  const displayedOptions = useMemo(() => {
    if (round?.shuffledOptions && Array.isArray(round.shuffledOptions)) {
      return round.shuffledOptions
    }
    if (round?.disableShuffle) {
      return round?.options || []
    }
    return shuffleSoundSafariOptions(round?.options || [])
  }, [roundIdx, round?.sound, round?.options, round?.id])

  const handleSelectOption = (opt) => {
    if (isSubmittedRef.current || isTransitioning) return
    isSubmittedRef.current = true
    setSelectedOpt(opt)

    try {
      audioAtmosphere?.playChime?.(640, 0.08)
    } catch {}

    const isCorrect = opt === round.correct
    onAnswer(isCorrect)
  }

  const currentStage = SOUND_SAFARI_STAGES.find((s) => s.stage === round?.stage) || SOUND_SAFARI_STAGES[0]
  const promptText = round?.prompt || 'Which animal makes this sound?'

  return (
    <div className="text-center w-full max-w-lg mx-auto" data-testid="sound-safari-round">
      {/* 5-Stage Progression Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F8FA] border border-[#BCEBF2] text-[#0899AA] text-xs font-black uppercase tracking-wider shadow-2xs"
          data-testid="sound-safari-stage-badge"
        >
          <span>{currentStage.badge?.split(' ')[0] || '🌾'}</span>
          <span>Stage {currentStage.stage} of 5: {currentStage.shortTitle || currentStage.title}</span>
        </span>
        <span
          className="text-[11px] font-bold text-[#527080] bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full"
          data-testid="sound-safari-level-badge"
        >
          Level {round?.level || roundIdx + 1} of 25
        </span>
      </div>

      {/* 5-Stage Progression Indicators */}
      <div
        className="flex items-center justify-center gap-1.5 mb-3"
        data-testid="sound-safari-stage-indicators"
        aria-label={`Stage ${currentStage.stage} of 5`}
      >
        {SOUND_SAFARI_STAGES.map((s) => {
          const isCompleted = (round?.stage || 1) > s.stage
          const isCurrent = (round?.stage || 1) === s.stage
          return (
            <div
              key={s.stage}
              className={`h-2 rounded-full transition-all duration-300 ${
                isCurrent
                  ? 'w-7 bg-[#13CFE3] shadow-xs'
                  : isCompleted
                  ? 'w-4 bg-[#0899AA]'
                  : 'w-3 bg-slate-200'
              }`}
              title={s.title}
              data-testid={`sound-safari-stage-pip-${s.stage}`}
            />
          )
        })}
      </div>

      {/* Audio Playback Component with Real Animal Sound */}
      <div className="mb-4">
        <SoundSafariAudio
          audio={round.audio}
          sound={round.sound}
          label={round.label || round.correctName}
          language={language}
        />
      </div>

      {/* Explicit child-friendly animal sound prompt */}
      <p className="font-display font-black text-lg text-[#08233A] mb-4" data-testid="sound-safari-prompt">
        {promptText}
      </p>

      {/* Interactive 3-Option Picture Grid */}
      <div className="flex gap-4 justify-center flex-wrap" data-testid="sound-safari-options-grid">
        {displayedOptions.map((opt, optIndex) => {
          const animalName = getAnimalName(opt)
          const isSelected = selectedOpt === opt
          return (
            <button
              key={`${opt}-${optIndex}`}
              type="button"
              disabled={isSubmittedRef.current || isTransitioning}
              onClick={() => handleSelectOption(opt)}
              className={`w-20 h-20 sm:w-28 sm:h-28 rounded-3xl flex flex-col items-center justify-center p-1 sm:p-2 transition-all border-2 shadow-xs cursor-pointer select-none touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/50 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-[#E6F8FA] border-[#13CFE3] ring-4 ring-[#13CFE3]/40 scale-95'
                  : 'bg-[#F2FBFC] hover:bg-[#E6F8FA] border-[#D7EEF1] hover:border-[#13CFE3] hover:scale-105 active:scale-95'
              } ${isTransitioning ? 'opacity-60 pointer-events-none' : ''}`}
              aria-label={animalName || `Option ${opt}`}
              data-testid={`sound-safari-option-${optIndex}`}
              data-option-index={optIndex}
              data-animal={animalName?.toLowerCase()}
            >
              <span className="text-3xl sm:text-4xl select-none leading-none">{opt}</span>
              {animalName && (
                <span className="text-[10px] sm:text-xs font-black text-[#08233A] mt-1.5 truncate max-w-full">
                  {animalName}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function GameRound({ gameId, round, roundIdx, builtWord, setBuiltWord, selectedWords, setSelectedWords, onAnswer, language, theme, isTransitioning, quietMode = false }) {
  if (gameId === 'cosmic-safari') {
    return (
      <CosmicSafariRound
        key={round?.id || round?.level || 'cosmic-round'}
        round={round}
        onAnswer={onAnswer}
        language={language}
        isTransitioning={isTransitioning}
      />
    )
  }

  if (gameId === 'match-sound') {
    return (
      <SoundSafariRound
        key={round?.id || `sound-safari-${roundIdx}`}
        round={round}
        roundIdx={roundIdx}
        onAnswer={onAnswer}
        language={language}
        theme={theme}
        isTransitioning={isTransitioning}
      />
    )
  }

  if (gameId === 'sound-hunt') {
    return (
      <SoundHuntRound
        key={round?.id || round?.level || 'sound-hunt-round'}
        round={round}
        onAnswer={onAnswer}
        isTransitioning={isTransitioning}
      />
    )
  }

  if (gameId === 'sound-match') {
    return (
      <SoundMatchRound
        key={round?.id || `sound-match-${roundIdx}`}
        round={round}
        roundIdx={roundIdx}
        onAnswer={onAnswer}
        isTransitioning={isTransitioning}
      />
    )
  }

  if (gameId === 'word-train') {
    return (
      <WordTrainRound
        round={round}
        builtWord={builtWord}
        setBuiltWord={setBuiltWord}
        onAnswer={onAnswer}
      />
    )
  }

  if (gameId === 'missing-letter') {
    return (
      <MissingLetterRound
        key={round?.id || `missing-letter-${roundIdx}`}
        round={round}
        roundIdx={roundIdx}
        onAnswer={onAnswer}
        isTransitioning={isTransitioning}
        quietMode={quietMode}
      />
    )
  }

  if (gameId === 'story-puzzle') {
    return (
      <StoryPuzzleRound
        key={round?.id || `story-puzzle-${roundIdx}`}
        round={round}
        roundIdx={roundIdx}
        onAnswer={onAnswer}
        isTransitioning={isTransitioning}
        quietMode={quietMode}
      />
    )
  }

  if (gameId === 'sound-rhythm') {
    return (
      <SoundRhythmRound
        key={round?.id || `sound-rhythm-${roundIdx}`}
        round={round}
        roundIdx={roundIdx}
        onAnswer={onAnswer}
        isTransitioning={isTransitioning}
        quietMode={quietMode}
      />
    )
  }

  if (gameId === 'build-word') {
    return (
      <WordBuilderRound
        key={round?.id || `build-word-${roundIdx}`}
        round={round}
        roundIdx={roundIdx}
        builtWord={builtWord}
        setBuiltWord={setBuiltWord}
        onAnswer={onAnswer}
        isTransitioning={isTransitioning}
        quietMode={quietMode}
        theme={theme}
      />
    )
  }

  if (gameId === 'find-sound') {
    return (
      <LetterDetectiveRound
        key={round?.id || `find-sound-${roundIdx}`}
        round={round}
        roundIdx={roundIdx}
        selectedWords={selectedWords}
        setSelectedWords={setSelectedWords}
        onAnswer={onAnswer}
        isTransitioning={isTransitioning}
        quietMode={quietMode}
      />
    )
  }

  if (gameId === 'picture-word') {
    return (
      <PictureMatchRound
        key={round?.id || `picture-word-${roundIdx}`}
        round={round}
        roundIdx={roundIdx}
        onAnswer={onAnswer}
        isTransitioning={isTransitioning}
        quietMode={quietMode}
      />
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
