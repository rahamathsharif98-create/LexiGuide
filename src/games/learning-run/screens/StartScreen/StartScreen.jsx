import { useAppStore } from '../../game/engine/appStore';
import { audioService } from '../../services/audio/audioService';
import MagicalBackdrop from '../../components/MagicalBackdrop';

export default function StartScreen() {
  const goTo = useAppStore((s) => s.goTo);

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

        <div style={styles.buttons}>
          <button className="big-button" onClick={() => press(() => goTo('worldSelect'))}>
            ▶ Play
          </button>
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
};
