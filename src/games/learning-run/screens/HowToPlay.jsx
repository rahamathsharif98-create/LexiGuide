import { useAppStore } from '../game/engine/appStore';
import { audioService } from '../services/audio/audioService';
import MagicalBackdrop from '../components/MagicalBackdrop';

const STEPS = [
  { icon: '↔️', title: 'Move', text: 'Swipe left/right or press A / D to change lanes.' },
  { icon: '⬆️', title: 'Jump', text: 'Swipe up or press W / Space to jump over blocks.' },
  { icon: '⬇️', title: 'Slide', text: 'Swipe down or press S to slide under bars.' },
  { icon: '🪙', title: 'Collect Letters', text: 'Run into glowing letter coins to collect them.' },
  { icon: '🧩', title: 'Learning Gates', text: 'Pick the lane with the correct letter to answer a challenge.' },
  { icon: '🔥', title: 'Checkpoints', text: 'Reach magical checkpoints to earn stars and keep going!' },
];

export default function HowToPlay() {
  const goTo = useAppStore((s) => s.goTo);

  return (
    <div style={styles.root}>
      <MagicalBackdrop dim />
      <div style={styles.content}>
        <h2 style={styles.heading}>How to Play</h2>
        <div style={styles.grid}>
          {STEPS.map((s) => (
            <div key={s.title} className="glass-panel" style={styles.card}>
              <div style={{ fontSize: 34 }}>{s.icon}</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{s.text}</div>
            </div>
          ))}
        </div>
        <button
          className="big-button"
          onClick={() => {
            audioService.playButton();
            goTo('start');
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

const styles = {
  root: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content: { position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.6rem', padding: '1rem', maxWidth: 720 },
  heading: { color: '#eafcff', fontSize: '1.8rem', textShadow: '0 0 16px rgba(56,225,255,0.6)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.9rem' },
  card: { padding: '1rem', textAlign: 'center' },
};
