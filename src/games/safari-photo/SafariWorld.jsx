import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import SavannaEnvironment from './components/SavannaEnvironment';
import SafariAnimal from './components/SafariAnimal';
import { SAFARI_TARGETS } from './engine/safariAnimals';
import LexiMascot3D from '../common/mascot/LexiMascot3D';
import VFXCameraJuice from '../common/vfx/VFXCameraJuice';
import VFXFloatingText3D from '../common/vfx/VFXFloatingText3D';
import VFXAmbientMotes from '../common/vfx/VFXAmbientMotes';
import VFXBurstParticles from '../common/vfx/VFXBurstParticles';
import VFXShockwaveRing from '../common/vfx/VFXShockwaveRing';

export default function SafariWorld({
  currentTarget,
  isPhotoComplete = false,
  isVictory = false,
  burstPos = [0, 1.5, 0],
  burstKey = 0,
  floatingText = 'PERFECT SNAP! 📸',
  floatingTextKey = 0,
  mascotState = 'idle',
  onSnapAnimal,
}) {
  return (
    <Canvas
      camera={{ position: [0, 3.5, 7.5], fov: 55 }}
      style={{ width: '100%', height: '100%', background: '#fed7aa' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#fed7aa']} />
      <ambientLight intensity={0.75} color="#fffbeb" />
      {/* Primary Key Sunlight */}
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.3}
        color="#fdba74"
        castShadow
      />
      {/* Soft Ambient Fill Light to illuminate animal details on the left */}
      <directionalLight
        position={[-10, 12, -4]}
        intensity={0.4}
        color="#fef3c7"
      />
      <pointLight position={[0, 4, 0]} intensity={0.5} color="#f59e0b" />

      {/* Dynamic Camera Juice: Screen Shake on snaps & Cinematic Orbit on Victory */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.25}
        isVictory={isVictory}
        basePosition={[0, 3.5, 7.5]}
        targetLookAt={[0, 1.2, 0]}
      />

      <Suspense fallback={null}>
        {/* Savanna Landscape with Pride Rock, Acacia & Baobab Tree */}
        <SavannaEnvironment />

        {/* Ambient Savanna Fireflies & Golden Dust Motes */}
        <VFXAmbientMotes mode="fireflies" count={45} area={[18, 10, 16]} center={[0, 2, 0]} />

        {/* Camera Snap Shimmer Burst */}
        <VFXBurstParticles position={burstPos} triggerKey={burstKey} color="#f59e0b" count={30} speed={4.2} size={0.14} />
        <VFXShockwaveRing position={burstPos} triggerKey={burstKey} color="#fef08a" maxRadius={2.4} />

        {/* 3D Action Comic Popup Text */}
        <VFXFloatingText3D
          text={floatingText}
          position={[burstPos[0], burstPos[1] + 1.2, burstPos[2]]}
          color="#f59e0b"
          triggerKey={floatingTextKey}
        />

        {/* Explorer Mascot Companion on Lookout Ledge (non-overlapping with Lion) */}
        <group position={[-6.0, 1.4, -2.6]} rotation={[0, 0.9, 0]}>
          <LexiMascot3D position={[0, 0, 0]} scale={0.75} state={mascotState} theme="explorer" />
        </group>

        {/* Roaming Savanna Wildlife with Recognizable 3D Models */}
        {SAFARI_TARGETS.map((animal) => (
          <SafariAnimal
            key={animal.id}
            target={animal}
            isTarget={animal.id === currentTarget?.id}
            isSnapped={isPhotoComplete && animal.id === currentTarget?.id}
            onSnap={onSnapAnimal}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
