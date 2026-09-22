import { useAppStore } from '../../game/engine/appStore';
import { computeUnlockedAchievements } from '../../learning/progress/achievements';
import { audioService } from '../../services/audio/audioService';
import MagicalBackdrop from '../../components/MagicalBackdrop';

export default function Achievements() {
  const { goTo, save } = useAppStore();
  const achievements = computeUnlockedAchievements(save);

  return (
    <div style={styles.root}>
      <MagicalBackdrop dim />
      <div style={styles.content}>
        <h2 style={styles.heading}>🏆 Achievements</h2>
        <div style={styles.grid}>
          {achievements.map((a) => (
            <div key={a.id} className="glass-panel" style={{ ...styles.card, opacity: a.unlocked ? 1 : 0.45 }}>
              <div style={{ fontSize: 36 }}>{a.icon}</div>
              <div style={{ fontWeight: 800 }}>{a.name}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{a.description}</div>
              {a.unlocked && <div style={{ fontSize: 11, color: '#8fe8ff', marginTop: 6, fontWeight: 700 }}>UNLOCKED</div>}
            </div>
          ))}
        </div>
        <button
          className="big-button secondary"
          onClick={() => {
            audioService.playButton();
            goTo('start');
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

const styles = {
  root: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content: { position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.6rem', padding: '1rem', maxWidth: 720 },
  heading: { color: '#eafcff', fontSize: '1.8rem', textShadow: '0 0 16px rgba(56,225,255,0.6)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.9rem', width: '100%' },
  card: { padding: '1rem', textAlign: 'center' },
};
