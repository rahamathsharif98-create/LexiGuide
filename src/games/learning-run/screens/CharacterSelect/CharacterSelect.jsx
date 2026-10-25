import { useAppStore } from '../../game/engine/appStore';
import { CHARACTERS, CHECKPOINT_DISTANCE } from '../../game/engine/constants';
import { audioService } from '../../services/audio/audioService';
import MagicalBackdrop from '../../components/MagicalBackdrop';

const CHAR_EMOJI = { explorer: '🧭', reader: '📚', adventurer: '⚡' };

export default function CharacterSelect() {
  const { goTo, selectCharacter, selectedCharacter, save, selectedStartingCheckpoint, setStartingCheckpoint } = useAppStore();

  const checkpointProgress = save?.checkpointProgress || {};
  const highestCheckpoint = checkpointProgress.highestCheckpoint || 0;
  const highestStage = checkpointProgress.highestStage || (highestCheckpoint + 1);
  const savedDistance = checkpointProgress.savedDistance !== undefined
    ? checkpointProgress.savedDistance
    : (highestCheckpoint * CHECKPOINT_DISTANCE);

  function choose(id) {
    audioService.playButton();
    selectCharacter(id);
  }

  return (
    <div style={styles.root}>
      <MagicalBackdrop dim />
      <div style={styles.content}>
        <h2 style={styles.heading}>Choose Your Runner</h2>
        <div style={styles.grid}>
          {CHARACTERS.map((c) => {
            const active = selectedCharacter === c.id;
            return (
              <button key={c.id} onClick={() => choose(c.id)} style={{ ...styles.card, borderColor: active ? c.primaryColor : 'rgba(143,232,255,0.25)' }}>
                <div style={{ ...styles.avatar, background: `radial-gradient(circle, ${c.primaryColor}55, transparent 70%)` }}>
                  <span style={{ fontSize: 44 }}>{CHAR_EMOJI[c.id]}</span>
                </div>
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                {active && <div style={styles.selectedTag}>Selected</div>}
              </button>
            );
          })}
        </div>

        {highestCheckpoint > 0 && (
          <div style={styles.waypointBox} data-testid="character-waypoint-selector">
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8fe8ff' }}>Starting Point:</span>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { audioService.playButton(); setStartingCheckpoint(0); }}
                style={{
                  ...styles.waypointPill,
                  borderColor: selectedStartingCheckpoint === 0 ? '#ffd166' : 'rgba(143,232,255,0.3)',
                  background: selectedStartingCheckpoint === 0 ? 'rgba(255,209,102,0.25)' : 'rgba(11,41,66,0.6)',
                  color: selectedStartingCheckpoint === 0 ? '#ffd166' : '#ffffff',
                }}
              >
                Stage 1 (0m)
              </button>
              <button
                type="button"
                onClick={() => { audioService.playButton(); setStartingCheckpoint(highestCheckpoint); }}
                style={{
                  ...styles.waypointPill,
                  borderColor: selectedStartingCheckpoint === highestCheckpoint ? '#ffd166' : 'rgba(143,232,255,0.3)',
                  background: selectedStartingCheckpoint === highestCheckpoint ? 'rgba(255,209,102,0.25)' : 'rgba(11,41,66,0.6)',
                  color: selectedStartingCheckpoint === highestCheckpoint ? '#ffd166' : '#ffffff',
                }}
              >
                Stage {highestStage} ({savedDistance}m)
              </button>
            </div>
          </div>
        )}

        <div style={styles.footerBtns}>
          <button className="big-button secondary" onClick={() => { audioService.playButton(); goTo('worldSelect'); }}>
            ← Back
          </button>
          <button className="big-button" onClick={() => { audioService.playButton(); goTo('game'); }}>
            Start Run ▶
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
  grid: { display: 'flex', gap: '1.2rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 640 },
  card: {
    width: 160,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '1.2rem 1rem',
    borderRadius: 20,
    border: '2px solid',
    background: 'rgba(11,41,66,0.7)',
    color: 'white',
  },
  avatar: { width: 84, height: 84, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  selectedTag: { fontSize: 12, color: '#8fe8ff', fontWeight: 700 },
  footerBtns: { display: 'flex', gap: '1rem', marginTop: '0.5rem' },
  waypointBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(11,41,66,0.8)',
    border: '1.5px solid rgba(143,232,255,0.35)',
    borderRadius: 16,
    padding: '8px 16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
  },
  waypointPill: {
    padding: '5px 14px',
    borderRadius: 999,
    border: '1.5px solid',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
