import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import SpiderCharacter from './components/SpiderCharacter';
import CobwebEnvironment from './components/CobwebEnvironment';
import WebStrandNode from './components/WebStrandNode';
import VFXCameraJuice from '../common/vfx/VFXCameraJuice';
import VFXFloatingText3D from '../common/vfx/VFXFloatingText3D';
import VFXAmbientMotes from '../common/vfx/VFXAmbientMotes';
import VFXBurstParticles from '../common/vfx/VFXBurstParticles';
import VFXShockwaveRing from '../common/vfx/VFXShockwaveRing';

/**
 * SpiderWorld.jsx
 * React Three Fiber 3D Canvas world for "Spinny the Spider: Web Weaver"
 */
export default function SpiderWorld({
  level,
  options = [],
  selectedRime = null,
  spiderState = 'idle',
  burstPos = [0, 1.5, 0],
  burstKey = 0,
  floatingText = 'SILKY WEAVE!',
  floatingTextKey = 0,
  isVictory = false,
  onSelectOption,
}) {
  // Coordinates for the 3 dewdrop rime nodes around the web
  const nodePositions = [
    [-3.2, 2.6, 0.1],
    [0.0, 4.0, 0.1],
    [3.2, 2.6, 0.1],
  ];

  return (
    <Canvas
      camera={{ position: [0, 2.8, 9.2], fov: 50 }}
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#090d16']} />
      <ambientLight intensity={0.65} color="#c4b5fd" />
      <directionalLight position={[5, 12, 8]} intensity={1.1} color="#fef08a" />
      <pointLight position={[0, 2, 3]} intensity={0.8} color="#a855f7" />

      {/* Camera Juice & Victory Orbit */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.18}
        orbitActive={isVictory}
        orbitSpeed={0.35}
        basePosition={[0, 2.8, 9.2]}
        targetLookAt={[0, 2.0, 0]}
      />

      <Suspense fallback={null}>
        {/* Ambient Moonlit Garden Fireflies */}
        <VFXAmbientMotes mode="fireflies" count={40} area={[16, 12, 12]} center={[0, 2.5, 0]} />

        {/* Dynamic Silk Weaving Particle Shimmer Burst */}
        <VFXBurstParticles
          position={burstPos}
          triggerKey={burstKey}
          color="#34d399"
          count={35}
          speed={4.0}
          size={0.16}
        />
        <VFXShockwaveRing position={burstPos} triggerKey={burstKey} color="#10b981" maxRadius={2.8} />

        {/* 3D Action Comic Popup Text */}
        <VFXFloatingText3D
          text={floatingText}
          position={[burstPos[0], burstPos[1] + 1.4, burstPos[2]]}
          color="#facc15"
          triggerKey={floatingTextKey}
        />

        {/* Cobweb Environment */}
        <CobwebEnvironment />

        {/* Spinny the Spider Mascot in the Center */}
        <SpiderCharacter
          position={[0, 1.2, 0]}
          state={spiderState}
        />

        {/* Interactive Dewdrop Rime Nodes */}
        {options.map((option, idx) => (
          <WebStrandNode
            key={`node-${level?.id}-${option}-${idx}`}
            rime={option}
            position={nodePositions[idx] || [0, 2, 0]}
            isTarget={option === level?.targetRime}
            isSelected={selectedRime === option}
            onSelect={onSelectOption}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
