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
      <ambientLight intensity={0.7} color="#fffbeb" />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.3}
        color="#fdba74"
        castShadow
      />
      <pointLight position={[0, 4, 0]} intensity={0.5} color="#f59e0b" />

      {/* Dynamic Camera Juice: Screen Shake & Victory Orbit */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.25}
        orbitActive={isPhotoComplete}
        orbitSpeed={0.35}
        basePosition={[0, 3.5, 7.5]}
        targetLookAt={[0, 1.2, 0]}
      />

      <Suspense fallback={null}>
        {/* Savanna Landscape */}
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

        {/* Explorer Mascot Companion on Rocky Outcrop overlooking savanna */}
        <group position={[-4.5, 1.5, -3.5]} rotation={[0, 0.7, 0]}>
          <LexiMascot3D position={[0, 0, 0]} scale={0.75} state={mascotState} theme="explorer" />
        </group>

        {/* Roaming Savanna Wildlife */}
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
