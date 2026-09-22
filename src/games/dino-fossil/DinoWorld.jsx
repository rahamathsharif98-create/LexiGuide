import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import DigSiteEnvironment from './components/DigSiteEnvironment';
import FossilSlab from './components/FossilSlab';
import LexiMascot3D from '../common/mascot/LexiMascot3D';
import VFXCameraJuice from '../common/vfx/VFXCameraJuice';
import VFXFloatingText3D from '../common/vfx/VFXFloatingText3D';
import VFXAmbientMotes from '../common/vfx/VFXAmbientMotes';
import VFXBurstParticles from '../common/vfx/VFXBurstParticles';
import VFXShockwaveRing from '../common/vfx/VFXShockwaveRing';

export default function DinoWorld({
  slabs = [],
  isExcavated = false,
  burstPos = [0, 1, 0],
  burstKey = 0,
  floatingText = 'DUSTED!',
  floatingTextKey = 0,
  mascotState = 'idle',
  onBrushSlab,
}) {
  return (
    <Canvas
      camera={{ position: [0, 5, 8.5], fov: 50 }}
      style={{ width: '100%', height: '100%', background: '#fde047' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#fed7aa']} />
      <ambientLight intensity={0.7} color="#fffbeb" />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.3}
        color="#fff"
        castShadow
      />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#f59e0b" />

      {/* Dynamic Camera Juice: Screen Shake & Victory Orbit */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.22}
        orbitActive={isExcavated}
        orbitSpeed={0.45}
        basePosition={[0, 5, 8.5]}
        targetLookAt={[0, 1.0, 0]}
      />

      <Suspense fallback={null}>
        {/* Archaeological Dig Site */}
        <DigSiteEnvironment isExcavated={isExcavated} />

        {/* Ambient Floating Dust & Amber Sparkles */}
        <VFXAmbientMotes mode="embers" count={25} area={[14, 6, 12]} center={[0, 2, 0]} />

        {/* Dynamic Excavation Dust Puff & Energy Ripple */}
        <VFXBurstParticles position={burstPos} triggerKey={burstKey} color="#d97706" count={26} speed={3.2} />
        <VFXShockwaveRing position={burstPos} triggerKey={burstKey} color="#f59e0b" maxRadius={2.0} />

        {/* 3D Floating Action Text Badge */}
        <VFXFloatingText3D
          text={floatingText}
          position={[burstPos[0], burstPos[1] + 1.1, burstPos[2]]}
          color="#f59e0b"
          triggerKey={floatingTextKey}
        />

        {/* Explorer Mascot Companion standing beside the excavation pit */}
        <group position={[4.2, 0, 1.5]} rotation={[0, -0.6, 0]}>
          {/* Expedition Crate */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.5, 0.8, 1.2]} />
            <meshStandardMaterial color="#92400e" roughness={0.8} />
          </mesh>
          <LexiMascot3D position={[0, 0.8, 0]} scale={0.75} state={mascotState} theme="explorer" />
        </group>

        {/* Floating / Uncovered Fossil Slabs */}
        {slabs.map((slab) => (
          <FossilSlab
            key={slab.id}
            chunk={slab.chunk}
            position={slab.pos}
            isExcavated={slab.isExcavated}
            isNext={slab.isNext}
            onBrush={() => onBrushSlab(slab)}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
