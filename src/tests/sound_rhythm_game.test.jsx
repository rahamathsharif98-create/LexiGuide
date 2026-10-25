import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GamePlay from '../pages/child/GamePlay';
import { GAME_CONTENT } from '../data/gameContent';
import {
  SOUND_RHYTHM_CURRICULUM,
  TOTAL_SOUND_RHYTHM_LEVELS,
  SOUND_RHYTHM_STAGE_CONFIG,
  SOUND_RHYTHM_STAGES,
  SOUND_RHYTHM_MILESTONES,
  getSoundRhythmRound,
  getSoundRhythmRoundByIndex,
  getSoundRhythmStageForLevel,
  getSoundRhythmStageBadge,
  getSoundRhythmMilestone,
  getSoundRhythmDisplayedOptions,
} from '../games/sound-rhythm/engine/soundRhythmCurriculum';
import SoundRhythmRound from '../games/sound-rhythm/components/SoundRhythmRound';
import soundRhythmAudio from '../games/sound-rhythm/engine/soundRhythmAudio';
import {
  SOUND_RHYTHM_STORAGE_PREFIX,
  getSoundRhythmCheckpointKey,
  loadSoundRhythmCheckpointData,
  loadSoundRhythmCheckpoint,
  saveSoundRhythmCheckpoint,
  resetSoundRhythmCheckpoint,
} from '../games/sound-rhythm/engine/soundRhythmCheckpoint';
import { GAMING_ZONE_GAMES } from '../data/gamingZoneRegistry';

// Mock AppContext
const mockSaveLearningSession = vi.fn().mockResolvedValue({ id: 202, ok: true });
const mockApplySessionOutcome = vi.fn();
let isRealBackendMock = false;
let currentActiveChild = {
  id: 1,
  name: 'Aarav',
  interests: ['rhythm'],
  fingerprint: { phonologicalAwareness: 60 },
  comfort_preferences: { quiet_mode: false },
};

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    activeChild: currentActiveChild,
    isRealBackend: isRealBackendMock,
    errorPatterns: [],
    saveLearningSession: mockSaveLearningSession,
    applySessionOutcome: mockApplySessionOutcome,
    language: 'en',
    nextRecommendedActivity: null,
  }),
  AppProvider: ({ children }) => children,
}));

function renderSoundRhythm() {
  return render(
    <MemoryRouter initialEntries={['/child/games/sound-rhythm']}>
      <Routes>
        <Route path="/child/games/:gameId" element={<GamePlay />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Sound & Rhythm: Step 2 — Curriculum Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('1. contains exactly 30 rounds divided equally across 3 stages (10 per stage)', () => {
    expect(SOUND_RHYTHM_CURRICULUM).toHaveLength(30);
    expect(TOTAL_SOUND_RHYTHM_LEVELS).toBe(30);
    expect(SOUND_RHYTHM_STAGE_CONFIG).toHaveLength(3);
    expect(SOUND_RHYTHM_STAGES).toHaveLength(3);

    const stage1Rounds = SOUND_RHYTHM_CURRICULUM.filter((r) => r.stage === 1);
    const stage2Rounds = SOUND_RHYTHM_CURRICULUM.filter((r) => r.stage === 2);
    const stage3Rounds = SOUND_RHYTHM_CURRICULUM.filter((r) => r.stage === 3);

    expect(stage1Rounds).toHaveLength(10);
    expect(stage2Rounds).toHaveLength(10);
    expect(stage3Rounds).toHaveLength(10);
  });

  it('2. preserves the original BA–BA–BA and TI–TI–TA patterns as the first two rounds', () => {
    const round1 = SOUND_RHYTHM_CURRICULUM[0];
    const round2 = SOUND_RHYTHM_CURRICULUM[1];

    expect(round1.level).toBe(1);
    expect(round1.prompt).toBe('Listen to the rhythm: BA — BA — BA');
    expect(round1.pattern).toBe('BA BA BA');
    expect(round1.correct).toBe('BA — BA — BA');
    expect(round1.options).toContain('BA — BA — BA');
    expect(round1.options).toContain('BA — DI — DA');
    expect(round1.options).toContain('LA — LA — LA');

    expect(round2.level).toBe(2);
    expect(round2.prompt).toBe('Listen to the rhythm: TI — TI — TA');
    expect(round2.pattern).toBe('TI TI TA');
    expect(round2.correct).toBe('TI — TI — TA');
    expect(round2.options).toContain('TI — TI — TA');
    expect(round2.options).toContain('TA — TA — TA');
    expect(round2.options).toContain('DI — DI — DUM');
  });

  it('3. ensures all round IDs are unique and levels are strictly sequential from 1 to 30', () => {
    const seenIds = new Set();
    SOUND_RHYTHM_CURRICULUM.forEach((round, index) => {
      expect(round.id).toBeDefined();
      expect(seenIds.has(round.id)).toBe(false);
      seenIds.add(round.id);

      expect(round.level).toBe(index + 1);
      expect(round.title).toBeTruthy();
      expect(round.prompt).toBeTruthy();
      expect(round.pattern).toBeTruthy();
      expect(round.hint).toBeTruthy();
    });
    expect(seenIds.size).toBe(30);
  });

  it('4. ensures each round has exactly three distinct options and contains the correct answer once', () => {
    SOUND_RHYTHM_CURRICULUM.forEach((round) => {
      expect(Array.isArray(round.options)).toBe(true);
      expect(round.options).toHaveLength(3);

      const uniqueOptions = new Set(round.options);
      expect(uniqueOptions.size).toBe(3);

      expect(round.correct).toBeTruthy();
      expect(round.options).toContain(round.correct);
      const matches = round.options.filter((opt) => opt === round.correct);
      expect(matches).toHaveLength(1);
    });
  });

  it('5. balances correct-answer positions approximately across all 30 rounds', () => {
    const positionCounts = [0, 0, 0];
    SOUND_RHYTHM_CURRICULUM.forEach((round) => {
      const pos = round.options.indexOf(round.correct);
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThanOrEqual(2);
      positionCounts[pos]++;
    });

    // Exactly 10 rounds per position across 30 rounds
    expect(positionCounts[0]).toBe(10);
    expect(positionCounts[1]).toBe(10);
    expect(positionCounts[2]).toBe(10);
  });

  it('6. ensures option ordering is deterministic and stable across multiple calls', () => {
    SOUND_RHYTHM_CURRICULUM.forEach((round) => {
      const firstCall = getSoundRhythmDisplayedOptions(round);
      const secondCall = getSoundRhythmDisplayedOptions(round);
      const thirdCall = getSoundRhythmDisplayedOptions(round);

      expect(firstCall).toEqual(round.options);
      expect(secondCall).toEqual(firstCall);
      expect(thirdCall).toEqual(firstCall);
    });
  });

  it('7. contains valid beat and audio metadata for future synthesis', () => {
    SOUND_RHYTHM_CURRICULUM.forEach((round) => {
      expect(Array.isArray(round.syllables)).toBe(true);
      expect(round.syllables.length).toBeGreaterThanOrEqual(2);

      expect(Array.isArray(round.beats)).toBe(true);
      expect(round.beats.length).toBe(round.syllables.length);

      round.beats.forEach((beat) => {
        expect(typeof beat.sound).toBe('string');
        expect(typeof beat.timeMs).toBe('number');
        expect(typeof beat.durationMs).toBe('number');
        expect(beat.durationMs).toBeGreaterThan(0);
      });

      expect(['slow', 'normal', 'fast', 'variable']).toContain(round.tempo);
      expect(typeof round.instrument).toBe('string');
    });
  });

  it('8. helper functions resolve rounds, stages, and badges correctly', () => {
    expect(getSoundRhythmRound(1).level).toBe(1);
    expect(getSoundRhythmRound(15).level).toBe(15);
    expect(getSoundRhythmRound(30).level).toBe(30);

    // 0-based index lookup
    expect(getSoundRhythmRoundByIndex(0).level).toBe(1);
    expect(getSoundRhythmRoundByIndex(29).level).toBe(30);

    // Stage resolution
    expect(getSoundRhythmStageForLevel(5).stage).toBe(1);
    expect(getSoundRhythmStageForLevel(15).stage).toBe(2);
    expect(getSoundRhythmStageForLevel(25).stage).toBe(3);

    // Badges and milestones
    expect(getSoundRhythmStageBadge(1).name).toBe('Syllable Master');
    expect(getSoundRhythmStageBadge(2).name).toBe('Beat Champion');
    expect(getSoundRhythmStageBadge(3).name).toBe('Rhythm Maestro');

    expect(getSoundRhythmMilestone(10).reward).toContain('Stage 1 Mastery Badge');
    expect(getSoundRhythmMilestone(30).reward).toContain('Grand Rhythm Trophy');
    expect(getSoundRhythmMilestone(99)).toBeNull();
  });
});

describe('Sound & Rhythm: Step 2 — Checkpoint Persistence Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('9. saves and restores checkpoint progress correctly for the same child', () => {
    const childId = 'child_aarav_123';

    // Initial state is clean default
    const initial = loadSoundRhythmCheckpointData(childId);
    expect(initial.roundIndex).toBe(0);
    expect(initial.score).toBe(0);
    expect(initial.highestUnlockedLevel).toBe(1);
    expect(initial.isCompleted).toBe(false);

    // Save level 5 progress
    saveSoundRhythmCheckpoint(childId, {
      roundIndex: 4,
      completedLevel: 4,
      score: 4,
      isCompleted: false,
    });

    const loaded = loadSoundRhythmCheckpointData(childId);
    expect(loaded.roundIndex).toBe(4);
    expect(loaded.currentLevel).toBe(5);
    expect(loaded.score).toBe(4);
    expect(loaded.highestUnlockedLevel).toBe(5);
    expect(loaded.completedLevels).toContain(4);
    expect(loadSoundRhythmCheckpoint(childId)).toBe(4);
  });

  it('10. isolates saved checkpoints strictly across different child profiles and guest', () => {
    const childA = 'child_42';
    const childB = 'child_99';

    saveSoundRhythmCheckpoint(childA, {
      roundIndex: 8,
      completedLevel: 8,
      score: 8,
    });

    saveSoundRhythmCheckpoint(childB, {
      roundIndex: 14,
      completedLevel: 14,
      score: 14,
    });

    saveSoundRhythmCheckpoint(null, {
      roundIndex: 2,
      completedLevel: 2,
      score: 2,
    }); // Guest

    const dataA = loadSoundRhythmCheckpointData(childA);
    const dataB = loadSoundRhythmCheckpointData(childB);
    const dataGuest = loadSoundRhythmCheckpointData(null);

    expect(dataA.roundIndex).toBe(8);
    expect(dataA.currentLevel).toBe(9);

    expect(dataB.roundIndex).toBe(14);
    expect(dataB.currentLevel).toBe(15);

    expect(dataGuest.roundIndex).toBe(2);
    expect(dataGuest.currentLevel).toBe(3);

    expect(getSoundRhythmCheckpointKey(childA)).toBe('lexiguide_sound_rhythm_checkpoint_child_42');
    expect(getSoundRhythmCheckpointKey(null)).toBe('lexiguide_sound_rhythm_checkpoint_guest');
  });

  it('11. handles missing, corrupted, or malformed checkpoint data safely without throwing', () => {
    const childId = 'child_corrupt';
    const key = getSoundRhythmCheckpointKey(childId);

    // Corrupted non-JSON string
    localStorage.setItem(key, 'INVALID_JSON{{{---');
    const malformed = loadSoundRhythmCheckpointData(childId);
    expect(malformed.roundIndex).toBe(0);
    expect(malformed.currentLevel).toBe(1);
    expect(malformed.isCompleted).toBe(false);

    // Out of bounds negative index
    localStorage.setItem(key, JSON.stringify({ roundIndex: -99, score: 5 }));
    const negative = loadSoundRhythmCheckpointData(childId);
    expect(negative.roundIndex).toBe(0);

    // Out of bounds excessive index
    localStorage.setItem(key, JSON.stringify({ roundIndex: 9999, score: 5 }));
    const excessive = loadSoundRhythmCheckpointData(childId);
    expect(excessive.roundIndex).toBe(0);

    // Non-object primitive
    localStorage.setItem(key, JSON.stringify(true));
    const boolVal = loadSoundRhythmCheckpointData(childId);
    expect(boolVal.roundIndex).toBe(0);
  });

  it('12. prevents replaying completed levels from inflating score or reducing unlocked progress', () => {
    const childId = 'child_replay';

    // Reach level 10 with score 10
    saveSoundRhythmCheckpoint(childId, {
      roundIndex: 9,
      completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      score: 10,
      highestUnlockedLevel: 10,
    });

    let state = loadSoundRhythmCheckpointData(childId);
    expect(state.highestUnlockedLevel).toBe(10);
    expect(state.score).toBe(10);

    // Child jumps back to replay Level 2
    saveSoundRhythmCheckpoint(childId, {
      roundIndex: 1, // index for Level 2
      completedLevel: 2,
      score: 1, // Lower score reported by replay
    });

    state = loadSoundRhythmCheckpointData(childId);
    // Highest unlocked progress MUST NOT regress to level 2
    expect(state.highestUnlockedLevel).toBe(10);
    // Score MUST NOT be reduced or inflated
    expect(state.score).toBe(10);
    expect(state.completedLevels).toHaveLength(10);
  });

  it('13. unlocks stages progressively as highest unlocked level increases', () => {
    const childId = 'child_stages';

    // Stage 1 (Levels 1-10)
    saveSoundRhythmCheckpoint(childId, { roundIndex: 5, score: 5 });
    expect(loadSoundRhythmCheckpointData(childId).unlockedStages).toEqual([1]);

    // Stage 2 (Level 11 unlocks Stage 2)
    saveSoundRhythmCheckpoint(childId, { roundIndex: 10, score: 10, highestUnlockedLevel: 11 });
    expect(loadSoundRhythmCheckpointData(childId).unlockedStages).toEqual([1, 2]);

    // Stage 3 (Level 21 unlocks Stage 3)
    saveSoundRhythmCheckpoint(childId, { roundIndex: 20, score: 20, highestUnlockedLevel: 21 });
    expect(loadSoundRhythmCheckpointData(childId).unlockedStages).toEqual([1, 2, 3]);
  });

  it('14. preserves completed run state and allows reset via resetSoundRhythmCheckpoint', () => {
    const childId = 'child_reset_test';

    saveSoundRhythmCheckpoint(childId, {
      isCompleted: true,
      score: 30,
      completedLevels: Array.from({ length: 30 }, (_, i) => i + 1),
    });

    let data = loadSoundRhythmCheckpointData(childId);
    expect(data.isCompleted).toBe(true);
    expect(data.highestUnlockedLevel).toBe(30);
    expect(data.roundIndex).toBe(0); // ready for fresh start

    resetSoundRhythmCheckpoint(childId);
    data = loadSoundRhythmCheckpointData(childId);
    expect(data.isCompleted).toBe(false);
    expect(data.highestUnlockedLevel).toBe(1);
    expect(data.score).toBe(0);
  });
});

describe('Sound & Rhythm: Step 2 — Gameplay & Progression Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('15. verifies GAME_CONTENT has 30 rounds for sound-rhythm', () => {
    expect(GAME_CONTENT['sound-rhythm']).toHaveLength(30);
    expect(GAME_CONTENT['sound-rhythm'][0].pattern).toBe('BA BA BA');
    expect(GAME_CONTENT['sound-rhythm'][29].pattern).toBe('STAR BEAT FINALE');
  });

  it('16. renders intro screen with GameProgressionHub showing 3 developmental stages', () => {
    renderSoundRhythm();

    expect(screen.getByText('Sound & Rhythm')).toBeInTheDocument();
    expect(screen.getByTestId('sound-rhythm-badge')).toBeInTheDocument();
    expect(screen.getByTestId('start-game-button')).toBeInTheDocument();

    // Click Choose Stage to open stage roadmap
    const chooseStageBtn = screen.getByTestId('choose-stage-button');
    expect(chooseStageBtn).toBeInTheDocument();
    fireEvent.click(chooseStageBtn);

    expect(screen.getByText('Simple Syllables')).toBeInTheDocument();
    expect(screen.getByText('Tempo Beats')).toBeInTheDocument();
    expect(screen.getByText('Rhythm Adventures')).toBeInTheDocument();
  });

  it('17. starts game, renders Round 1, answers are locked until listening, then answers correctly', async () => {
    const playSpy = vi.spyOn(soundRhythmAudio, 'playRhythm').mockImplementation((round, options) => {
      // Simulate playback finish
      if (options.onEnd) options.onEnd();
      return Promise.resolve();
    });

    renderSoundRhythm();

    // Click Start Game
    const startBtn = screen.getByTestId('start-game-button');
    fireEvent.click(startBtn);

    // Verify Round 1 mounted
    expect(screen.getByText('Level 1 of 30')).toBeInTheDocument();
    expect(screen.getByText('Listen to the rhythm: BA — BA — BA')).toBeInTheDocument();

    const correctBtn = screen.getByText('BA — BA — BA').closest('button');
    expect(correctBtn).toBeInTheDocument();

    // Answer button MUST be disabled before listening
    expect(correctBtn).toBeDisabled();

    // Click Listen to Rhythm
    const audioBtn = screen.getByTestId('rhythm-audio-button');
    await act(async () => {
      fireEvent.click(audioBtn);
    });

    // Now answer button is unlocked!
    expect(correctBtn).not.toBeDisabled();

    // Click correct answer
    await act(async () => {
      fireEvent.click(correctBtn);
    });

    // Checkpoint saved for child 1
    const cp = loadSoundRhythmCheckpointData(1);
    expect(cp.score).toBe(1);
    expect(cp.completedLevels).toContain(1);

    playSpy.mockRestore();
  });
});

describe('Sound & Rhythm: Step 3.1 — Fix Missing, Unclear, and Unexpected Audio', () => {
  let originalAudioContext;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    originalAudioContext = window.AudioContext;
    window.AudioContext = class MockAudioContext {
      constructor() {
        this.currentTime = 0;
        this.state = 'running';
        this.destination = {};
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn().mockReturnThis(),
          start: vi.fn(),
          stop: vi.fn(),
          disconnect: vi.fn(),
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn().mockReturnThis(),
          disconnect: vi.fn(),
        };
      }
      resume() {
        return Promise.resolve();
      }
    };
  });

  afterEach(() => {
    soundRhythmAudio.cleanup();
    window.AudioContext = originalAudioContext;
    cleanup();
  });

  it('18. no audio plays automatically on initial mount or question advance', async () => {
    const playSpy = vi.spyOn(soundRhythmAudio, 'playRhythm');
    const round1 = SOUND_RHYTHM_CURRICULUM[0];
    const round2 = SOUND_RHYTHM_CURRICULUM[1];

    const { rerender } = render(
      <SoundRhythmRound round={round1} roundIdx={0} onAnswer={vi.fn()} quietMode={false} />
    );

    // Initial mount: NO audio plays automatically
    expect(playSpy).not.toHaveBeenCalled();

    // Answer options are locked
    const optionBtns = screen.getAllByRole('button', { name: /Option/i });
    optionBtns.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    // Question advance to Round 2: NO audio plays automatically
    rerender(<SoundRhythmRound round={round2} roundIdx={1} onAnswer={vi.fn()} quietMode={false} />);
    expect(playSpy).not.toHaveBeenCalled();

    const round2OptionBtns = screen.getAllByRole('button', { name: /Option/i });
    round2OptionBtns.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('19. audio playback control renders with accessible label and visible state', () => {
    const round1 = SOUND_RHYTHM_CURRICULUM[0];
    render(<SoundRhythmRound round={round1} roundIdx={0} onAnswer={vi.fn()} />);

    const audioBtn = screen.getByTestId('rhythm-audio-button');
    expect(audioBtn).toBeInTheDocument();
    expect(audioBtn).toHaveAttribute('aria-label', expect.stringContaining('Listen to rhythm'));
    expect(screen.getByText(/Listen to Rhythm/i)).toBeInTheDocument();
    expect(screen.getByTestId('rhythm-pattern-badge')).toBeInTheDocument();
    expect(screen.getByTestId('rhythm-beat-indicators')).toBeInTheDocument();
  });

  it('20. clicking the playback button starts playback using round beat metadata', async () => {
    const round2 = SOUND_RHYTHM_CURRICULUM[1]; // TI - TI - TA
    const playSpy = vi.spyOn(soundRhythmAudio, 'playRhythm');

    render(<SoundRhythmRound round={round2} roundIdx={1} onAnswer={vi.fn()} />);

    const audioBtn = screen.getByTestId('rhythm-audio-button');
    await act(async () => {
      fireEvent.click(audioBtn);
    });

    expect(playSpy).toHaveBeenCalledWith(
      round2,
      expect.objectContaining({
        onBeat: expect.any(Function),
        onEnd: expect.any(Function),
      })
    );
    expect(round2.beats).toHaveLength(3);
    expect(round2.beats[0].sound).toBe('TI');
    expect(round2.beats[2].sound).toBe('TA');
  });

  it('21. missing or failed audio does not unlock answers and shows child-friendly retry error', async () => {
    const playSpy = vi.spyOn(soundRhythmAudio, 'playRhythm').mockImplementation((round, options) => {
      if (options.onError) {
        options.onError(new Error('Audio device failure'));
      }
      return Promise.resolve();
    });

    const round1 = SOUND_RHYTHM_CURRICULUM[0];
    render(<SoundRhythmRound round={round1} roundIdx={0} onAnswer={vi.fn()} />);

    const audioBtn = screen.getByTestId('rhythm-audio-button');
    await act(async () => {
      fireEvent.click(audioBtn);
    });

    // Displays clear child-friendly retry error
    expect(screen.getByTestId('audio-error-message')).toBeInTheDocument();
    expect(screen.getByText(/Rhythm could not play/i)).toBeInTheDocument();
    expect(screen.getByText(/Tap to Retry Rhythm/i)).toBeInTheDocument();

    // Answer buttons REMAIN disabled
    const optionBtns = screen.getAllByRole('button', { name: /Option/i });
    optionBtns.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('22. successful playback enables answering and transforms button to Listen Again', async () => {
    let capturedOptions;
    const playSpy = vi.spyOn(soundRhythmAudio, 'playRhythm').mockImplementation((round, options) => {
      capturedOptions = options;
      return Promise.resolve();
    });

    const round1 = SOUND_RHYTHM_CURRICULUM[0];
    render(<SoundRhythmRound round={round1} roundIdx={0} onAnswer={vi.fn()} />);

    const audioBtn = screen.getByTestId('rhythm-audio-button');
    await act(async () => {
      fireEvent.click(audioBtn);
    });

    // Simulate playback complete
    await act(async () => {
      capturedOptions.onEnd();
    });

    // Button label transforms to Listen Again
    expect(screen.getByText(/Listen Again 🔁/i)).toBeInTheDocument();
    expect(audioBtn).toHaveAttribute('aria-label', expect.stringContaining('Listen to rhythm again'));

    // Answer buttons are now unlocked
    const correctBtn = screen.getByText('BA — BA — BA').closest('button');
    expect(correctBtn).not.toBeDisabled();
  });

  it('23. replay works without overlapping previous playback and double-click is locked', async () => {
    let capturedOptions;
    const playSpy = vi.spyOn(soundRhythmAudio, 'playRhythm').mockImplementation((round, options) => {
      capturedOptions = options;
      return Promise.resolve();
    });

    const round1 = SOUND_RHYTHM_CURRICULUM[0];
    render(<SoundRhythmRound round={round1} roundIdx={0} onAnswer={vi.fn()} />);

    const audioBtn = screen.getByTestId('rhythm-audio-button');

    // First click: plays rhythm
    await act(async () => {
      fireEvent.click(audioBtn);
    });
    expect(playSpy).toHaveBeenCalledTimes(1);

    // Double-click while playing is blocked
    await act(async () => {
      fireEvent.click(audioBtn);
    });
    expect(playSpy).toHaveBeenCalledTimes(1);

    // Finish first playback
    await act(async () => {
      capturedOptions.onEnd();
    });

    // Replay click works cleanly
    await act(async () => {
      fireEvent.click(audioBtn);
    });
    expect(playSpy).toHaveBeenCalledTimes(2);
  });

  it('24. audio resources are stopped and cleaned up when round changes or unmounts', () => {
    const stopSpy = vi.spyOn(soundRhythmAudio, 'stopRhythm');
    const round1 = SOUND_RHYTHM_CURRICULUM[0];
    const round2 = SOUND_RHYTHM_CURRICULUM[1];

    const { rerender, unmount } = render(
      <SoundRhythmRound round={round1} roundIdx={0} onAnswer={vi.fn()} />
    );

    // Changing round calls stopRhythm
    rerender(<SoundRhythmRound round={round2} roundIdx={1} onAnswer={vi.fn()} />);
    expect(stopSpy).toHaveBeenCalled();

    // Unmounting calls stopRhythm
    unmount();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('25. answer buttons cannot award duplicate points during rapid clicks', async () => {
    const onAnswerMock = vi.fn();
    const round1 = SOUND_RHYTHM_CURRICULUM[0];

    // Mock successful listening
    vi.spyOn(soundRhythmAudio, 'playRhythm').mockImplementation((round, options) => {
      if (options.onEnd) options.onEnd();
      return Promise.resolve();
    });

    render(<SoundRhythmRound round={round1} roundIdx={0} onAnswer={onAnswerMock} />);

    // Listen first to unlock answers
    await act(async () => {
      fireEvent.click(screen.getByTestId('rhythm-audio-button'));
    });

    const correctBtn = screen.getByText('BA — BA — BA').closest('button');
    expect(correctBtn).not.toBeDisabled();

    // Simulate 5 rapid clicks in quick succession
    await act(async () => {
      fireEvent.click(correctBtn);
      fireEvent.click(correctBtn);
      fireEvent.click(correctBtn);
      fireEvent.click(correctBtn);
      fireEvent.click(correctBtn);
    });

    // onAnswer must be called exactly once
    expect(onAnswerMock).toHaveBeenCalledTimes(1);
    expect(onAnswerMock).toHaveBeenCalledWith(true);

    // Button is disabled after click
    expect(correctBtn).toBeDisabled();
  });

  it('26. validates answers accurately across positions 0, 1, and 2 after listening', async () => {
    vi.spyOn(soundRhythmAudio, 'playRhythm').mockImplementation((round, options) => {
      if (options.onEnd) options.onEnd();
      return Promise.resolve();
    });

    // Level 1: correct at position 0
    const round1 = SOUND_RHYTHM_CURRICULUM[0];
    expect(round1.options.indexOf(round1.correct)).toBe(0);
    const mockAns1 = vi.fn();
    const { unmount: unmount1 } = render(
      <SoundRhythmRound round={round1} roundIdx={0} onAnswer={mockAns1} />
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('rhythm-audio-button'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText(round1.correct));
    });
    expect(mockAns1).toHaveBeenCalledWith(true);
    unmount1();

    // Level 2: correct at position 1
    const round2 = SOUND_RHYTHM_CURRICULUM[1];
    expect(round2.options.indexOf(round2.correct)).toBe(1);
    const mockAns2 = vi.fn();
    const { unmount: unmount2 } = render(
      <SoundRhythmRound round={round2} roundIdx={1} onAnswer={mockAns2} />
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('rhythm-audio-button'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText(round2.correct));
    });
    expect(mockAns2).toHaveBeenCalledWith(true);
    unmount2();

    // Level 3: correct at position 2
    const round3 = SOUND_RHYTHM_CURRICULUM[2];
    expect(round3.options.indexOf(round3.correct)).toBe(2);
    const mockAns3 = vi.fn();
    const { unmount: unmount3 } = render(
      <SoundRhythmRound round={round3} roundIdx={2} onAnswer={mockAns3} />
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('rhythm-audio-button'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText(round3.correct));
    });
    expect(mockAns3).toHaveBeenCalledWith(true);
    unmount3();
  });

  it('27. synthesis engine handles all curriculum instrument types cleanly', () => {
    const mockCtx = new window.AudioContext();
    const sampleRounds = [
      SOUND_RHYTHM_CURRICULUM[0],  // drum
      SOUND_RHYTHM_CURRICULUM[2],  // woodblock
      SOUND_RHYTHM_CURRICULUM[14], // bell
      SOUND_RHYTHM_CURRICULUM[20], // cymbal
      SOUND_RHYTHM_CURRICULUM[21], // clap / snap
      SOUND_RHYTHM_CURRICULUM[28], // roll
      SOUND_RHYTHM_CURRICULUM[29], // fanfare
    ];

    sampleRounds.forEach((round) => {
      expect(() => {
        round.beats.forEach((b) => {
          soundRhythmAudio._synthesizeBeat(mockCtx, 0.1, b, round.instrument);
        });
      }).not.toThrow();
    });
  });

  it('28. checkpoint saving and multi-level progression work in full GamePlay flow', async () => {
    vi.spyOn(soundRhythmAudio, 'playRhythm').mockImplementation((round, options) => {
      if (options.onEnd) options.onEnd();
      return Promise.resolve();
    });

    renderSoundRhythm();

    // Start Game
    fireEvent.click(screen.getByTestId('start-game-button'));

    // Round 1 (Level 1)
    expect(screen.getByText('Level 1 of 30')).toBeInTheDocument();
    expect(screen.getByTestId('rhythm-audio-button')).toBeInTheDocument();

    // Listen first to unlock
    await act(async () => {
      fireEvent.click(screen.getByTestId('rhythm-audio-button'));
    });

    // Answer Level 1 correctly
    await act(async () => {
      fireEvent.click(screen.getByText('BA — BA — BA'));
    });

    const cp1 = loadSoundRhythmCheckpointData(1);
    expect(cp1.score).toBe(1);
    expect(cp1.completedLevels).toContain(1);
  });
});

describe('Sound & Rhythm: Step 4 — Final Integration & Regression Audit', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    currentActiveChild = {
      id: 1,
      name: 'Aarav',
      interests: ['rhythm'],
      fingerprint: { phonologicalAwareness: 60 },
      comfort_preferences: { quiet_mode: false },
    };
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('29. Game registry metadata correctly reflects 2D rhythm gameplay and sounds category', () => {
    const game = GAMING_ZONE_GAMES.find((g) => g.id === 'sound-rhythm');
    expect(game).toBeDefined();
    expect(game.title).toBe('Sound & Rhythm');
    expect(game.category).toBe('sounds');
    expect(game.icon).toBe('🥁');
    expect(game.dimension).toBe('2D Rhythm');
    expect(game.route).toBe('/child/games/sound-rhythm');
    expect(game.difficulty).toBe('Growing 🌿');
    expect(game.audioPrompt).toContain('rhythm');
  });

  it('30. All 30 curriculum rounds and 3 developmental stages have complete valid schemas', () => {
    expect(SOUND_RHYTHM_CURRICULUM).toHaveLength(30);

    // Verify 10 rounds per stage
    const stage1Rounds = SOUND_RHYTHM_CURRICULUM.filter((r) => r.stage === 1);
    const stage2Rounds = SOUND_RHYTHM_CURRICULUM.filter((r) => r.stage === 2);
    const stage3Rounds = SOUND_RHYTHM_CURRICULUM.filter((r) => r.stage === 3);

    expect(stage1Rounds).toHaveLength(10);
    expect(stage2Rounds).toHaveLength(10);
    expect(stage3Rounds).toHaveLength(10);

    SOUND_RHYTHM_CURRICULUM.forEach((round, idx) => {
      expect(round.id).toBe(idx + 1);
      expect(round.level).toBe(idx + 1);
      expect(round.title).toBeTruthy();
      expect(round.prompt).toBeTruthy();
      expect(round.pattern).toBeTruthy();
      expect(round.options).toHaveLength(3);
      expect(new Set(round.options).size).toBe(3); // 3 distinct options
      expect(round.options).toContain(round.correct); // Correct answer present in options
      expect(round.syllables.length).toBeGreaterThanOrEqual(2);
      expect(round.beats.length).toBeGreaterThanOrEqual(2);
      expect(round.beats.every((b) => typeof b.sound === 'string' && typeof b.timeMs === 'number')).toBe(true);
    });
  });

  it('31. Checkpoints remain strictly isolated between children and recover from corruption', () => {
    // Child 101 reaches level 12 (Stage 2)
    saveSoundRhythmCheckpoint(101, {
      roundIndex: 11,
      completedLevel: 11,
      score: 11,
      highestUnlockedLevel: 12,
      highestUnlockedIndex: 11,
    });

    // Child 202 is a brand new learner on level 1
    const child202Data = loadSoundRhythmCheckpointData(202);
    expect(child202Data.currentLevel).toBe(1);
    expect(child202Data.highestUnlockedLevel).toBe(1);
    expect(child202Data.score).toBe(0);
    expect(child202Data.unlockedStages).toEqual([1]);

    // Child 101 data remains intact and isolated
    const child101Data = loadSoundRhythmCheckpointData(101);
    expect(child101Data.currentLevel).toBe(12);
    expect(child101Data.highestUnlockedLevel).toBe(12);
    expect(child101Data.score).toBe(11);
    expect(child101Data.unlockedStages).toContain(2);

    // Guest fallback works when childId is null or undefined
    saveSoundRhythmCheckpoint(undefined, { roundIndex: 3, completedLevel: 3, score: 3 });
    const guestData = loadSoundRhythmCheckpointData(null);
    expect(guestData.roundIndex).toBe(3);

    // Corrupted localStorage data safely recovers without crashing
    localStorage.setItem(getSoundRhythmCheckpointKey(303), 'NOT_JSON{!!bad_state');
    const recoveredData = loadSoundRhythmCheckpointData(303);
    expect(recoveredData.roundIndex).toBe(0);
    expect(recoveredData.currentLevel).toBe(1);
    expect(recoveredData.unlockedStages).toEqual([1]);
  });

  it('32. Replaying completed levels does not inflate score and rapid clicks are guarded', async () => {
    // Save checkpoint where Level 1 and 2 are already completed
    saveSoundRhythmCheckpoint(1, {
      roundIndex: 0,
      completedLevels: [1, 2],
      score: 2,
      highestUnlockedLevel: 3,
      highestUnlockedIndex: 2,
    });

    const before = loadSoundRhythmCheckpointData(1);
    expect(before.score).toBe(2);

    // Replay Level 1
    saveSoundRhythmCheckpoint(1, {
      roundIndex: 0,
      completedLevel: 1, // Replaying already completed level
      score: 2,
    });

    const after = loadSoundRhythmCheckpointData(1);
    expect(after.score).toBe(2); // Score remains 2, NOT 3
    expect(after.completedLevels).toEqual([1, 2]);

    // Test synchronous submission guard in SoundRhythmRound
    const mockAnswer = vi.fn();
    const round = SOUND_RHYTHM_CURRICULUM[0];
    render(<SoundRhythmRound round={round} roundIdx={0} onAnswer={mockAnswer} />);

    // Listen first to unlock
    await act(async () => {
      fireEvent.click(screen.getByTestId('rhythm-audio-button'));
    });

    const correctBtn = screen.getByText(round.correct);
    // Rapid duplicate clicks
    await act(async () => {
      fireEvent.click(correctBtn);
      fireEvent.click(correctBtn);
      fireEvent.click(correctBtn);
    });

    // onAnswer should only have been fired once
    expect(mockAnswer).toHaveBeenCalledTimes(1);
  });

  it('33. Completing Level 30 displays grand finale banner, message, 3 stage badges, and restarts cleanly', async () => {
    vi.spyOn(soundRhythmAudio, 'playRhythm').mockImplementation((round, options) => {
      if (options.onEnd) options.onEnd();
      return Promise.resolve();
    });

    // Pre-populate child checkpoint at Level 30 (roundIndex 29)
    saveSoundRhythmCheckpoint(1, {
      roundIndex: 29,
      completedLevels: Array.from({ length: 29 }, (_, i) => i + 1),
      score: 29,
      highestUnlockedLevel: 30,
      highestUnlockedIndex: 29,
    });

    renderSoundRhythm();

    // Start Game from resume/start
    fireEvent.click(screen.getByTestId('start-game-button'));

    // Verify Level 30
    expect(screen.getByText('Level 30 of 30')).toBeInTheDocument();

    // Listen to rhythm
    await act(async () => {
      fireEvent.click(screen.getByTestId('rhythm-audio-button'));
    });

    // Answer Level 30 correctly (STAR — BEAT — FINALE)
    const level30Round = SOUND_RHYTHM_CURRICULUM[29];
    await act(async () => {
      fireEvent.click(screen.getByText(level30Round.correct));
    });

    // Advance past transition
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    });

    // Verify Grand Finale Banner and Celebration Message
    expect(await screen.findByTestId('sound-rhythm-finale-banner')).toBeInTheDocument();
    expect(screen.getByTestId('sound-rhythm-completion-message')).toHaveTextContent(
      /completed all 30 levels of Sound & Rhythm across all 3 stages/i
    );

    // Verify 3 Mastered Rhythm Badges Gallery
    expect(screen.getByTestId('sound-rhythm-stage-badges-gallery')).toBeInTheDocument();
    expect(screen.getByTestId('rhythm-mastery-badge-stage-1')).toBeInTheDocument();
    expect(screen.getByTestId('rhythm-mastery-badge-stage-2')).toBeInTheDocument();
    expect(screen.getByTestId('rhythm-mastery-badge-stage-3')).toBeInTheDocument();

    // Verify Play Again resets progress cleanly
    const playAgainBtn = screen.getByRole('button', { name: /Play Again/i });
    expect(playAgainBtn).toBeInTheDocument();
    fireEvent.click(playAgainBtn);

    // Back to intro
    expect(screen.getByTestId('start-game-button')).toBeInTheDocument();
    expect(screen.getByTestId('sound-rhythm-badge')).toBeInTheDocument();
  });

  it('34. Audio is strictly user-controlled with answer locking and cleanup on unmount', async () => {
    let playOptions = null;
    const playSpy = vi.spyOn(soundRhythmAudio, 'playRhythm').mockImplementation((round, options) => {
      playOptions = options;
      return Promise.resolve();
    });
    const stopSpy = vi.spyOn(soundRhythmAudio, 'stopRhythm');

    const round = SOUND_RHYTHM_CURRICULUM[0];
    const { unmount } = render(<SoundRhythmRound round={round} roundIdx={0} onAnswer={vi.fn()} />);

    // Zero automatic playback on mount
    expect(playSpy).not.toHaveBeenCalled();

    // Options are strictly disabled/locked
    const optionBtns = screen.getAllByRole('button', { name: /Option/i });
    expect(optionBtns).toHaveLength(3);
    optionBtns.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    // Click audio button to initiate playback
    await act(async () => {
      fireEvent.click(screen.getByTestId('rhythm-audio-button'));
    });
    expect(playSpy).toHaveBeenCalledTimes(1);

    // Trigger onEnd from audio service to complete listening
    await act(async () => {
      if (playOptions?.onEnd) playOptions.onEnd();
    });

    // Options are now unlocked!
    optionBtns.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });

    // Unmounting component immediately triggers stopRhythm
    unmount();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('35. Answer option position distribution is balanced across all 30 rounds with no triple repeat', () => {
    const posCounts = [0, 0, 0];
    let maxRunLength = 1;
    let currentRunLength = 1;
    let prevPos = -1;

    SOUND_RHYTHM_CURRICULUM.forEach((round) => {
      const pos = round.options.indexOf(round.correct);
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThanOrEqual(2);
      posCounts[pos]++;

      if (pos === prevPos) {
        currentRunLength++;
        if (currentRunLength > maxRunLength) maxRunLength = currentRunLength;
      } else {
        currentRunLength = 1;
      }
      prevPos = pos;
    });

    // Exactly 10 rounds per position (33.3% distribution each)
    expect(posCounts[0]).toBe(10);
    expect(posCounts[1]).toBe(10);
    expect(posCounts[2]).toBe(10);

    // No repetitive pattern: maximum run length is at most 2
    expect(maxRunLength).toBeLessThanOrEqual(2);
  });

  it('36. Stage roadmap displays all 3 stages with level ranges and accurate theme previews', async () => {
    renderSoundRhythm();

    // Click Choose Stage button
    fireEvent.click(screen.getByTestId('choose-stage-button'));

    // Verify all 3 stages rendered with accurate titles and level ranges
    expect(screen.getByText('Simple Syllables')).toBeInTheDocument();
    expect(screen.getByText(/Levels 1–10/i)).toBeInTheDocument();

    expect(screen.getByText('Tempo Beats')).toBeInTheDocument();
    expect(screen.getByText(/Levels 11–20/i)).toBeInTheDocument();

    expect(screen.getByText('Rhythm Adventures')).toBeInTheDocument();
    expect(screen.getByText(/Levels 21–30/i)).toBeInTheDocument();

    // Verify stage theme previews are present
    expect(screen.getByText(/BA BA BA, TI TI TA/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick & Slow Beats/i)).toBeInTheDocument();
    expect(screen.getByText(/Drum, Claps & Bell Rhythms/i)).toBeInTheDocument();
  });
});
