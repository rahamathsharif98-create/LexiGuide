import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import CoralEnvironment from './components/CoralEnvironment';
import Submarine from './components/Submarine';
import WordBubble from './components/WordBubble';
import LexiMascot3D from '../common/mascot/LexiMascot3D';
import VFXCameraJuice from '../common/vfx/VFXCameraJuice';
import VFXFloatingText3D from '../common/vfx/VFXFloatingText3D';
import VFXAmbientMotes from '../common/vfx/VFXAmbientMotes';
import VFXBurstParticles from '../common/vfx/VFXBurstParticles';
import VFXShockwaveRing from '../common/vfx/VFXShockwaveRing';

export default function CoralDiverWorld({
  bubbles = [],
  submarineTargetPos = null,
  burstPos = [0, 3, 0],
  burstKey = 0,
  floatingText = 'RHYME POP!',
  floatingTextKey = 0,
  mascotState = 'idle',
  isLevelComplete = false,
  onCollectBubble,
}) {
  return (
    <Canvas
      camera={{ position: [0, 5, 13], fov: 55 }}
      style={{ width: '100%', height: '100%', background: '#0284c7' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <fog attach="fog" args={['#0369a1', 10, 45]} />
      <color attach="background" args={['#0369a1']} />

      <ambientLight intensity={0.6} color="#e0f2fe" />
      <directionalLight
        position={[0, 20, 5]}
        intensity={1.2}
        color="#7dd3fc"
      />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#38bdf8" />

      {/* Dynamic Camera Juice: Screen Shake & Victory Orbit */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.2}
        orbitActive={isLevelComplete}
        orbitSpeed={0.35}
        basePosition={[0, 5, 13]}
        targetLookAt={[0, 2.5, 0]}
      />

      <Suspense fallback={null}>
        {/* Coral Reef Environment */}
        <CoralEnvironment />

        {/* Dynamic Rising 3D Bubble Streams */}
        <VFXAmbientMotes mode="bubbles" count={55} area={[20, 14, 18]} center={[0, 4, 0]} />

        {/* Bubble Pop Shimmer Burst */}
        <VFXBurstParticles position={burstPos} triggerKey={burstKey} color="#67e8f9" count={30} speed={4.2} size={0.14} />
        <VFXShockwaveRing position={burstPos} triggerKey={burstKey} color="#38bdf8" maxRadius={2.4} />

        {/* 3D Action Comic Popup Text */}
        <VFXFloatingText3D
          text={floatingText}
          position={[burstPos[0], burstPos[1] + 1.2, burstPos[2]]}
          color="#38bdf8"
          triggerKey={floatingTextKey}
        />

        {/* Scuba Diver Fox Mascot in observation dome on sea floor */}
        <group position={[-5, 0.2, 5]} rotation={[0, 0.5, 0]}>
          {/* Glass Diving Bell Pod */}
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.35} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[1.2, 1.3, 0.2, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} />
          </mesh>
          <LexiMascot3D position={[0, 0.4, 0]} scale={0.72} state={mascotState} theme="scuba" />
        </group>

        {/* Player Submarine */}
        <Submarine targetPos={submarineTargetPos} />

        {/* Interactive Rhyme Word Bubbles */}
        {bubbles.map((b) => (
          <WordBubble
            key={b.id}
            word={b.word}
            position={b.position}
            isRhyme={b.isRhyme}
            isCollected={b.isCollected}
            onCollect={() => onCollectBubble(b)}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
