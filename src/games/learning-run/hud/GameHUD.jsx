import { useEffect } from 'react';
import { useGameStore } from '../game/engine/gameStore';

const CHARACTER_EMOJI = { explorer: '🧭', reader: '📚', adventurer: '⚡' };

export default function GameHUD({ character, onPause }) {
  const {
    distance,
    score,
    multiplier,
    starsEarned,
    activeWordQuest,
    turnPrompt,
    feedback,
    clearFeedback,
    activePowerUp,
    activeChallenge,
    isPaused,
    isGameOver,
  } = useGameStore();

  useEffect(() => {
    if (!feedback) return undefined;
    const t = setTimeout(() => clearFeedback(), feedback.kind === 'word-complete' ? 2200 : (feedback.kind === 'letter' ? 1400 : 1800));
    return () => clearTimeout(t);
  }, [feedback, clearFeedback]);

  if (isPaused || isGameOver) return null;

  return (
    <div style={styles.hudRoot}>
      {/* Top bar: Character, Score & Multiplier, Pause */}
      <div style={styles.topBar}>
        <div style={styles.profileChip}>
          <span style={{ fontSize: 22 }}>{CHARACTER_EMOJI[character.id] || '🧒'}</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700 }}>{character.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#ffd166', fontWeight: 800 }}>⭐ {starsEarned}</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span style={{ color: '#8fe8ff', fontWeight: 800 }}>SCORE: {score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {multiplier > 1 && (
          <div style={styles.multiplierChip}>
            <span>🔥</span>
            <span>x{multiplier} COMBO</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={styles.distanceChipSimple}>{distance}m</div>
          <button style={styles.pauseBtn} onClick={onPause} aria-label="Pause">
            ⏸
          </button>
        </div>
      </div>

      {/* Safari Fill-in-the-Blank Word Quest Tablet (Sleek non-blocking top bar) */}
      {activeWordQuest && (
        <div style={styles.wordQuestTablet}>
          <span style={{ fontSize: 18 }}>{activeWordQuest.emoji}</span>
          <span style={styles.wordQuestTitle}>QUEST:</span>

          <div style={styles.letterTilesRow}>
            {activeWordQuest.word.split('').map((ch, idx) => {
              const isMissing = idx === activeWordQuest.missingIndex;
              return (
                <div
                  key={idx}
                  style={isMissing ? styles.missingLetterSlot : styles.filledLetterTile}
                >
                  {isMissing ? '?' : ch}
                </div>
              );
            })}
          </div>

          <div style={styles.wordQuestHint}>
            Catch <strong style={{ color: '#ffd166', fontSize: 14 }}>"{activeWordQuest.missingLetter}"</strong>!
          </div>
        </div>
      )}

      {/* Temple Run Approaching Corner Turn Warning */}
      {turnPrompt && (
        <div style={styles.turnWarningBanner}>
          <span style={{ fontSize: 20 }}>{turnPrompt.direction === 'left' ? '◀◀' : '▶▶'}</span>
          <span style={{ fontWeight: 800, letterSpacing: 1.2 }}>
            TURN {turnPrompt.direction.toUpperCase()} IN {turnPrompt.distance}M!
          </span>
          <span style={{ fontSize: 20 }}>{turnPrompt.direction === 'left' ? '◀◀' : '▶▶'}</span>
        </div>
      )}

      {activePowerUp && (
        <div style={styles.powerUpChip}>
          <span style={{ fontSize: 16 }}>💠</span> {activePowerUp.label}
        </div>
      )}

      {activeChallenge && (
        <div style={styles.challengePrompt}>
          <span style={{ fontSize: 20, marginRight: 6 }}>{activeChallenge.emoji}</span>
          <span>{activeChallenge.prompt}</span>
        </div>
      )}

      {feedback && (
        <div style={{ ...styles.feedbackToast, ...feedbackColor(feedback.kind) }}>
          <div style={{ fontSize: feedback.kind === 'letter' || feedback.kind === 'word-complete' ? 22 : 18, fontWeight: 800 }}>
            {feedback.text}
          </div>
          {feedback.sub && <div style={{ fontSize: 12, marginTop: 2, fontWeight: 600 }}>{feedback.sub}</div>}
        </div>
      )}
    </div>
  );
}

function feedbackColor(kind) {
  switch (kind) {
    case 'word-complete':
      return { borderColor: '#ffd166', background: 'rgba(25, 75, 45, 0.92)', boxShadow: '0 0 25px rgba(255, 209, 102, 0.5)' };
    case 'turn':
      return { borderColor: '#38e1ff', background: 'rgba(10, 45, 75, 0.92)', boxShadow: '0 0 20px rgba(56, 225, 255, 0.4)' };
    case 'correct':
      return { borderColor: '#6bd98a', background: 'rgba(20,60,40,0.85)' };
    case 'incorrect':
      return { borderColor: '#ffb37a', background: 'rgba(70,45,20,0.85)' };
    case 'hit':
      return { borderColor: '#38e1ff', background: 'rgba(14,46,74,0.92)', boxShadow: '0 0 20px rgba(56,225,255,0.35)' };
    case 'checkpoint':
      return { borderColor: '#8fe8ff', background: 'rgba(10,50,70,0.9)' };
    default:
      return { borderColor: '#ffd166', background: 'rgba(50,40,10,0.85)' };
  }
}

const styles = {
  hudRoot: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    fontFamily: 'var(--font-body)',
    color: 'white',
  },
  topBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  profileChip: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    background: 'rgba(11,41,66,0.85)',
    border: '1px solid rgba(143,232,255,0.35)',
    borderRadius: 999,
    padding: '6px 14px 6px 10px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
  },
  multiplierChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'linear-gradient(90deg, #ff8c00, #ffd166)',
    color: '#071a2e',
    fontWeight: 800,
    fontSize: 12,
    padding: '4px 12px',
    borderRadius: 999,
    boxShadow: '0 0 16px rgba(255,140,0,0.5)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  distanceChipSimple: {
    background: 'rgba(11,41,66,0.75)',
    border: '1px solid rgba(143,232,255,0.3)',
    borderRadius: 999,
    padding: '6px 12px',
    fontWeight: 700,
    fontSize: 13,
  },
  pauseBtn: {
    pointerEvents: 'auto',
    width: 42,
    height: 42,
    borderRadius: '50%',
    border: '2px solid rgba(143,232,255,0.5)',
    background: 'rgba(11,41,66,0.8)',
    color: 'white',
    fontSize: 16,
    cursor: 'pointer',
  },
  wordQuestTablet: {
    position: 'absolute',
    top: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(180deg, rgba(16,48,78,0.95) 0%, rgba(7,26,46,0.92) 100%)',
    border: '2px solid rgba(255,209,102,0.85)',
    borderRadius: 999,
    padding: '4px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 15px rgba(255,209,102,0.25)',
    backdropFilter: 'blur(8px)',
    zIndex: 20,
    height: 38,
  },
  wordQuestTitle: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1,
    color: '#ffd166',
  },
  letterTilesRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    margin: 0,
  },
  filledLetterTile: {
    width: 24,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #1d507a 0%, #0d2f4d 100%)',
    border: '1.5px solid #8fe8ff',
    borderRadius: 5,
    fontSize: 14,
    fontWeight: 800,
    color: '#ffffff',
  },
  missingLetterSlot: {
    width: 24,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,209,102,0.2)',
    border: '1.5px dashed #ffd166',
    borderRadius: 5,
    fontSize: 14,
    fontWeight: 800,
    color: '#ffd166',
  },
  wordQuestHint: {
    fontSize: 12,
    color: '#cdeeff',
    fontWeight: 600,
    marginLeft: 4,
  },
  turnWarningBanner: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(90deg, #d97706, #f59e0b)',
    color: '#ffffff',
    padding: '6px 20px',
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 0 25px rgba(245, 158, 11, 0.7)',
    animation: 'pulse 1s infinite',
    zIndex: 30,
    fontSize: 13,
    fontWeight: 800,
  },
  powerUpChip: {
    position: 'absolute',
    top: 60,
    right: 14,
    background: 'rgba(11,41,66,0.85)',
    border: '1px solid rgba(143,232,255,0.4)',
    borderRadius: 999,
    padding: '5px 12px',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    zIndex: 15,
  },
  challengePrompt: {
    position: 'absolute',
    top: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(9,34,54,0.92)',
    border: '2px solid rgba(143,232,255,0.6)',
    borderRadius: 16,
    padding: '6px 18px',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: 13,
    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
    zIndex: 15,
  },
  feedbackToast: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    border: '2px solid',
    borderRadius: 16,
    padding: '8px 18px',
    textAlign: 'center',
    minWidth: 140,
    backdropFilter: 'blur(10px)',
    zIndex: 20,
  },
};
