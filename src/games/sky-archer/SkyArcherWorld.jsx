import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import SkyEnvironment from './components/SkyEnvironment';
import BalloonTarget from './components/BalloonTarget';
import LexiMascot3D from '../common/mascot/LexiMascot3D';
import VFXCameraJuice from '../common/vfx/VFXCameraJuice';
import VFXFloatingText3D from '../common/vfx/VFXFloatingText3D';
import VFXAmbientMotes from '../common/vfx/VFXAmbientMotes';
import VFXBurstParticles from '../common/vfx/VFXBurstParticles';
import VFXShockwaveRing from '../common/vfx/VFXShockwaveRing';

export default function SkyArcherWorld({
  currentRound,
  poppedLetters = [],
  burstPos = [0, 0, -5.5],
  burstKey = 0,
  burstColor = '#ef4444',
  floatingText = 'BULLSEYE!',
  floatingTextKey = 0,
  mascotState = 'idle',
  onHitBalloon,
}) {
  const cameraGroup = useRef();

  // Subtle flight swaying to feel like flying on an air glider
  useFrame((state) => {
    if (!cameraGroup.current) return;
    const t = state.clock.elapsedTime;
    cameraGroup.current.position.x = Math.sin(t * 0.5) * 0.4;
    cameraGroup.current.position.y = Math.cos(t * 0.7) * 0.2;
    cameraGroup.current.rotation.z = Math.sin(t * 0.5) * -0.03;
  });

  // 4 balloon flight positions in a wide panoramic arc
  const balloonPositions = [
    [-4.2, 0.2, -6],
    [-1.4, 0.8, -5.5],
    [1.4, 0.8, -5.5],
    [4.2, 0.2, -6],
  ];

  return (
    <>
      <SkyEnvironment />

      {/* Camera Juice: Screen Shake on Balloon Hit */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.24}
        basePosition={[0, 0, 7]}
        targetLookAt={[0, 0, -6]}
      />

      {/* Floating Sparkle Sky Dust */}
      <VFXAmbientMotes mode="sparkles" count={35} area={[16, 10, 12]} center={[0, 1, -5.5]} />

      {/* Balloon Popping 3D Shards Explosion */}
      <VFXBurstParticles position={burstPos} triggerKey={burstKey} color={burstColor} count={36} speed={5.2} size={0.16} />
      <VFXShockwaveRing position={burstPos} triggerKey={burstKey} color="#ffffff" maxRadius={2.8} />

      {/* Floating 3D Action Popup Badge */}
      <VFXFloatingText3D
        text={floatingText}
        position={[burstPos[0], burstPos[1] + 0.8, burstPos[2]]}
        color="#fbbf24"
        triggerKey={floatingTextKey}
      />

      {/* Mascot Companion piloting cloud glider in bottom-right corner */}
      <group position={[3.6, -1.8, 1.2]} rotation={[0, -0.6, 0]}>
        {/* Fluffy Cloud Glider Pod */}
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[1.6, 0.45, 1.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        <mesh position={[0.4, -0.1, 0]}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshStandardMaterial color="#f0f9ff" roughness={0.9} />
        </mesh>
        {/* Mascot */}
        <LexiMascot3D position={[0, 0.1, 0]} scale={0.75} state={mascotState} theme="classic" />
      </group>

      <group ref={cameraGroup}>
        {currentRound.shuffledOptions.map((letter, idx) => {
          const isPopped = poppedLetters.includes(letter);
          const isTarget = letter === currentRound.correct;
          const pos = balloonPositions[idx % balloonPositions.length];

          return (
            <BalloonTarget
              key={`${currentRound.id}-${letter}-${idx}`}
              id={idx}
              letter={letter}
              position={pos}
              isTarget={isTarget}
              isPopped={isPopped}
              colorIndex={idx}
              onHit={(l, isTgt) => onHitBalloon(l, isTgt, pos, idx)}
            />
          );
        })}
      </group>
    </>
  );
}