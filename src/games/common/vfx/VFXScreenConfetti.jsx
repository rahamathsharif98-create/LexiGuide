import React, { useEffect, useState } from 'react';

/**
 * VFXScreenConfetti
 * Colorful 2D celebration confetti overlay when winning or completing a craft/word.
 */
export default function VFXScreenConfetti({ active = false, duration = 3000 }) {
  const [particles, setParticles] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#eab308'];
    const items = [];

    for (let i = 0; i < 60; i++) {
      items.push({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1.5,
        size: 8 + Math.random() * 8,
        rotate: Math.random() * 360,
      });
    }

    setParticles(items);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-40">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-bounce"
          style={{
            left: `${p.left}%`,
            top: `-20px`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `fallDown ${p.duration}s ease-in-out ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes fallDown {
          0% {
            transform: translateY(0) rotate(0deg) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translateY(650px) rotate(720deg) scale(1.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
