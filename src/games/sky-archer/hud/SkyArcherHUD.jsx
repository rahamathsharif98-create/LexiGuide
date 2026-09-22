import { Volume2, Star, Sparkles, Award } from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export default function SkyArcherHUD({
  currentRound,
  score,
  stars,
  combo,
  onReplayAudio,
  feedback,
}) {
  return (
    <div style={styles.hudRoot}>
      {/* 1. Top Bar: Score, Stars, Combo */}
      <div style={styles.topBar}>
        <div style={styles.badge}>
          <span style={{ fontSize: 20 }}>🏹</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#f0f9ff' }}>Sky Word Archer</span>
            <span style={{ fontSize: 11, color: '#bae6fd', fontWeight: 600 }}>Phonics Flight</span>
          </div>
        </div>

        {combo > 1 && (
          <div style={styles.comboBadge}>
            <Sparkles size={16} />
            <span>x{combo} COMBO!</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GameSoundToggle />
          <div style={styles.starsBadge}>
            <Star size={16} fill="#fbbf24" color="#fbbf24" />
            <span>{stars} Stars</span>
          </div>
          <div style={styles.scoreBadge}>
            <span>SCORE: {score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 2. Target Phonics Tablet (Centered at top) */}
      <div style={styles.targetTablet}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>{currentRound.emoji}</span>
          <div>
            <div style={styles.targetTitle}>TARGET SOUND</div>
            <div style={styles.targetSound}>{currentRound.sound}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onReplayAudio}
          style={styles.speakerBtn}
          title="Hear sound again"
        >
          <Volume2 size={18} />
          <span>Listen</span>
        </button>

        <div style={styles.wordHint}>
          {currentRound.wordHint}
        </div>
      </div>

      {/* 3. Crosshair guidance hint in center */}
      <div style={styles.aimGuidance}>
        <span>🎯 Tap or click any balloon to release arrow!</span>
      </div>

      {/* 4. Feedback Toast when a balloon is popped */}
      {feedback && (
        <div
          style={{
            ...styles.feedbackToast,
            backgroundColor: feedback.correct ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          }}
        >
          <span style={{ fontSize: 24 }}>{feedback.correct ? '🎯' : '💨'}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{feedback.message}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{feedback.sub}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  hudRoot: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#ffffff',
    zIndex: 10,
  },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(186, 230, 253, 0.3)',
    borderRadius: 999,
    padding: '6px 14px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
  },
  comboBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
    color: '#ffffff',
    fontWeight: 900,
    fontSize: 13,
    padding: '6px 16px',
    borderRadius: 999,
    boxShadow: '0 0 18px rgba(245, 158, 11, 0.6)',
  },
  starsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(251, 191, 36, 0.4)',
    borderRadius: 999,
    padding: '6px 14px',
    fontWeight: 800,
    fontSize: 13,
    color: '#fef08a',
  },
  scoreBadge: {
    background: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(186, 230, 253, 0.3)',
    borderRadius: 999,
    padding: '6px 14px',
    fontWeight: 800,
    fontSize: 13,
    color: '#38bdf8',
  },
  targetTablet: {
    position: 'absolute',
    top: 64,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 100%)',
    border: '2px solid #38bdf8',
    borderRadius: 20,
    padding: '8px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 0 16px rgba(56, 189, 248, 0.25)',
  },
  targetTitle: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.2,
    color: '#94a3b8',
  },
  targetSound: {
    fontSize: 22,
    fontWeight: 900,
    color: '#38bdf8',
    letterSpacing: 1,
  },
  speakerBtn: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: '#0284c7',
    hover: '#0369a1',
    color: '#ffffff',
    border: 'none',
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
  },
  wordHint: {
    fontSize: 12,
    fontWeight: 600,
    color: '#e2e8f0',
  },
  aimGuidance: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 999,
    padding: '6px 18px',
    fontSize: 12,
    fontWeight: 700,
    color: '#f8fafc',
    pointerEvents: 'none',
  },
  feedbackToast: {
    position: 'absolute',
    top: 140,
    left: '50%',
    transform: 'translateX(-50%)',
    borderRadius: 16,
    padding: '10px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
    animation: 'pulse 0.4s ease',
  },
};