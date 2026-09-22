import React, { useState, useEffect } from 'react';
import { Volume2, Music, VolumeX } from 'lucide-react';
import { gameSound } from '../../services/gameSoundService';

export default function GameSoundToggle({ className = '' }) {
  const [mode, setMode] = useState(() => gameSound.getSoundMode());

  useEffect(() => {
    return gameSound.subscribe((newMode) => {
      setMode(newMode);
    });
  }, []);

  const handleCycle = (e) => {
    e.stopPropagation();
    gameSound.cycleSoundMode();
  };

  const config = {
    voice_and_sfx: {
      icon: Volume2,
      label: 'Voice + Chimes',
      bgColor: 'bg-emerald-500/80 hover:bg-emerald-500 text-white',
      border: 'border-emerald-300',
    },
    sfx_only: {
      icon: Music,
      label: 'Chimes Only (No Voice)',
      bgColor: 'bg-indigo-500/80 hover:bg-indigo-500 text-white',
      border: 'border-indigo-300',
    },
    muted: {
      icon: VolumeX,
      label: 'Muted',
      bgColor: 'bg-slate-600/80 hover:bg-slate-600 text-slate-200',
      border: 'border-slate-400',
    },
  }[mode] || {
    icon: Volume2,
    label: 'Sound On',
    bgColor: 'bg-emerald-500/80 text-white',
    border: 'border-emerald-300',
  };

  const Icon = config.icon;

  return (
    <button
      onClick={handleCycle}
      title={`Audio: ${config.label}. Click to cycle.`}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md backdrop-blur border ${config.bgColor} ${config.border} active:scale-95 cursor-pointer ${className}`}
    >
      <Icon className="w-3.5 h-3.5 animate-pulse" />
      <span className="hidden sm:inline">{config.label}</span>
    </button>
  );
}
