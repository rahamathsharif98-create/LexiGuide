import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import MoonTerrain from './components/MoonTerrain';
import MoonRover from './components/MoonRover';
import LetterCrystal from './components/LetterCrystal';
import LexiMascot3D from '../common/mascot/LexiMascot3D';
import VFXCameraJuice from '../common/vfx/VFXCameraJuice';
import VFXFloatingText3D from '../common/vfx/VFXFloatingText3D';
import VFXAmbientMotes from '../common/vfx/VFXAmbientMotes';
import VFXBurstParticles from '../common/vfx/VFXBurstParticles';
import VFXShockwaveRing from '../common/vfx/VFXShockwaveRing';

export default function CosmicMinerWorld({
  crystals = [],
  roverTargetPos = null,
  burstPos = [0, 1, 0],
  burstKey = 0,
  floatingText = 'CRACKED!',
  floatingTextKey = 0,
  mascotState = 'idle',
  onCollectLetter,
  rocketLaunched = false,
}) {
  return (
    <Canvas
      camera={{ position: [0, 8, 13], fov: 55 }}
      style={{ width: '100%', height: '100%', background: '#050814' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#050814']} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[15, 25, 10]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-15, 10, -10]} intensity={0.4} color="#60a5fa" />

      {/* Dynamic Camera Juice: Screen Shake & Victory Orbit */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.22}
        orbitActive={rocketLaunched}
        orbitSpeed={0.4}
        basePosition={[0, 8, 13]}
        targetLookAt={[0, 1.2, 0]}
      />

      <Suspense fallback={null}>
        {/* Moon Environment */}
        <MoonTerrain rocketLaunched={rocketLaunched} />

        {/* Twinkling 3D Starfield & Nebular Motes */}
        <VFXAmbientMotes mode="stardust" count={85} area={[26, 16, 26]} center={[0, 5, 0]} />

        {/* Dynamic Crystal Mining Laser Burst & Shockwave */}
        <VFXBurstParticles position={burstPos} triggerKey={burstKey} color="#38bdf8" count={32} speed={4.8} size={0.15} />
        <VFXShockwaveRing position={burstPos} triggerKey={burstKey} color="#818cf8" maxRadius={2.6} />

        {/* 3D Action Comic Popup Text */}
        <VFXFloatingText3D
          text={floatingText}
          position={[burstPos[0], burstPos[1] + 1.2, burstPos[2]]}
          color="#38bdf8"
          triggerKey={floatingTextKey}
        />

        {/* Rover exploration vehicle */}
        <MoonRover targetPos={roverTargetPos} />

        {/* Astronaut Fox Companion Mascot standing on lunar survey rock */}
        <group position={[-5, 0.4, 4.5]} rotation={[0, 0.6, 0]}>
          {/* Survey Stone Base */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[1.2, 1.4, 0.4, 16]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <ringGeometry args={[0.9, 1.15, 16]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          {/* Lexi Mascot in Astronaut Suit */}
          <LexiMascot3D position={[0, 0.1, 0]} scale={0.78} state={mascotState} theme="astronaut" />
        </group>

        {/* Letter crystals */}
        {crystals.map((item) => (
          <LetterCrystal
            key={item.id}
            letter={item.letter}
            position={item.position}
            isNext={item.isNext}
            isCollected={item.isCollected}
            onCollect={() => onCollectLetter(item)}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
