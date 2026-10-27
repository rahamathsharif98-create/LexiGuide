import { useAppStore } from '../../game/engine/appStore';
import { audioService } from '../../services/audio/audioService';
import { CHECKPOINT_DISTANCE } from '../../game/engine/constants';
import MagicalBackdrop from '../../components/MagicalBackdrop';

export default function StartScreen() {
  const goTo = useAppStore((s) => s.goTo);
  const save = useAppStore((s) => s.save);
  const setStartingCheckpoint = useAppStore((s) => s.setStartingCheckpoint);

  const checkpointProgress = save?.checkpointProgress || {};
  const highestCheckpoint = checkpointProgress.highestCheckpoint || 0;
  const highestStage = checkpointProgress.highestStage || (highestCheckpoint + 1);
  const savedDistance = checkpointProgress.savedDistance !== undefined
    ? checkpointProgress.savedDistance
    : (highestCheckpoint * CHECKPOINT_DISTANCE);

  function press(fn) {
    audioService.playButton();
    audioService.resume();
    fn();
  }

  return (
    <div style={styles.root}>
      <MagicalBackdrop />
      <div style={styles.content}>
        <div style={styles.titleWrap}>
          <h1 style={styles.title}>LEXIGUIDE</h1>
          <h2 style={styles.subtitle}>LEARNING RUN</h2>
          <p style={styles.tagline}>Run • Read • Learn • Grow</p>
        </div>

        {highestCheckpoint > 0 && (
          <div style={styles.waypointCard} data-testid="waypoint-card">
            <div style={styles.waypointHeader}>
              <span style={{ fontSize: 18 }}>🏛️</span>
              <span style={{ fontWeight: 800, color: '#eafcff', fontSize: 13 }}>Saved Waypoint:</span>
              <span style={styles.stageBadge}>Stage {highestStage}</span>
            </div>
            <div style={styles.waypointDetails}>
              Checkpoint {highestCheckpoint} • <strong>{savedDistance}m</strong> reached
            </div>
          </div>
        )}

        <div style={styles.buttons}>
          {highestCheckpoint > 0 ? (
            <>
              <button
                className="big-button"
                onClick={() => press(() => {
                  setStartingCheckpoint(highestCheckpoint);
                  goTo('worldSelect');
                })}
                data-testid="resume-run-btn"
              >
                ▶ Resume Stage {highestStage}
              </button>
              <button
                className="big-button secondary"
                onClick={() => press(() => {
                  setStartingCheckpoint(0);
                  goTo('worldSelect');
                })}
                data-testid="new-run-btn"
              >
                ↺ Start from Stage 1
              </button>
            </>
          ) : (
            <button
              className="big-button"
              onClick={() => press(() => {
                setStartingCheckpoint(0);
                goTo('worldSelect');
              })}
              data-testid="play-btn"
            >
              ▶ Play
            </button>
          )}
          <button className="big-button secondary" onClick={() => press(() => goTo('howToPlay'))}>
            📚 How to Play
          </button>
          <button className="big-button secondary" onClick={() => press(() => goTo('achievements'))}>
            🏆 Achievements
          </button>
          <button className="big-button secondary" onClick={() => press(() => goTo('settings'))}>
            ⚙ Settings
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2.4rem',
    padding: '1rem',
    textAlign: 'center',
  },
  titleWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: 'clamp(2.6rem, 9vw, 4.6rem)',
    fontWeight: 800,
    letterSpacing: 4,
    color: '#eafcff',
    textShadow: '0 0 24px rgba(56,225,255,0.8), 0 6px 0 #0d6fa6',
  },
  subtitle: {
    fontSize: 'clamp(1.4rem, 5vw, 2.2rem)',
    letterSpacing: 8,
    color: '#8fe8ff',
    marginTop: '0.2rem',
  },
  tagline: {
    marginTop: '0.8rem',
    color: '#cdeeff',
    fontSize: '1.1rem',
    opacity: 0.85,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: 'min(90vw, 340px)',
  },
  waypointCard: {
    background: 'linear-gradient(180deg, rgba(16,48,78,0.95) 0%, rgba(7,26,46,0.92) 100%)',
    border: '2px solid rgba(143,232,255,0.4)',
    borderRadius: 18,
    padding: '10px 18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    maxWidth: 340,
    width: '90%',
  },
  waypointHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  stageBadge: {
    background: 'rgba(255,209,102,0.2)',
    border: '1px solid #ffd166',
    color: '#ffd166',
    fontWeight: 800,
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 8,
  },
  waypointDetails: {
    fontSize: 12,
    color: '#8fe8ff',
    fontWeight: 600,
  },
};
