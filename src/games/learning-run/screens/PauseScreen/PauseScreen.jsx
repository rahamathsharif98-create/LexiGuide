import { audioService } from '../../services/audio/audioService';

export default function PauseScreen({ onResume, onRestart, onSettings, onMainMenu }) {
  return (
    <div style={styles.overlay}>
      <div className="glass-panel" style={styles.panel}>
        <h2 style={styles.title}>PAUSED</h2>
        <button className="big-button" onClick={() => { audioService.playButton(); onResume(); }}>
          ▶ Resume
        </button>
        <button className="big-button secondary" onClick={() => { audioService.playButton(); onRestart(); }}>
          🔄 Restart
        </button>
        <button className="big-button secondary" onClick={() => { audioService.playButton(); onSettings(); }}>
          ⚙ Settings
        </button>
        <button className="big-button secondary" onClick={() => { audioService.playButton(); onMainMenu(); }}>
          🏠 Main Menu
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(3,10,18,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
    padding: '2rem',
    width: 'min(90vw, 320px)',
    alignItems: 'stretch',
  },
  title: {
    textAlign: 'center',
    color: '#eafcff',
    letterSpacing: 4,
    marginBottom: 8,
  },
};
