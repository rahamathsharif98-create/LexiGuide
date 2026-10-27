import React from 'react';
import { Flame, Sparkles } from 'lucide-react';

/**
 * VFXFeverOverlay
 * High-energy rainbow edge glow and combo badge when streak >= 3!
 */
export default function VFXFeverOverlay({
  streak = 1,
  combo,
  active,
  bannerClassName = '',
}) {
  const currentStreak = combo ?? streak;
  const isActive = active !== undefined ? active : currentStreak >= 3;
  if (!isActive) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {/* Radiant Rainbow Border Glow */}
      <div className="absolute inset-0 border-4 border-amber-400/80 shadow-[inset_0_0_35px_rgba(245,158,11,0.5)] animate-pulse rounded-2xl" />

      {/* High Energy Fever Banner positioned safely so it never obscures HUD elements */}
      <div
        data-testid="fever-banner"
        className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-2xl animate-bounce border-2 border-yellow-200 ${
          bannerClassName || 'top-28 sm:top-28'
        }`}
      >
        <Flame className="w-4 h-4 text-yellow-200 fill-yellow-200 animate-spin" />
        <span>Fever Mode x{currentStreak}! 2X Points</span>
        <Sparkles className="w-4 h-4 text-yellow-200 fill-yellow-200" />
      </div>
    </div>
  );
}
