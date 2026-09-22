import MagicalBackdrop from '../../components/MagicalBackdrop';
import { audioService } from '../../services/audio/audioService';

export default function ResultScreen({ result, recommendation, onPlayAgain, onMainMenu }) {
  if (!result) return null;
  const stars = result.starsEarned || 0;

  return (
    <div style={styles.overlay}>
      <MagicalBackdrop dim />
      <div className="glass-panel" style={styles.panel}>
        <h2 style={styles.title}>RUN COMPLETE!</h2>

        <div style={styles.starsRow}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ fontSize: 34, opacity: i < stars ? 1 : 0.25 }}>
              ⭐
            </span>
          ))}
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

        <div style={{ display: 'flex', gap: '1rem', marginTop: 8 }}>
          <button className="big-button secondary" onClick={() => { audioService.playButton(); onMainMenu(); }}>
            🏠 Menu
          </button>
          <button className="big-button" onClick={() => { audioService.playButton(); onPlayAgain(); }}>
            ▶ Play Again
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
  title: { color: '#eafcff', letterSpacing: 2 },
  starsRow: { display: 'flex', gap: 6 },
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
