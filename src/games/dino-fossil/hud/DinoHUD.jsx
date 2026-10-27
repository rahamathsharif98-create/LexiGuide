import React from 'react';
import { Volume2, Sparkles, ArrowLeft, RotateCcw, Compass } from 'lucide-react';
import GameSoundToggle from '../../../components/games/GameSoundToggle';

export const TARGET_MEANINGS = {
  'fossil-bone': {
    title: 'BONE',
    badge: 'Ancient Fossil Bone',
    icon: '🦴',
    description: 'A sturdy prehistoric bone from an ancient dinosaur skeleton!',
  },
  'fossil-tail': {
    title: 'TAIL',
    badge: 'Dinosaur Tail',
    icon: '🦎',
    description: 'A mighty armored dinosaur tail with sharp defensive spikes that swishes!',
  },
  'fossil-roar': {
    title: 'ROAR',
    badge: 'Dinosaur Roar',
    icon: '🦖',
    description: 'A dinosaur opening its mouth wide to let out a ferocious, friendly roar!',
  },
  'fossil-claw': {
    title: 'CLAW',
    badge: 'Sharp Talon Claw',
    icon: '🐾',
    description: 'Three sharp curved dinosaur talons for exploring and climbing ancient rocks!',
  },
  'fossil-rex': {
    title: 'T-REX',
    badge: 'Tyrannosaurus Rex',
    icon: '🦖',
    description: 'The iconic king of the dinosaurs with giant jaws, sharp teeth, and small arms!',
  },
  'fossil-fang': {
    title: 'FANG',
    badge: 'Saber Dinosaur Fang',
    icon: '🦷',
    description: 'A razor-sharp fossilized tooth from a prehistoric carnivore with serrated edges!',
  },
  'fossil-horn': {
    title: 'HORN',
    badge: 'Triceratops Horn',
    icon: '🦏',
    description: 'A mighty brow horn fossil used by armored herbivore dinosaurs for defense!',
  },
  'fossil-spine': {
    title: 'SPINE',
    badge: 'Spinosaurus Spine',
    icon: '🦕',
    description: 'A tall prehistoric sail spine that ran along the backbone of giant swimming dinosaurs!',
  },
  'fossil-track': {
    title: 'TRACK',
    badge: 'Fossil Dinosaur Track',
    icon: '🐾',
    description: 'A giant three-toed footprint preserved in stone from a wandering ancient giant!',
  },
  'fossil-skull': {
    title: 'SKULL',
    badge: 'Armored Dinosaur Skull',
    icon: '💀',
    description: 'A magnificent prehistoric skull with eye sockets and armored crest plates!',
  },
};

export default function DinoHUD({
  target,
  excavatedChunks = [],
  score = 0,
  stars = 0,
  streak = 1,
  isExcavated = false,
  onSpeakPrompt,
  onSpeakWord,
  onResetFossil,
  onBack,
}) {
  const chunks = [target?.onset, target?.rime];
  const meaning = TARGET_MEANINGS[target?.id] || {
    title: target?.name || 'FOSSIL',
    badge: '🦖 Dinosaur Specimen',
    icon: target?.emoji || '🦖',
    description: `You uncovered the prehistoric ${target?.name} specimen!`,
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 font-sans select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Left: Back & Voice */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-stone-900/85 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-amber-600/40 shadow-lg transition-all active:scale-95"
            aria-label="Back to Games"
          >
            <ArrowLeft className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold hidden sm:inline">Back</span>
          </button>

          <button
            onClick={onSpeakPrompt}
            className="flex items-center gap-2 bg-amber-600/85 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl backdrop-blur-md border border-amber-300/40 shadow-lg transition-all active:scale-95"
            title="Hear Paleontologist Hint"
          >
            <Volume2 className="w-5 h-5 text-amber-200 animate-pulse" />
            <span className="text-sm font-medium hidden sm:inline">Hear Clue</span>
          </button>

          <GameSoundToggle />

          <button
            onClick={onResetFossil}
            className="p-2 bg-stone-900/85 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl backdrop-blur-md border border-amber-600/40 transition-all active:scale-95"
            title="Reset Dig Site"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Fossil Blend Specimen Banner */}
        <div className="bg-stone-900/90 border-2 border-amber-500/60 rounded-2xl px-6 py-2.5 backdrop-blur-md shadow-2xl flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="Specimen emoji">
            {target?.emoji || '🦖'}
          </span>
          <div className="flex items-center gap-2">
            {chunks.map((chunk, idx) => {
              const isFound = idx < excavatedChunks.length;
              const isNext = idx === excavatedChunks.length;
              return (
                <React.Fragment key={`chunk-${idx}`}>
                  <div
                    className={`px-3.5 py-1 rounded-xl font-black text-lg transition-all duration-300 ${
                      isFound
                        ? 'bg-amber-500 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.8)] scale-105 border border-amber-200'
                        : isNext
                        ? 'bg-stone-800 text-amber-300 border-2 border-dashed border-amber-400 animate-pulse'
                        : 'bg-stone-800/60 text-stone-500 border border-stone-700'
                    }`}
                  >
                    {isFound ? chunk : isNext ? '?' : chunk}
                  </div>
                  {idx === 0 && <span className="text-amber-400 font-extrabold text-sm">+</span>}
                </React.Fragment>
              );
            })}
            <span className="text-amber-400 font-extrabold text-sm">=</span>
            <span className="font-black text-xl text-amber-300 tracking-wider">
              {target?.name}
            </span>
          </div>
        </div>

        {/* Right: Score & Stars */}
        <div className="flex items-center gap-3">
          <div className="bg-stone-900/85 border border-amber-500/40 rounded-xl px-3.5 py-2 flex items-center gap-2 backdrop-blur-md text-amber-300 font-bold text-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{score} PTS</span>
            {streak > 1 && (
              <span className="bg-amber-500 text-stone-950 text-xs px-1.5 py-0.5 rounded-full font-black">
                x{streak}
              </span>
            )}
          </div>
          <div className="bg-stone-900/85 border border-yellow-500/40 rounded-xl px-3.5 py-2 flex items-center gap-1.5 backdrop-blur-md text-yellow-300 font-bold text-sm shadow-lg">
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Fossil Victory Meaning Showcase */}
      {isExcavated && (
        <div
          data-testid="fossil-meaning-visual"
          data-target-id={target?.id}
          className="self-center bg-stone-900/95 border-3 border-amber-400 rounded-3xl p-5 sm:p-6 text-white shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-4 max-w-lg mx-auto pointer-events-auto animate-bounce z-30"
        >
          {/* Recognizable Meaning Shape / Icon Badge */}
          <div
            data-testid={`meaning-shape-${target?.id || 'default'}`}
            className="w-20 h-20 rounded-2xl bg-amber-500/30 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-inner shrink-0"
          >
            <span role="img" aria-label={meaning.title}>
              {meaning.icon}
            </span>
          </div>

          {/* Meaning Description & Audio Pronunciation */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider mb-0.5">
              🦴 ROAAAR! FOSSIL EXCAVATED! 🦴
            </p>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wide mb-1">
              {meaning.badge}
            </span>
            <h2 className="text-2xl font-black text-amber-200 tracking-wide">
              {meaning.title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-semibold mt-1">
              {meaning.description}
            </p>

            <button
              type="button"
              onClick={onSpeakWord || onSpeakPrompt}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              aria-label={`Hear ${target?.name} pronounced`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Hear "{target?.name}" 🔊</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. BOTTOM: Guidance & Specimen Log */}
      <div className="flex items-end justify-between pointer-events-auto">
        <div className="bg-stone-900/85 border border-amber-700/60 rounded-xl p-3 max-w-sm text-xs text-stone-300 backdrop-blur-md shadow-lg">
          <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" /> Paleontology Dig:
          </p>
          <p>
            Dust off ancient fossil stones in onset + rime order to reassemble the prehistoric dinosaur specimen!
          </p>
        </div>

        <div className="bg-stone-900/90 border border-amber-500/50 rounded-2xl px-5 py-3 backdrop-blur-md text-right shadow-2xl">
          <p className="text-xs text-amber-400 font-bold">FOSSILS RESTORED</p>
          <p className="text-xl font-black text-white">
            {excavatedChunks.length} / 2
          </p>
        </div>
      </div>
    </div>
  );
}
