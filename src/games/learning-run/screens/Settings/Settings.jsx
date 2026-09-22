import { useAppStore } from '../../game/engine/appStore';
import { audioService } from '../../services/audio/audioService';
import MagicalBackdrop from '../../components/MagicalBackdrop';

function Toggle({ label, icon, value, onChange }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>
        <span style={{ marginRight: 8 }}>{icon}</span>
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        style={{
          ...styles.toggle,
          background: value ? 'linear-gradient(180deg,#aef4ff,#38e1ff)' : 'rgba(255,255,255,0.15)',
        }}
      >
        <span style={{ ...styles.knob, transform: value ? 'translateX(22px)' : 'translateX(2px)' }} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { goTo, save, updateSettings, resetProgress } = useAppStore();
  const { settings } = save;

  return (
    <div style={styles.root}>
      <MagicalBackdrop dim />
      <div style={styles.content} className="glass-panel">
        <h2 style={styles.heading}>⚙ Settings</h2>

        <Toggle label="Music" icon="🎵" value={settings.music} onChange={(v) => updateSettings({ music: v })} />
        <Toggle label="Sound Effects" icon="🔊" value={settings.sfx} onChange={(v) => updateSettings({ sfx: v })} />
        <Toggle label="Voice / Pronunciation" icon="🗣️" value={settings.voice} onChange={(v) => updateSettings({ voice: v })} />
        <Toggle label="Reduced Motion" icon="🌙" value={settings.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} />

        <div style={styles.row}>
          <span style={styles.rowLabel}>🖥️ Graphics Quality</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['low', 'auto', 'high'].map((q) => (
              <button
                key={q}
                onClick={() => updateSettings({ graphicsQuality: q })}
                style={{
                  ...styles.qualityBtn,
                  background: settings.graphicsQuality === q ? '#38e1ff' : 'rgba(255,255,255,0.12)',
                  color: settings.graphicsQuality === q ? '#071a2e' : 'white',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.controlsInfo}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Controls</div>
          <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
            Keyboard: A/D or ←/→ to move · W/↑/Space to jump · S/↓ to slide · Esc to pause
            <br />
            Touch: Swipe left/right/up/down
          </div>
        </div>

        <button
          className="big-button secondary"
          style={{ marginTop: 8 }}
          onClick={() => {
            if (window.confirm('Reset all saved progress? This cannot be undone.')) {
              resetProgress();
            }
          }}
        >
          🗑 Reset Progress
        </button>

        <button
          className="big-button"
          onClick={() => {
            audioService.playButton();
            goTo('start');
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

const styles = {
  root: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '2rem',
    width: 'min(92vw, 420px)',
  },
  heading: { textAlign: 'center', color: '#eafcff', marginBottom: 8 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: 600 },
  toggle: { width: 48, height: 26, borderRadius: 999, border: 'none', position: 'relative', padding: 0 },
  knob: { position: 'absolute', top: 2, width: 22, height: 22, borderRadius: '50%', background: 'white', transition: 'transform 0.15s ease' },
  qualityBtn: { border: 'none', borderRadius: 10, padding: '4px 10px', fontSize: 12, textTransform: 'capitalize', fontFamily: 'var(--font-body)' },
  controlsInfo: { background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: '0.8rem 1rem' },
};
