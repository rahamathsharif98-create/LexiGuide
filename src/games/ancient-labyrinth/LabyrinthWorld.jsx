import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import LabyrinthEnvironment from './components/LabyrinthEnvironment';
import GlyphKeystone from './components/GlyphKeystone';
import LexiMascot3D from '../common/mascot/LexiMascot3D';
import VFXCameraJuice from '../common/vfx/VFXCameraJuice';
import VFXFloatingText3D from '../common/vfx/VFXFloatingText3D';
import VFXAmbientMotes from '../common/vfx/VFXAmbientMotes';
import VFXBurstParticles from '../common/vfx/VFXBurstParticles';
import VFXShockwaveRing from '../common/vfx/VFXShockwaveRing';

export default function LabyrinthWorld({
  keystones = [],
  isUnlocked = false,
  burstPos = [0, 1, 0],
  burstKey = 0,
  floatingText = 'RUNE UNLOCKED!',
  floatingTextKey = 0,
  mascotState = 'idle',
  onCollectKeystone,
}) {
  return (
    <Canvas
      camera={{ position: [0, 4.5, 7.5], fov: 55 }}
      style={{ width: '100%', height: '100%', background: '#0c0a09' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0c0a09']} />
      <fog attach="fog" args={['#1c1917', 5, 30]} />

      <ambientLight intensity={0.45} color="#fdba74" />
      <directionalLight
        position={[0, 15, 5]}
        intensity={0.9}
        color="#fed7aa"
      />
      <pointLight position={[0, 3, 0]} intensity={0.8} color="#f97316" distance={15} />

      {/* Dynamic Camera Juice: Screen Shake & Victory Orbit */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.22}
        orbitActive={isUnlocked}
        orbitSpeed={0.4}
        basePosition={[0, 4.5, 7.5]}
        targetLookAt={[0, 2.0, -3]}
      />

      <Suspense fallback={null}>
        {/* Labyrinth Environment & Vault Door */}
        <LabyrinthEnvironment isUnlocked={isUnlocked} />

        {/* Ambient Rising Torch Flame Embers */}
        <VFXAmbientMotes mode="embers" count={45} area={[16, 8, 16]} center={[0, 2, -2]} />

        {/* Ancient Rune Unlock Burst */}
        <VFXBurstParticles position={burstPos} triggerKey={burstKey} color="#f59e0b" count={30} speed={4.2} size={0.14} />
        <VFXShockwaveRing position={burstPos} triggerKey={burstKey} color="#fbbf24" maxRadius={2.4} />

        {/* 3D Action Comic Popup Text */}
        <VFXFloatingText3D
          text={floatingText}
          position={[burstPos[0], burstPos[1] + 1.2, burstPos[2]]}
          color="#f59e0b"
          triggerKey={floatingTextKey}
        />

        {/* Explorer Fox Mascot Companion inside the labyrinth corridor */}
        <group position={[4.0, 0, -1]} rotation={[0, -0.6, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.4, 0.8, 1.4]} />
            <meshStandardMaterial color="#57534e" roughness={0.9} />
          </mesh>
          <LexiMascot3D position={[0, 0.8, 0]} scale={0.72} state={mascotState} theme="explorer" />
        </group>

        {/* Floating Glyph Keystones */}
        {keystones.map((item) => (
          <GlyphKeystone
            key={item.id}
            glyph={item.glyph}
            position={item.pos}
            isNext={item.isNext}
            isCollected={item.isCollected}
            onCollect={() => onCollectKeystone(item)}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
