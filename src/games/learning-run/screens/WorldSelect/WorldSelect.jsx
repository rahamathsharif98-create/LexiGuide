import { useAppStore } from '../../game/engine/appStore';
import { WORLDS } from '../../game/engine/constants';
import { audioService } from '../../services/audio/audioService';
import MagicalBackdrop from '../../components/MagicalBackdrop';

const WORLD_EMOJI = { 'letter-valley': '🏞️', 'word-forest': '🌲', 'sound-caves': '🕳️', 'story-skyland': '🏝️' };

export default function WorldSelect() {
  const { goTo, selectWorld, selectedWorld, save } = useAppStore();
  const unlockedWorlds = save.unlockedWorlds || ['letter-valley'];

  function choose(world) {
    if (!unlockedWorlds.includes(world.id)) return;
    audioService.playButton();
    selectWorld(world.id);
  }

  return (
    <div style={styles.root}>
      <MagicalBackdrop dim />
      <div style={styles.content}>
        <h2 style={styles.heading}>Choose Your World</h2>
        <div style={styles.grid}>
          {WORLDS.map((w) => {
            const unlocked = unlockedWorlds.includes(w.id);
            const active = selectedWorld === w.id;
            return (
              <button
                key={w.id}
                onClick={() => choose(w)}
                disabled={!unlocked}
                style={{
                  ...styles.card,
                  borderColor: active ? '#8fe8ff' : 'rgba(143,232,255,0.25)',
                  opacity: unlocked ? 1 : 0.55,
                }}
              >
                <div style={{ fontSize: 40 }}>{WORLD_EMOJI[w.id]}</div>
                <div style={{ fontSize: 12, opacity: 0.75, letterSpacing: 1 }}>{w.subtitle}</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{w.name}</div>
                {!unlocked && <div style={styles.lockTag}>🔒 Coming soon</div>}
                {active && unlocked && <div style={styles.selectedTag}>Selected</div>}
              </button>
            );
          })}
        </div>

        <div style={styles.footerBtns}>
          <button className="big-button secondary" onClick={() => { audioService.playButton(); goTo('start'); }}>
            ← Back
          </button>
          <button className="big-button" onClick={() => { audioService.playButton(); goTo('characterSelect'); }}>
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  content: { position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.6rem', padding: '1rem' },
  heading: { color: '#eafcff', fontSize: '1.8rem', textShadow: '0 0 16px rgba(56,225,255,0.6)' },
  grid: { display: 'flex', gap: '1.1rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 680 },
  card: {
    width: 150,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '1.1rem 0.8rem',
    borderRadius: 20,
    border: '2px solid',
    background: 'rgba(11,41,66,0.7)',
    color: 'white',
  },
  lockTag: { fontSize: 11, color: '#ffb37a', marginTop: 4 },
  selectedTag: { fontSize: 11, color: '#8fe8ff', fontWeight: 700, marginTop: 4 },
  footerBtns: { display: 'flex', gap: '1rem', marginTop: '0.5rem' },
};
