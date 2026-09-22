// Central tunable constants for the runner. Keeping these in one place makes
// it easy to balance difficulty and keeps "magic numbers" out of components.

export const LANE_X = [-2.4, 0, 2.4]; // left, center, right
export const LANE_COUNT = LANE_X.length;

export const PLAYER_START_Z = 0;
export const PLAYER_LANE_LERP_SPEED = 10; // how quickly the player slides between lanes
export const JUMP_HEIGHT = 2.1;
export const JUMP_DURATION = 0.62; // seconds
export const SLIDE_DURATION = 0.55;

export const BASE_SPEED = 9; // units/sec
export const MAX_SPEED = 22;
export const SPEED_RAMP_PER_METER = 0.006; // how quickly speed increases with distance

export const SEGMENT_LENGTH = 30;
export const VISIBLE_SEGMENTS = 8; // segments kept alive ahead of the player
export const SPAWN_DISTANCE = SEGMENT_LENGTH * VISIBLE_SEGMENTS;

export const OBSTACLE_HALF_WIDTH = 1.0;
export const PLAYER_HALF_WIDTH = 0.55;
export const COLLECT_RADIUS = 1.15;

export const MAX_STUMBLES = 3; // hits before a run gently ends

export const DIFFICULTY_LABELS = { 1: 'Easy', 2: 'Normal', 3: 'Advanced' };

export const WORLDS = [
  { id: 'safari-temple', name: 'Safari Temple Run', subtitle: 'World 1 (Word Quest)', unlocked: true, theme: 'safari' },
  { id: 'letter-valley', name: 'Letter Valley', subtitle: 'World 2', unlocked: true, theme: 'valley' },
  { id: 'word-forest', name: 'Word Forest', subtitle: 'World 3', unlocked: false, theme: 'forest' },
  { id: 'sound-caves', name: 'Sound Caves', subtitle: 'World 4', unlocked: false, theme: 'caves' },
  { id: 'story-skyland', name: 'Story Skyland', subtitle: 'World 5', unlocked: false, theme: 'skyland' },
];

export const CHARACTERS = [
  { id: 'explorer', name: 'Explorer', primaryColor: '#38e1ff', accent: '#ffd166' },
  { id: 'reader', name: 'Reader', primaryColor: '#7cf7c4', accent: '#ff8fab' },
  { id: 'adventurer', name: 'Adventurer', primaryColor: '#c39bff', accent: '#ffe066' },
];

export const ACHIEVEMENT_DEFS = [
  { id: 'first-run', name: 'First Run', icon: '🏆', description: 'Complete your very first run.' },
  { id: 'letter-explorer', name: 'Letter Explorer', icon: '🔤', description: 'Collect 20 letter coins.' },
  { id: 'word-builder', name: 'Word Builder', icon: '📖', description: 'Complete 5 words.' },
  { id: 'flame-runner', name: 'Flame Runner', icon: '🔥', description: 'Reach 3 checkpoints in one run.' },
  { id: 'star-collector', name: 'Star Collector', icon: '⭐', description: 'Earn 15 total stars.' },
];
