import { SEGMENT_LENGTH, LANE_COUNT } from '../engine/constants';
import { generateChallenge, generateCollectPrompt } from '../../learning/challenges/challengeGenerator';

// A "segment" is one SEGMENT_LENGTH slice of track. Each segment declares the
// entities that live inside it (obstacles, coins, a challenge gate, a
// checkpoint, decoration seed). Segments are generated lazily as the player
// advances and recycled once passed, so the track is effectively endless
// without unbounded memory growth.

let segmentCounter = 0;

function randomLane(exclude = []) {
  const options = [0, 1, 2].filter((l) => !exclude.includes(l));
  return options[Math.floor(Math.random() * options.length)];
}

function buildObstacles(kind) {
  // local z offset within the segment (0..SEGMENT_LENGTH)
  if (kind === 'obstacle') {
    const count = 1 + Math.floor(Math.random() * 2);
    const obstacles = [];
    const usedLanes = [];
    for (let i = 0; i < count; i += 1) {
      const lane = randomLane();
      usedLanes.push(lane);
      const type = Math.random() < 0.5 ? 'jump' : 'slide'; // jump = low block, slide = overhead bar
      obstacles.push({
        id: `obs_${segmentCounter}_${i}`,
        lane,
        localZ: 8 + i * 9 + Math.random() * 3,
        type,
      });
    }
    return obstacles;
  }
  return [];
}

function buildCoins(kind, difficulty, targetLetter = null) {
  // Always spawn coins on every segment for a rich, continuous coin collection experience
  const coins = [];
  const targetLane = randomLane();
  const coinCount = kind === 'reward' ? 6 : (kind.startsWith('turn') ? 3 : 4);
  for (let i = 0; i < coinCount; i += 1) {
    // If targetLetter is specified, ensure it is placed as one of the early coins
    const isTargetCoin = targetLetter && (i === 1);
    coins.push({
      id: `coin_${segmentCounter}_${i}`,
      lane: isTargetCoin ? targetLane : (kind === 'letters' ? targetLane : randomLane()),
      localZ: 2.5 + i * 4.2,
      letter: isTargetCoin ? targetLetter : null,
      difficulty,
    });
  }
  return coins;
}

function buildPowerUp() {
  if (Math.random() < 0.22) {
    return {
      id: `pu_${segmentCounter}`,
      lane: randomLane(),
      localZ: 14 + Math.random() * 8,
      kind: ['magnet', 'shield', 'star-boost', 'slow-time'][Math.floor(Math.random() * 4)],
    };
  }
  return null;
}

const SEGMENT_KIND_CYCLE = [
  'letters',     // Segment 0: Immediate glowing coin trail!
  'turn-right',  // Segment 1: Quick 90° right corner!
  'letters',     // Segment 2: Letter coins after turn!
  'obstacle',    // Segment 3: Fallen jungle log jump!
  'turn-left',   // Segment 4: 90° left corner!
  'letters',     // Segment 5: Active Word Quest target coins!
  'obstacle',    // Segment 6: Ancient temple archway slide!
  'turn-right',  // Segment 7: 90° right corner!
  'challenge',   // Segment 8: Temple letter gate!
  'reward',      // Segment 9: Giant coin bonanza!
];

export function generateSegment(index, difficulty, targetLetter = null) {
  segmentCounter += 1;
  const isCheckpoint = index > 0 && index % 6 === 5;
  const kind = isCheckpoint ? 'checkpoint' : SEGMENT_KIND_CYCLE[index % SEGMENT_KIND_CYCLE.length];
  const isTurn = kind === 'turn-left' || kind === 'turn-right';
  const turnDirection = kind === 'turn-left' ? 'left' : (kind === 'turn-right' ? 'right' : null);

  const segment = {
    id: `seg_${index}_${segmentCounter}`,
    index,
    kind,
    length: SEGMENT_LENGTH,
    obstacles: buildObstacles(kind),
    coins: buildCoins(kind, difficulty, targetLetter),
    powerUp: buildPowerUp(),
    challenge: kind === 'challenge' ? generateChallenge(difficulty) : null,
    isCheckpoint,
    isTurn,
    turnDirection,
    turnLocalZ: isTurn ? SEGMENT_LENGTH * 0.5 : null,
    decorationSeed: Math.floor(Math.random() * 10000),
  };

  return segment;
}

export function resetSegmentCounter() {
  segmentCounter = 0;
}
