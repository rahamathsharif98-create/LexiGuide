import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Player from '../player/Player';
import Environment from '../world/Environment';
import TrackSegment from '../track/TrackSegment';
import ChallengeGate from '../track/ChallengeGate';
import TurnJunction from '../track/TurnJunction';
import Obstacle from '../obstacles/Obstacle';
import LetterCoin from '../collectibles/LetterCoin';
import PowerUp from '../powerups/PowerUp';
import FollowCamera from '../camera/FollowCamera';
import { useGameStore } from './gameStore';
import { useRunnerInput } from './useRunnerInput';
import { generateSegment } from '../track/trackGenerator';
import { obstacleWouldHit } from '../collision/collision';
import { LETTER_MAP, getRandomLetter } from '../../learning/content/letters';
import { audioService } from '../../services/audio/audioService';
import { speechService } from '../../services/speech/speechService';
import {
  LANE_X,
  LANE_COUNT,
  SEGMENT_LENGTH,
  BASE_SPEED,
  MAX_SPEED,
  SPEED_RAMP_PER_METER,
  JUMP_DURATION,
  JUMP_HEIGHT,
  SLIDE_DURATION,
  COLLECT_RADIUS,
} from './constants';

const GROUND_TILE_COUNT = 8;
const OBSTACLE_POOL_SIZE = 10;
const COIN_POOL_SIZE = 36;
const TURN_POOL_SIZE = 3;
const POWERUP_POOL_SIZE = 4;
const RECYCLE_Z = 6; // once an entity passes this far behind the camera, recycle it
const SPAWN_AHEAD_Z = -8; // start spawning IMMEDIATELY right in front of the runner!

function makePool(size, factory) {
  return new Array(size).fill(0).map(() => ({ current: factory() }));
}

export default function GameWorld({ character, worldId, difficulty: initialDifficulty, paused, onError }) {
  const store = useGameStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  // --- Mutable engine state (kept out of React state for perf) ---
  const playerRuntime = useRef({
    lane: 1,
    renderX: LANE_X[1],
    renderY: 0,
    isJumping: false,
    jumpElapsed: 0,
    jumpProgress: 0,
    isSliding: false,
    slideElapsed: 0,
    tilt: 0,
    running: true,
    magnetActive: false,
    shieldActive: false,
  });

  const speedRef = useRef(BASE_SPEED);
  const distanceRef = useRef(0);
  const shakeRef = useRef({ time: 0, intensity: 0 });
  const spawnCursor = useRef(SPAWN_AHEAD_Z);
  const nextSegmentIndex = useRef(0);
  const powerUpTimer = useRef({ kind: null, remaining: 0 });
  const lastDifficultySync = useRef(initialDifficulty);

  const groundTiles = useMemo(
    () => new Array(GROUND_TILE_COUNT).fill(0).map((_, i) => ({ current: -i * SEGMENT_LENGTH })),
    []
  );

  const obstaclePool = useMemo(
    () => makePool(OBSTACLE_POOL_SIZE, () => ({ active: false, lane: 1, z: 0, type: 'jump', resolved: false })),
    []
  );
  const coinPool = useMemo(
    () => makePool(COIN_POOL_SIZE, () => ({ active: false, lane: 1, z: 0, letter: 'A', phase: Math.random() * 10 })),
    []
  );
  const turnPool = useMemo(
    () => makePool(TURN_POOL_SIZE, () => ({ active: false, direction: 'right', z: 0, resolved: false })),
    []
  );
  const powerUpPool = useMemo(
    () => makePool(POWERUP_POOL_SIZE, () => ({ active: false, lane: 1, z: 0, kind: 'magnet' })),
    []
  );
  const gateRef = useRef({ active: false, z: 0, lanes: ['A', 'B', 'C'], correctLetter: 'A', resolved: false, version: 0, challengeType: 'starting-letter', wordHint: '' });

  // --- Input handling ---
  const moveLeft = useCallback(() => {
    if (storeRef.current.isPaused || storeRef.current.isGameOver) return;
    playerRuntime.current.lane = Math.max(0, playerRuntime.current.lane - 1);
  }, []);
  const moveRight = useCallback(() => {
    if (storeRef.current.isPaused || storeRef.current.isGameOver) return;
    playerRuntime.current.lane = Math.min(LANE_COUNT - 1, playerRuntime.current.lane + 1);
  }, []);
  const jump = useCallback(() => {
    if (storeRef.current.isPaused || storeRef.current.isGameOver) return;
    const p = playerRuntime.current;
    if (!p.isJumping && !p.isSliding) {
      p.isJumping = true;
      p.jumpElapsed = 0;
      audioService.playJump();
    }
  }, []);
  const slide = useCallback(() => {
    if (storeRef.current.isPaused || storeRef.current.isGameOver) return;
    const p = playerRuntime.current;
    if (!p.isSliding && !p.isJumping) {
      p.isSliding = true;
      p.slideElapsed = 0;
    }
  }, []);
  const togglePause = useCallback(() => {
    storeRef.current.setPaused(!storeRef.current.isPaused);
  }, []);

  useRunnerInput({
    onLeft: moveLeft,
    onRight: moveRight,
    onJump: jump,
    onSlide: slide,
    onPause: togglePause,
    enabled: true,
  });

  useEffect(() => {
    store.startRun(initialDifficulty);
    audioService.resume();
    return () => {
      speechService.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function findFreeSlot(pool) {
    return pool.find((p) => !p.current.active);
  }

  function spawnSegmentContent(segment) {
    const baseZ = spawnCursor.current;

    segment.obstacles.forEach((o) => {
      const slot = findFreeSlot(obstaclePool);
      if (slot) {
        slot.current.active = true;
        slot.current.lane = o.lane;
        slot.current.z = baseZ + o.localZ;
        slot.current.type = o.type;
        slot.current.resolved = false;
      }
    });

    segment.coins.forEach((c) => {
      const slot = findFreeSlot(coinPool);
      if (slot) {
        const letter = c.letter || getRandomLetter(storeRef.current.difficulty || 1).letter;
        slot.current.active = true;
        slot.current.lane = c.lane;
        slot.current.z = baseZ + c.localZ;
        slot.current.letter = letter;
        slot.current.resolved = false;
      }
    });

    if (segment.powerUp) {
      const slot = findFreeSlot(powerUpPool);
      if (slot) {
        slot.current.active = true;
        slot.current.lane = segment.powerUp.lane;
        slot.current.z = baseZ + segment.powerUp.localZ;
        slot.current.kind = segment.powerUp.kind;
        slot.current.resolved = false;
      }
    }

    if (segment.isTurn) {
      const turnSlot = findFreeSlot(turnPool);
      if (turnSlot) {
        turnSlot.current.active = true;
        turnSlot.current.direction = segment.turnDirection;
        turnSlot.current.z = baseZ + (segment.turnLocalZ || SEGMENT_LENGTH * 0.5);
        turnSlot.current.resolved = false;
      }
    }

    if (segment.challenge && !gateRef.current.active) {
      gateRef.current.active = true;
      gateRef.current.z = baseZ + SEGMENT_LENGTH * 0.5;
      gateRef.current.lanes = segment.challenge.lanes;
      gateRef.current.correctLetter = segment.challenge.correctLetter;
      gateRef.current.challengeType = segment.challenge.type;
      gateRef.current.wordHint = segment.challenge.wordHint;
      gateRef.current.resolved = false;
      gateRef.current.version += 1;
      storeRef.current.startChallenge(segment.challenge);
    }

    spawnCursor.current -= SEGMENT_LENGTH;
  }

  const checkpointQueue = useRef([]);
  const hasErroredRef = useRef(false);

  useFrame((_, rawDelta) => {
    if (hasErroredRef.current) return;
    const s = storeRef.current;
    if (s.isPaused || s.isGameOver || !s.isRunning) return;
    try {
      runFrame(s, rawDelta);
    } catch (err) {
      hasErroredRef.current = true;
      // eslint-disable-next-line no-console
      console.error('LexiGuide Learning Run — game loop error:', err);
      if (onError) onError(err);
    }
  });

  function runFrame(s, rawDelta) {
    const delta = Math.min(rawDelta, 0.05);

    // --- Speed & distance ---
    const targetSpeed = Math.min(MAX_SPEED, BASE_SPEED + distanceRef.current * SPEED_RAMP_PER_METER);
    const slowActive = powerUpTimer.current.kind === 'slow-time' && powerUpTimer.current.remaining > 0;
    speedRef.current = slowActive ? targetSpeed * 0.55 : targetSpeed;
    distanceRef.current += speedRef.current * delta;
    const flooredDistance = Math.floor(distanceRef.current);
    if (flooredDistance !== s.distance) {
      s.setDistance(flooredDistance);
    }

    // --- Power-up timer ---
    if (powerUpTimer.current.remaining > 0) {
      powerUpTimer.current.remaining -= delta;
      if (powerUpTimer.current.remaining <= 0) {
        powerUpTimer.current.kind = null;
        playerRuntime.current.magnetActive = false;
        playerRuntime.current.shieldActive = false;
        s.clearPowerUp();
      }
    }

    // --- Content generation ---
    while (spawnCursor.current > -distanceRef.current - 260) {
      const targetLetter = s.activeWordQuest?.missingLetter || null;
      const seg = generateSegment(nextSegmentIndex.current, s.difficulty, targetLetter);
      nextSegmentIndex.current += 1;
      spawnSegmentContent(seg);
    }

    // --- Ground tile recycling ---
    groundTiles.forEach((tile) => {
      tile.current += speedRef.current * delta;
      if (tile.current > SEGMENT_LENGTH) {
        tile.current -= SEGMENT_LENGTH * GROUND_TILE_COUNT;
      }
    });

    // --- Player lane lerp ---
    const p = playerRuntime.current;
    const targetX = LANE_X[p.lane];
    p.renderX += (targetX - p.renderX) * Math.min(1, delta * 10);
    p.tilt = (targetX - p.renderX) * -0.15;

    // --- Turn junctions processing (Temple Run turns) ---
    turnPool.forEach((slot) => {
      const turn = slot.current;
      if (!turn.active) return;
      turn.z += speedRef.current * delta;

      // 1. Show Turn Warning on HUD when approaching within 28m
      if (turn.z > -28 && turn.z < -2 && !turn.resolved) {
        if (!s.turnPrompt || s.turnPrompt.direction !== turn.direction) {
          s.setTurnPrompt({ direction: turn.direction, distance: Math.max(1, Math.round(-turn.z)) });
        }
      }

      // 2. Corner turning junction trigger window (-2.5m to 2.5m)
      if (Math.abs(turn.z) < 2.5 && !turn.resolved) {
        const playerSteered = (turn.direction === 'left' && p.lane === 0) || (turn.direction === 'right' && p.lane === 2);
        if (playerSteered) {
          turn.resolved = true;
          s.takeTurn(true, turn.direction);
          audioService.playButton();
          p.tilt = turn.direction === 'left' ? -0.55 : 0.55;
          shakeRef.current = { time: 0.3, intensity: 0.25 };
        } else if (turn.z > 1.2) {
          // Missed turn safety
          turn.resolved = true;
          s.takeTurn(false, turn.direction);
          s.registerStumble();
          audioService.playHit();
          shakeRef.current = { time: 0.4, intensity: 0.45 };
        }
      }

      // 3. Recycle once far behind
      if (turn.z > RECYCLE_Z + 15) {
        turn.active = false;
      }
    });

    // --- Jump physics ---
    if (p.isJumping) {
      p.jumpElapsed += delta;
      p.jumpProgress = p.jumpElapsed / JUMP_DURATION;
      if (p.jumpProgress >= 1) {
        p.isJumping = false;
        p.jumpProgress = 0;
        p.renderY = 0;
        audioService.playLand();
      } else {
        p.renderY = Math.sin(p.jumpProgress * Math.PI) * JUMP_HEIGHT;
      }
    }

    // --- Slide timing ---
    if (p.isSliding) {
      p.slideElapsed += delta;
      if (p.slideElapsed >= SLIDE_DURATION) {
        p.isSliding = false;
        p.slideElapsed = 0;
      }
    }

    // --- Move + collide obstacles ---
    obstaclePool.forEach((slot) => {
      const o = slot.current;
      if (!o.active) return;
      o.z += speedRef.current * delta;
      if (o.z > RECYCLE_Z) {
        o.active = false;
        return;
      }
      if (!o.resolved && Math.abs(o.z) < 0.7 && o.lane === p.lane) {
        o.resolved = true;
        const wouldHit = obstacleWouldHit(o.type, p);
        if (wouldHit) {
          if (p.shieldActive) {
            p.shieldActive = false;
            powerUpTimer.current.kind = null;
            s.clearPowerUp();
          } else {
            s.registerStumble();
            audioService.playHit();
            shakeRef.current = { time: 0.35, intensity: 0.4 };
          }
        }
      }
    });

    // --- Move + collect coins ---
    const collectRadius = p.magnetActive ? COLLECT_RADIUS * 2.2 : COLLECT_RADIUS;
    coinPool.forEach((slot) => {
      const c = slot.current;
      if (!c.active) return;
      c.z += speedRef.current * delta;
      if (c.z > RECYCLE_Z) {
        c.active = false;
        return;
      }
      const laneOk = p.magnetActive || c.lane === p.lane;
      if (Math.abs(c.z) < collectRadius && laneOk) {
        c.active = false;
        const entry = LETTER_MAP[c.letter] || { letter: c.letter, sound: '', word: c.letter, emoji: '⭐' };
        s.collectLetter(entry);
        audioService.playCollectLetter();
        speechService.speakLetter(entry);

        // Safari Run Word Quest check: Did this fill the blank?
        if (s.activeWordQuest && c.letter === s.activeWordQuest.missingLetter) {
          s.completeWordQuest();
          audioService.playCorrect();
          speechService.speak(`${s.activeWordQuest.word}! Outstanding!`);
          shakeRef.current = { time: 0.22, intensity: 0.18 };
        } else {
          s.incrementScore(10);
        }
      }
    });

    // --- Move + collect power-ups ---
    powerUpPool.forEach((slot) => {
      const pu = slot.current;
      if (!pu.active) return;
      pu.z += speedRef.current * delta;
      if (pu.z > RECYCLE_Z) {
        pu.active = false;
        return;
      }
      if (Math.abs(pu.z) < COLLECT_RADIUS && pu.lane === p.lane) {
        pu.active = false;
        activatePowerUp(pu.kind, s);
      }
    });

    // --- Challenge gate crossing ---
    const g = gateRef.current;
    if (g.active) {
      g.z += speedRef.current * delta;
      if (!g.resolved && g.z > -0.3) {
        g.resolved = true;
        const correct = p.lane === g.lanes.indexOf(g.correctLetter);
        s.resolveChallenge(correct);
        if (correct) {
          audioService.playCorrect();
          speechService.speak(`${g.correctLetter}! ${g.wordHint}`);
        } else {
          audioService.playIncorrect();
        }
      }
      if (g.z > RECYCLE_Z) {
        g.active = false;
      }
    }

    // --- Checkpoint crossing (every ~5th segment, tracked via distance) ---
    const checkpointEvery = SEGMENT_LENGTH * 5;
    const checkpointsPassed = Math.floor(distanceRef.current / checkpointEvery);
    if (checkpointsPassed > checkpointQueue.current.length) {
      checkpointQueue.current.push(checkpointsPassed);
      s.reachCheckpoint();
      audioService.playCheckpoint();
      shakeRef.current = { time: 0.25, intensity: 0.15 };
    }
  }

  function activatePowerUp(kind, s) {
    audioService.playPowerUp();
    const p = playerRuntime.current;
    const labels = { magnet: 'Letter Magnet', shield: 'Flame Shield', 'star-boost': 'Star Boost', 'slow-time': 'Slow Time' };
    if (kind === 'magnet') {
      p.magnetActive = true;
      powerUpTimer.current = { kind, remaining: 8 };
    } else if (kind === 'shield') {
      p.shieldActive = true;
      powerUpTimer.current = { kind, remaining: 12 };
    } else if (kind === 'slow-time') {
      powerUpTimer.current = { kind, remaining: 6 };
    } else if (kind === 'star-boost') {
      powerUpTimer.current = { kind, remaining: 8 };
    }
    s.setPowerUp({ id: kind, label: labels[kind] || kind, remaining: powerUpTimer.current.remaining });
  }

  return (
    <>
      <FollowCamera stateRef={playerRuntime} shakeRef={shakeRef} />
      <Environment />

      {groundTiles.map((tile, i) => (
        <TrackSegment key={i} zRef={tile} />
      ))}

      <Player stateRef={playerRuntime} primaryColor={character.primaryColor} accent={character.accent} />

      {obstaclePool.map((slot, i) => (
        <Obstacle key={i} posRef={slot} />
      ))}
      {coinPool.map((slot, i) => (
        <LetterCoin key={i} letter={slot.current.letter} posRef={slot} />
      ))}
      {powerUpPool.map((slot, i) => (
        <PowerUp key={i} posRef={slot} />
      ))}
      {turnPool.map((slot, i) => (
        <TurnJunction key={i} turnRef={slot} />
      ))}
      <ChallengeGate gateRef={gateRef} />
    </>
  );
}
