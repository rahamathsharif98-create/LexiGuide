import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GameWorld from '../../game/engine/GameWorld';
import GameHUD from '../../hud/GameHUD';
import PauseScreen from '../PauseScreen/PauseScreen';
import ResultScreen from '../ResultScreen/ResultScreen';
import { useGameStore } from '../../game/engine/gameStore';
import { useAppStore } from '../../game/engine/appStore';
import { CHARACTERS, MAX_CHECKPOINTS } from '../../game/engine/constants';
import { gameBridge } from '../../services/integration/gameBridge';
import { getDifficultLettersFromSave } from '../../learning/learningEngine/learningEngine';
import { audioService } from '../../services/audio/audioService';

export default function GameScreen() {
  const { selectedCharacter, selectedWorld, goTo, save, applyRunResult, selectedStartingCheckpoint, setStartingCheckpoint } = useAppStore();
  const character = CHARACTERS.find((c) => c.id === selectedCharacter) || CHARACTERS[0];
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isPaused = useGameStore((s) => s.isPaused);
  const setPaused = useGameStore((s) => s.setPaused);
  const resetRun = useGameStore((s) => s.resetRun);
  const [runKey, setRunKey] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [engineError, setEngineError] = useState(null);
  const sessionStarted = useRef(false);
  const completedRef = useRef(false);

  const startingDifficulty = getInitialDifficulty(save);

  useEffect(() => {
    // Explicitly calibrate game store state to selectedStartingCheckpoint from frame 1
    const chk = Math.min(MAX_CHECKPOINTS, Math.max(0, Number(selectedStartingCheckpoint) || 0));
    resetRun(chk);

    gameBridge.startGameSession({
      studentId: null,
      worldId: selectedWorld,
      characterId: character.id,
      difficulty: startingDifficulty,
    });
    sessionStarted.current = true;
    completedRef.current = false;
    audioService.startMusic();
    return () => {
      audioService.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  useEffect(() => {
    if (isGameOver && !completedRef.current) {
      completedRef.current = true;
      const storeState = useGameStore.getState();
      const observed = storeState.getObservedPatterns();
      const recommendation = storeState.getRecommendation();
      const difficultLetters = Object.keys(storeState.tracker.incorrectByLetter || {}).filter(
        (l) => (storeState.tracker.incorrectByLetter[l] || 0) > (storeState.tracker.correctByLetter[l] || 0)
      );

      const result = gameBridge.completeGameSession({
        distance: storeState.distance,
        lettersCollected: storeState.lettersCollected,
        wordsCompleted: storeState.wordsCompleted,
        challengesCompleted: storeState.challengesCompleted,
        challengesCorrect: storeState.challengesCorrect,
        starsEarned: storeState.starsEarned,
        checkpointsReached: storeState.checkpointsReached,
        difficultLetters,
        observedPatterns: observed.observedPatterns,
      });

      applyRunResult(result);
      setResultData({
        result,
        recommendation,
        stumbles: storeState.stumbles,
        checkpointsReached: storeState.checkpointsReached,
        isCompleted: storeState.isCompleted,
        resumeCheckpoint: storeState.isCompleted ? 10 : Math.min(MAX_CHECKPOINTS, Math.max(
          storeState.checkpointsReached || 0,
          selectedStartingCheckpoint || 0
        )),
      });
      audioService.stopMusic();
    }
  }, [isGameOver, applyRunResult]);

  function handlePause() {
    audioService.playButton();
    setPaused(true);
  }
  function handleResume() {
    setPaused(false);
    audioService.resume();
  }
  function handleRestart() {
    resetRun(selectedStartingCheckpoint || 0);
    setResultData(null);
    setEngineError(null);
    completedRef.current = false;
    setRunKey((k) => k + 1);
  }
  function handleMainMenu() {
    resetRun(0);
    setResultData(null);
    goTo('start');
  }
  function handlePlayAgain() {
    // Resume from highest valid checkpoint reached in this run (or selected starting checkpoint)
    const storeState = useGameStore.getState();
    const resumeChk = Math.min(MAX_CHECKPOINTS, Math.max(
      storeState.checkpointsReached || 0,
      selectedStartingCheckpoint || 0
    ));
    setStartingCheckpoint(resumeChk);
    resetRun(resumeChk);
    setResultData(null);
    setEngineError(null);
    completedRef.current = false;
    setRunKey((k) => k + 1);
  }
  function handleRestartFresh() {
    setStartingCheckpoint(0);
    resetRun(0);
    setResultData(null);
    setEngineError(null);
    completedRef.current = false;
    setRunKey((k) => k + 1);
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        key={runKey}
        shadows={save.settings.graphicsQuality !== 'low'}
        camera={{ fov: 62, near: 0.1, far: 400, position: [0, 2.6, 6.5] }}
        dpr={save.settings.graphicsQuality === 'high' ? [1, 1.5] : 1}
        gl={{ powerPreference: 'high-performance', antialias: true, alpha: false }}
      >
        <color attach="background" args={['#bbf7d0']} />
        <GameWorld
          character={character}
          worldId={selectedWorld}
          difficulty={startingDifficulty}
          startingCheckpoint={selectedStartingCheckpoint || 0}
          onError={setEngineError}
        />
      </Canvas>

      <GameHUD character={character} onPause={handlePause} />

      {isPaused && !isGameOver && (
        <PauseScreen onResume={handleResume} onRestart={handleRestart} onSettings={() => goTo('settings')} onMainMenu={handleMainMenu} />
      )}

      {resultData && (
        <ResultScreen
          result={resultData.result}
          recommendation={resultData.recommendation}
          stumbles={resultData.stumbles}
          checkpointsReached={resultData.checkpointsReached}
          resumeCheckpoint={resultData.resumeCheckpoint}
          isCompleted={resultData.isCompleted}
          onPlayAgain={handlePlayAgain}
          onRestartFresh={handleRestartFresh}
          onMainMenu={handleMainMenu}
        />
      )}

      {engineError && (
        <div style={diagnosticStyles.overlay}>
          <div style={diagnosticStyles.panel}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔧</div>
            <h2 style={{ marginBottom: 8 }}>The run hit a snag</h2>
            <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 12 }}>
              Something inside the game loop failed. Here are the details:
            </p>
            <pre style={diagnosticStyles.pre}>{String((engineError && (engineError.stack || engineError.message)) || engineError)}</pre>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="big-button secondary" onClick={handleMainMenu}>
                🏠 Menu
              </button>
              <button className="big-button" onClick={handleRestart}>
                ↻ Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const diagnosticStyles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(3,10,18,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  panel: {
    background: '#0d3252',
    border: '1px solid rgba(143,232,255,0.35)',
    borderRadius: 20,
    padding: '1.6rem',
    width: 'min(92vw, 460px)',
    color: 'white',
    textAlign: 'center',
  },
  pre: {
    textAlign: 'left',
    background: 'rgba(0,0,0,0.35)',
    padding: 12,
    borderRadius: 10,
    fontSize: 12,
    overflow: 'auto',
    maxHeight: 160,
  },
};

function getInitialDifficulty(save) {
  const difficultLetters = getDifficultLettersFromSave(save.learningProgress);
  // Start gently; the adaptive engine will ramp up during the run itself.
  return difficultLetters.length > 3 ? 1 : 1;
}
