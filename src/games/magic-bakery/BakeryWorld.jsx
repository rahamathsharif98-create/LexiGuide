import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import BakeryKitchen from './components/BakeryKitchen';
import CakeTier from './components/CakeTier';
import LexiMascot3D from '../common/mascot/LexiMascot3D';
import VFXCameraJuice from '../common/vfx/VFXCameraJuice';
import VFXFloatingText3D from '../common/vfx/VFXFloatingText3D';
import VFXAmbientMotes from '../common/vfx/VFXAmbientMotes';
import VFXBurstParticles from '../common/vfx/VFXBurstParticles';
import VFXShockwaveRing from '../common/vfx/VFXShockwaveRing';

export default function BakeryWorld({
  tiers = [],
  isBakeComplete = false,
  burstPos = [0, 1.8, 0],
  burstKey = 0,
  floatingText = 'FROSTING SNAP!',
  floatingTextKey = 0,
  mascotState = 'idle',
  onSelectTier,
}) {
  return (
    <Canvas
      camera={{ position: [0, 4.5, 9.5], fov: 48 }}
      style={{ width: '100%', height: '100%', background: '#fef3c7' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#fef3c7']} />
      <ambientLight intensity={0.7} color="#fffbeb" />
      <directionalLight
        position={[8, 15, 8]}
        intensity={1.2}
        color="#fff"
        castShadow
      />
      <pointLight position={[0, 4, 3]} intensity={0.5} color="#fbbf24" />

      {/* Dynamic Camera Juice: Screen Shake & Victory Orbit */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.2}
        orbitActive={isBakeComplete}
        orbitSpeed={0.4}
        basePosition={[0, 4.5, 9.5]}
        targetLookAt={[0, 2.0, 0]}
      />

      <Suspense fallback={null}>
        {/* Bakery Kitchen Scene */}
        <BakeryKitchen isBakeComplete={isBakeComplete} />

        {/* Ambient Sugar Sprinkles & Confectionery Sparkles */}
        <VFXAmbientMotes mode="sparkles" count={45} area={[16, 10, 14]} center={[0, 3, 0]} />

        {/* Frosting Snap Sparkle Burst */}
        <VFXBurstParticles position={burstPos} triggerKey={burstKey} color="#ec4899" count={30} speed={4.0} size={0.14} />
        <VFXShockwaveRing position={burstPos} triggerKey={burstKey} color="#fb7185" maxRadius={2.2} />

        {/* 3D Action Comic Popup Text */}
        <VFXFloatingText3D
          text={floatingText}
          position={[burstPos[0], burstPos[1] + 1.2, burstPos[2]]}
          color="#ec4899"
          triggerKey={floatingTextKey}
        />

        {/* Mascot Fox Companion cheering on the bakery counter */}
        <group position={[4.0, 0, 1.2]} rotation={[0, -0.6, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.9, 1.1, 0.8, 16]} />
            <meshStandardMaterial color="#fef08a" roughness={0.4} />
          </mesh>
          <LexiMascot3D position={[0, 0.8, 0]} scale={0.72} state={mascotState} theme="classic" />
        </group>

        {/* Floating / Stacked Cake Tiers */}
        {tiers.map((tier) => (
          <CakeTier
            key={tier.id}
            syllable={tier.syllable}
            color={tier.color}
            frostingColor={tier.frostingColor}
            targetPos={tier.pos}
            isStacked={tier.isStacked}
            stackIndex={tier.stackIndex}
            isCandleTop={isBakeComplete && tier.isTop}
            onClick={() => onSelectTier(tier)}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
