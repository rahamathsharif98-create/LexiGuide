import { useMemo } from 'react';

// A lightweight, fully-CSS animated background used behind menu screens
// (start, select, settings, results). Avoids spinning up a 3D canvas when a
// simple ambient scene is enough — keeps menu navigation instant.
export default function MagicalBackdrop({ dim = false }) {
  const particles = useMemo(
    () =>
      new Array(26).fill(0).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 8,
        size: 2 + Math.random() * 4,
      })),
    []
  );

  const flames = useMemo(
    () =>
      new Array(6).fill(0).map((_, i) => ({
        id: i,
        left: 6 + i * 18 + (i % 2 === 0 ? 0 : 4),
        delay: Math.random() * 2,
      })),
    []
  );

  return (
    <div style={{ ...styles.root, opacity: dim ? 0.35 : 1 }}>
      <div style={styles.sky} />
      <div style={styles.glow} />
      {flames.map((f) => (
        <div key={f.id} style={{ ...styles.flameWrap, left: `${f.left}%`, animationDelay: `${f.delay}s` }}>
          <div style={styles.flameCore} />
          <div style={styles.flameOuter} />
          <div style={styles.pillar} />
        </div>
      ))}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            ...styles.particle,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <div style={styles.ground} />
    </div>
  );
}

const styles = {
  root: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, #071a2e 0%, #0d3252 55%, #123a5c 100%)',
    overflow: 'hidden',
  },
  sky: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 50% 20%, rgba(143,232,255,0.25), transparent 55%)',
  },
  glow: {
    position: 'absolute',
    top: '10%',
    left: '50%',
    width: 500,
    height: 500,
    transform: 'translateX(-50%)',
    background: 'radial-gradient(circle, rgba(56,225,255,0.28), transparent 65%)',
    filter: 'blur(10px)',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '18%',
    background: 'linear-gradient(180deg, rgba(11,41,66,0) 0%, rgba(6,20,34,0.9) 100%)',
  },
  flameWrap: {
    position: 'absolute',
    bottom: '14%',
    width: 14,
    height: 90,
    animation: 'flame-flicker 2.4s ease-in-out infinite',
  },
  flameCore: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 10,
    height: 34,
    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
    background: 'radial-gradient(circle, #eafcff 0%, #8fe8ff 55%, transparent 80%)',
    boxShadow: '0 0 18px 6px rgba(143,232,255,0.7)',
  },
  flameOuter: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 20,
    height: 50,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,150,255,0.55) 0%, transparent 70%)',
    filter: 'blur(2px)',
  },
  pillar: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 16,
    height: 42,
    background: 'linear-gradient(180deg, #3a5c78, #22394d)',
    borderRadius: 3,
  },
  particle: {
    position: 'absolute',
    top: '-5%',
    borderRadius: '50%',
    background: 'rgba(143,232,255,0.8)',
    boxShadow: '0 0 6px 2px rgba(143,232,255,0.6)',
    animationName: 'particle-fall',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
};

// Inject keyframes once.
if (typeof document !== 'undefined' && !document.getElementById('magical-backdrop-keyframes')) {
  const style = document.createElement('style');
  style.id = 'magical-backdrop-keyframes';
  style.innerHTML = `
    @keyframes flame-flicker {
      0%, 100% { transform: scaleY(1) scaleX(1); }
      25% { transform: scaleY(1.08) scaleX(0.95); }
      50% { transform: scaleY(0.94) scaleX(1.05); }
      75% { transform: scaleY(1.05) scaleX(0.97); }
    }
    @keyframes particle-fall {
      0% { transform: translateY(0); opacity: 0; }
      10% { opacity: 0.9; }
      90% { opacity: 0.6; }
      100% { transform: translateY(110vh); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
