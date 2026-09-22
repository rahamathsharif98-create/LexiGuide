import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GameWorld from '../../game/engine/GameWorld';
import GameHUD from '../../hud/GameHUD';
import PauseScreen from '../PauseScreen/PauseScreen';
import ResultScreen from '../ResultScreen/ResultScreen';
import { useGameStore } from '../../game/engine/gameStore';
import { useAppStore } from '../../game/engine/appStore';
import { CHARACTERS } from '../../game/engine/constants';
import { gameBridge } from '../../services/integration/gameBridge';
import { getDifficultLettersFromSave } from '../../learning/learningEngine/learningEngine';
import { audioService } from '../../services/audio/audioService';

export default function GameScreen() {
  const { selectedCharacter, selectedWorld, goTo, save, applyRunResult } = useAppStore();
  const character = CHARACTERS.find((c) => c.id === selectedCharacter) || CHARACTERS[0];
  const store = useGameStore();
  const [runKey, setRunKey] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [engineError, setEngineError] = useState(null);
  const sessionStarted = useRef(false);
  const completedRef = useRef(false);

  const startingDifficulty = getInitialDifficulty(save);

  useEffect(() => {
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
    if (store.isGameOver && !completedRef.current) {
      completedRef.current = true;
      const observed = store.getObservedPatterns();
      const recommendation = store.getRecommendation();
      const difficultLetters = Object.keys(store.tracker.incorrectByLetter || {}).filter(
        (l) => (store.tracker.incorrectByLetter[l] || 0) > (store.tracker.correctByLetter[l] || 0)
      );

      const result = gameBridge.completeGameSession({
        distance: store.distance,
        lettersCollected: store.lettersCollected,
        wordsCompleted: store.wordsCompleted,
        challengesCompleted: store.challengesCompleted,
        challengesCorrect: store.challengesCorrect,
        starsEarned: store.starsEarned,
        checkpointsReached: store.checkpointsReached,
        difficultLetters,
        observedPatterns: observed.observedPatterns,
      });

      applyRunResult(result);
      setResultData({ result, recommendation });
      audioService.stopMusic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isGameOver]);

  function handlePause() {
    audioService.playButton();
    store.setPaused(true);
  }
  function handleResume() {
    store.setPaused(false);
    audioService.resume();
  }
  function handleRestart() {
    store.resetRun();
    setResultData(null);
    setEngineError(null);
    completedRef.current = false;
    setRunKey((k) => k + 1);
  }
  function handleMainMenu() {
    store.resetRun();
    setResultData(null);
    goTo('start');
  }
  function handlePlayAgain() {
    handleRestart();
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
        <GameWorld character={character} worldId={selectedWorld} difficulty={startingDifficulty} onError={setEngineError} />
      </Canvas>

      <GameHUD character={character} onPause={handlePause} />

      {store.isPaused && !store.isGameOver && (
        <PauseScreen onResume={handleResume} onRestart={handleRestart} onSettings={() => goTo('settings')} onMainMenu={handleMainMenu} />
      )}

      {resultData && (
        <ResultScreen result={resultData.result} recommendation={resultData.recommendation} onPlayAgain={handlePlayAgain} onMainMenu={handleMainMenu} />
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
