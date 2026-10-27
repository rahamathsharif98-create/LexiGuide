import MagicalBackdrop from '../../components/MagicalBackdrop';
import { audioService } from '../../services/audio/audioService';

export default function ResultScreen({
  result,
  recommendation,
  onPlayAgain,
  onRestartFresh,
  onMainMenu,
  checkpointsReached = 0,
  stumbles = 0,
  resumeCheckpoint = 0,
  isCompleted = false,
}) {
  if (!result) return null;
  const stars = Math.max(0, Number(result.starsEarned) || 0);
  const reachedMilestone = checkpointsReached > 0 || (result.wordsCompleted && result.wordsCompleted.length > 0);
  const isStumbleOut = stumbles >= 3;

  let title = 'RUN COMPLETE!';
  let statusBadge = null;

  if (isCompleted) {
    title = 'EXPEDITION COMPLETE! 🏆';
    statusBadge = 'All 11 Stages Mastered! Temple Summit Conquered!';
  } else if (checkpointsReached >= 10) {
    title = 'TEMPLE SUMMIT CONQUERED! 🏆';
    statusBadge = 'All 10 Temple Waypoints Mastered!';
  } else if (reachedMilestone) {
    title = 'WAYPOINT REACHED! 🏛️';
    statusBadge = `Stage ${checkpointsReached + 1} Waypoint Unlocked!`;
  } else if (isStumbleOut) {
    title = 'EXPEDITION PAUSED!';
    statusBadge = 'Keep your balance! Try again to reach the next waypoint.';
  }

  return (
    <div style={styles.overlay}>
      <MagicalBackdrop dim />
      <div className="glass-panel" style={styles.panel}>
        <h2 style={styles.title} data-testid="result-title">{title}</h2>
        {statusBadge && (
          <div style={styles.statusBadge} data-testid="result-status-badge">
            {statusBadge}
          </div>
        )}

        <div style={styles.starsContainer}>
          <div style={styles.starsRow} data-testid="result-stars-row">
            {stars > 0 ? (
              Array.from({ length: Math.min(stars, 8) }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: stars > 5 ? 26 : 34,
                    filter: 'drop-shadow(0 2px 8px rgba(255, 209, 102, 0.6))',
                  }}
                  role="img"
                  aria-label="Star"
                >
                  ⭐
                </span>
              ))
            ) : (
              [0, 1, 2].map((i) => (
                <span key={i} style={{ fontSize: 34, opacity: 0.25 }} role="img" aria-label="Empty Star">
                  ⭐
                </span>
              ))
            )}
          </div>
          <div style={styles.starsBadge} data-testid="result-stars-count">
            <span>⭐</span>
            <span>{stars > 0 ? `+${stars} Star${stars === 1 ? '' : 's'} Earned!` : 'Keep going to earn stars!'}</span>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <Stat label="Distance" value={`${result.distance} m`} />
          <Stat label="Letters" value={result.lettersCollected.length} />
          <Stat label="Words" value={result.wordsCompleted.length} />
          <Stat label="Challenges" value={`${result.challengesCorrect}/${result.challengesCompleted}`} />
        </div>

        {result.wordsCompleted.length > 0 && (
          <div style={styles.wordsLine}>
            {result.wordsCompleted.map((w) => (
              <span key={w} style={styles.wordChip}>
                {w}
              </span>
            ))}
          </div>
        )}

        <div style={styles.recommendation}>{recommendation || 'Keep Practicing!'}</div>

        <div style={{ display: 'flex', gap: '0.8rem', marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="big-button secondary"
            onClick={() => { audioService.playButton(); onMainMenu(); }}
            data-testid="result-menu-btn"
          >
            🏠 Menu
          </button>
          {typeof onRestartFresh === 'function' && (resumeCheckpoint > 0 || isCompleted) && (
            <button
              className="big-button secondary"
              onClick={() => { audioService.playButton(); onRestartFresh(); }}
              data-testid="result-restart-fresh-btn"
            >
              ↺ Stage 1
            </button>
          )}
          <button
            className="big-button"
            onClick={() => { audioService.playButton(); onPlayAgain(); }}
            data-testid="result-play-again-btn"
          >
            {isCompleted ? '▶ Play Again (Stage 11)' : (resumeCheckpoint > 0 ? `▶ Resume Stage ${resumeCheckpoint + 1}` : '▶ Play Again')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  panel: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.9rem',
    padding: '2rem',
    width: 'min(92vw, 420px)',
  },
  title: { color: '#eafcff', letterSpacing: 2, textAlign: 'center' },
  statusBadge: {
    color: '#8fe8ff',
    fontWeight: 700,
    fontSize: 13,
    padding: '4px 14px',
    borderRadius: 999,
    background: 'rgba(56,225,255,0.12)',
    border: '1px solid rgba(143,232,255,0.3)',
    textAlign: 'center',
  },
  starsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  starsRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starsBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 14px',
    borderRadius: 999,
    background: 'rgba(255, 209, 102, 0.15)',
    border: '1px solid rgba(255, 209, 102, 0.45)',
    color: '#ffd166',
    fontWeight: 800,
    fontSize: 14,
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.7rem', width: '100%' },
  stat: { background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: '0.7rem', textAlign: 'center' },
  wordsLine: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  wordChip: { background: 'rgba(255,209,102,0.18)', border: '1px solid rgba(255,209,102,0.5)', borderRadius: 10, padding: '2px 10px', fontSize: 13, fontWeight: 700, color: '#ffd166' },
  recommendation: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 700,
    color: '#8fe8ff',
    background: 'rgba(56,225,255,0.1)',
    border: '1px solid rgba(143,232,255,0.35)',
    borderRadius: 14,
    padding: '0.7rem 1rem',
  },
};
