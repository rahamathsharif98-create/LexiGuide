import React, { useState, useRef, useCallback } from 'react';
import { Card, Button } from '../ui';
import { AudioPlayer } from '../AudioPlayer';
import {
  ChevronLeft,
  RotateCcw,
  Map,
  Lock,
  Unlock,
  Play,
  AlertTriangle,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

/**
 * GameProgressionHub
 *
 * Shared, reusable game entry, stage roadmap selection, checkpoint resume,
 * and restart confirmation interface for LexiGuide games (Space Sound Mission,
 * Word Train, Sky Word Archer).
 *
 * Requirements satisfied:
 * 1. Resume: Continues saved progress when an active checkpoint exists.
 * 2. Restart: Confirmed fresh start with duplicate-click protection.
 * 3. Choose Stage: Visual roadmap of developmental stages/stations.
 *    - Unlocked stages allow direct level jump.
 *    - Locked stages are disabled with clear lock indicator.
 * 4. Rapid-click lockout via synchronous ref guard.
 * 5. Supports both inline card mode (GamePlay) and modal overlay mode (SkyArcher).
 */
export default function GameProgressionHub({
  gameTitle = 'Game',
  gameIcon = '🎮',
  gameBadge = null,
  gameBadgeTestId = 'progression-hub-game-badge',
  instructions = '',
  stages = [],
  currentLevel = 1,
  highestUnlockedLevel = 1,
  hasSavedProgress = false,
  theme = {},
  mode = 'card', // 'card' | 'modal'
  initialView = 'entry', // 'entry' | 'stages' | 'restartConfirm'
  onStart,
  onResume,
  onSelectStage,
  onRestart,
  onClose,
}) {
  const [view, setView] = useState(initialView);
  const isActionLockedRef = useRef(false);

  // Synchronous action guard to prevent double-click / rapid transitions
  const executeGuardedAction = useCallback((actionFn) => {
    if (isActionLockedRef.current) return;
    isActionLockedRef.current = true;
    try {
      actionFn();
    } finally {
      // Release guard after brief tick in case component stays mounted
      setTimeout(() => {
        isActionLockedRef.current = false;
      }, 500);
    }
  }, []);

  const handleStartOrResume = () => {
    executeGuardedAction(() => {
      if (hasSavedProgress && onResume) {
        onResume();
      } else if (onStart) {
        onStart();
      }
    });
  };

  const handleSelectStage = (stage) => {
    const stageNum = stage.stage ?? stage.station ?? 1;
    const startLevel = stage.levelRange?.[0] ?? stage.roundRange?.[0] ?? stage.startLevel ?? 1;
    const endLevel = stage.levelRange?.[1] ?? stage.roundRange?.[1] ?? stage.endLevel ?? startLevel;
    const startLevelIndex = Math.max(0, startLevel - 1);

    const isUnlocked = stageNum === 1 || highestUnlockedLevel >= startLevel;
    if (!isUnlocked) return;

    // If this stage is the current active stage, resume the child's active level; otherwise start at the beginning of the stage
    const resumeLevelIndex = (currentLevel >= startLevel && currentLevel <= endLevel)
      ? currentLevel - 1
      : startLevelIndex;

    executeGuardedAction(() => {
      if (onSelectStage) {
        onSelectStage({
          stageNumber: stageNum,
          startLevel,
          startLevelIndex: resumeLevelIndex,
          stage,
        });
      }
    });
  };

  const handleConfirmRestart = () => {
    executeGuardedAction(() => {
      if (onRestart) {
        onRestart();
      }
      setView('entry');
    });
  };

  const primaryColor = theme.primaryColor || '#13CFE3';
  const mascot = theme.mascot || null;

  // ─────────────────────────────────────────────────────────────
  // View 1: Entry / Overview
  // ─────────────────────────────────────────────────────────────
  const renderEntryView = () => (
    <div className="text-center" data-testid="progression-hub-entry">
      {mascot && (
        <div className="text-xs font-black text-[#0899AA] uppercase tracking-wider mb-2">
          {mascot}
        </div>
      )}

      <div className="w-20 h-20 mx-auto rounded-3xl bg-[#DDF9FC] border border-[#D7EEF1] flex items-center justify-center text-4xl mb-4 shadow-inner">
        {gameIcon}
      </div>

      <h1 className="font-display font-black text-2xl text-[#08233A]">{gameTitle}</h1>

      {gameBadge && (
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F8FA] border border-[#BCEBF2] text-[#0899AA] text-xs font-black uppercase tracking-wider my-2 shadow-2xs"
          data-testid={gameBadgeTestId}
        >
          {gameBadge}
        </div>
      )}

      {hasSavedProgress && (
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF9E6] border border-[#FFE8A3] text-[#B87D00] text-xs font-extrabold my-2 shadow-2xs"
          data-testid="active-checkpoint-indicator"
        >
          <Sparkles size={14} className="text-[#FFC857]" />
          <span>Saved Progress: Level {currentLevel}</span>
        </div>
      )}

      {instructions && (
        <>
          <p className="text-[#527080] font-medium mt-2 mb-4">{instructions}</p>
          <div className="flex justify-center mb-6">
            <AudioPlayer label="Hear instructions" text={instructions} />
          </div>
        </>
      )}

      {/* Main Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
        <Button
          size="lg"
          onClick={handleStartOrResume}
          className="w-full sm:w-auto min-h-[52px] px-8 rounded-2xl font-display font-black text-base border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 shadow-md bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white transition-all cursor-pointer"
          data-testid="start-game-button"
        >
          {hasSavedProgress ? 'Resume Game ▶' : 'Start Game ▶'}
        </Button>

        {stages && stages.length > 0 && (
          <button
            type="button"
            onClick={() => setView('stages')}
            className="w-full sm:w-auto min-h-[52px] px-6 rounded-2xl bg-white border-2 border-[#D7EEF1] hover:border-[#13CFE3] text-[#08233A] font-display font-black text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 hover:bg-[#F2FCFD]"
            data-testid="choose-stage-button"
          >
            <Map size={18} className="text-[#0899AA]" />
            <span>Choose Stage</span>
          </button>
        )}

        {hasSavedProgress && (
          <button
            type="button"
            onClick={() => setView('restartConfirm')}
            className="w-full sm:w-auto min-h-[52px] px-4 rounded-2xl bg-white border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 font-display font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            data-testid="restart-game-button"
            title="Start fresh from Level 1"
          >
            <RotateCcw size={15} />
            <span>Restart</span>
          </button>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // View 2: Stage Selection Roadmap
  // ─────────────────────────────────────────────────────────────
  const renderStagesView = () => (
    <div className="w-full space-y-4" data-testid="stages-roadmap-view">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <button
          type="button"
          onClick={() => (mode === 'modal' && onClose && initialView === 'stages' ? onClose() : setView('entry'))}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-display font-bold text-xs transition-all cursor-pointer"
          data-testid="stage-roadmap-back-btn"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>

        <div className="text-center flex-1 mx-2">
          <h2 className="font-display font-black text-lg text-[#08233A] flex items-center justify-center gap-2">
            <span>🗺️</span>
            <span>Stage Selection</span>
          </h2>
          <p className="text-[11px] font-bold text-[#527080]">
            Highest Unlocked: Level {highestUnlockedLevel}
          </p>
        </div>

        {mode === 'modal' && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1">
        {stages.map((stage, idx) => {
          const stageNum = stage.stage ?? stage.station ?? idx + 1;
          const startLevel = stage.levelRange?.[0] ?? stage.roundRange?.[0] ?? stage.startLevel ?? 1;
          const endLevel = stage.levelRange?.[1] ?? stage.roundRange?.[1] ?? stage.endLevel ?? startLevel;
          const isUnlocked = stageNum === 1 || highestUnlockedLevel >= startLevel;
          const isCompleted = highestUnlockedLevel > endLevel;
          const isCurrent = !isCompleted && currentLevel >= startLevel && currentLevel <= endLevel;

          // Resiliently resolve animal emoji / icon for the icon area:
          const rawBadge = stage.animalEmoji || stage.emoji || stage.badge || stage.icon || '⭐';
          const displayEmoji = typeof rawBadge === 'string'
            ? (rawBadge.match(/\p{Extended_Pictographic}|\p{Emoji}/u)?.[0] || rawBadge.trim().split(/\s+/)[0])
            : rawBadge;

          const stageTitle = stage.title || stage.name || `Stage ${stageNum}`;
          const stageDesc = stage.description || stage.subtitle || `Levels ${startLevel}–${endLevel}`;
          const themeHex = stage.themeColor || primaryColor;

          return (
            <div
              key={`stage-${stageNum}`}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
                isCurrent
                  ? 'bg-[#E6F8FA]/60 border-[#13CFE3] shadow-sm ring-2 ring-[#13CFE3]/30'
                  : isUnlocked
                  ? 'bg-white border-[#D7EEF1] hover:border-[#13CFE3]/80 hover:shadow-xs'
                  : 'bg-slate-50/80 border-slate-200 opacity-75'
              }`}
              data-testid={`stage-card-${stageNum}`}
            >
              {/* Left Column: Compact Icon Area + Content Area */}
              <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                {/* 1. Compact Consistently-Sized Icon Area */}
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-2xs select-none relative overflow-hidden"
                  style={{
                    backgroundColor: isUnlocked ? `${themeHex}20` : '#f1f5f9',
                    border: `2px solid ${isUnlocked ? themeHex : '#cbd5e1'}`,
                  }}
                  data-testid={`stage-icon-area-${stageNum}`}
                >
                  <span className="text-xl sm:text-2xl leading-none" role="img" aria-label={`Stage ${stageNum} icon`}>
                    {displayEmoji}
                  </span>
                  <span
                    className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase mt-1 px-1.5 py-0.5 rounded-md leading-tight font-display"
                    style={{
                      color: isUnlocked ? '#08233A' : '#64748b',
                      backgroundColor: isUnlocked ? `${themeHex}35` : '#e2e8f0',
                    }}
                  >
                    Stage {stageNum}
                  </span>
                </div>

                {/* 2. Content Area */}
                <div className="min-w-0 flex-1 space-y-0.5" data-testid={`stage-content-area-${stageNum}`}>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span
                      className="font-display font-black text-sm sm:text-base text-[#08233A] leading-snug break-words"
                      data-testid={`stage-title-${stageNum}`}
                    >
                      {stageTitle}
                    </span>
                    {isCompleted ? (
                      <span
                        className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[9px] sm:text-[10px] tracking-wide uppercase shrink-0 flex items-center gap-1"
                        data-testid={`stage-status-completed-${stageNum}`}
                      >
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    ) : isCurrent ? (
                      <span
                        className="px-2 py-0.5 rounded-md bg-[#13CFE3] text-[#08233A] font-black text-[9px] sm:text-[10px] tracking-wide uppercase shrink-0"
                        data-testid={`stage-status-current-${stageNum}`}
                      >
                        Current
                      </span>
                    ) : !isUnlocked ? (
                      <span
                        className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 font-black text-[9px] sm:text-[10px] tracking-wide uppercase shrink-0 flex items-center gap-1"
                        data-testid={`stage-status-locked-${stageNum}`}
                      >
                        <Lock size={10} className="text-slate-500" />
                        <span>Locked</span>
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-[#0899AA] leading-tight">
                    Levels {startLevel}–{endLevel}
                  </div>
                  <p className="text-xs text-[#527080] font-medium line-clamp-2 break-words leading-relaxed">
                    {stageDesc}
                  </p>
                  {(stage.themePreview || stageDesc) && (
                    <div
                      className="text-[11px] font-bold text-[#527080] bg-slate-100/90 px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-1 border border-slate-200/60"
                      data-testid={`stage-preview-${stageNum}`}
                    >
                      <span className="text-slate-400">Preview:</span>
                      <span>{stage.themePreview || stageDesc}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Separate Action Area */}
              <div className="w-full sm:w-auto shrink-0 flex items-center justify-end sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => handleSelectStage(stage)}
                    className="w-full sm:w-auto min-h-[40px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-display font-extrabold text-xs shadow-xs transition-all cursor-pointer bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white active:scale-95 border border-[#0899AA]/30"
                    data-testid={`select-stage-${stageNum}`}
                  >
                    <Play size={13} fill="currentColor" />
                    <span>{isCompleted ? 'Replay Stage' : 'Play Stage'}</span>
                  </button>
                ) : (
                  <div
                    className="w-full sm:w-auto min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200/80 text-slate-500 font-display font-bold text-xs"
                    data-testid={`locked-stage-${stageNum}`}
                  >
                    <Lock size={13} />
                    <span>Level {startLevel} Required</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // View 3: Restart Confirmation Dialog
  // ─────────────────────────────────────────────────────────────
  const renderRestartConfirmView = () => (
    <div className="text-center py-2" data-testid="restart-confirm-view">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-500 mb-3 shadow-inner">
        <AlertTriangle size={32} />
      </div>

      <h2 className="font-display font-black text-xl text-[#08233A] mb-1">
        Restart From Level 1?
      </h2>

      <p className="text-[#527080] text-sm font-medium max-w-sm mx-auto mb-6">
        You are currently on <span className="font-bold text-[#08233A]">Level {currentLevel}</span>.
        Starting over will reset your current progress to the beginning. Are you sure you want to restart?
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleConfirmRestart}
          className="w-full sm:w-auto min-h-[46px] px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-display font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          data-testid="confirm-restart-button"
        >
          <RotateCcw size={16} />
          <span>Yes, Restart from Level 1</span>
        </button>

        <button
          type="button"
          onClick={() => setView('entry')}
          className="w-full sm:w-auto min-h-[46px] px-6 rounded-2xl bg-white border-2 border-[#D7EEF1] hover:border-slate-300 text-[#08233A] font-display font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          data-testid="cancel-restart-button"
        >
          <X size={16} />
          <span>Cancel & Keep Progress</span>
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // Mode Container
  // ─────────────────────────────────────────────────────────────
  const content = (
    <>
      {view === 'entry' && renderEntryView()}
      {view === 'stages' && renderStagesView()}
      {view === 'restartConfirm' && renderRestartConfirmView()}
    </>
  );

  if (mode === 'modal') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08233A]/70 backdrop-blur-sm animate-fade-in"
        data-testid="progression-hub-modal"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <Card className="w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_20px_60px_rgba(8,35,58,0.25)] bg-white max-h-[90vh] overflow-y-auto">
          {content}
        </Card>
      </div>
    );
  }

  return (
    <Card
      className="text-center p-6 sm:p-8 rounded-3xl border border-[#D7EEF1] shadow-[0_12px_40px_rgba(8,35,58,0.08)] bg-white w-full"
      data-testid="progression-hub-card"
    >
      {content}
    </Card>
  );
}
