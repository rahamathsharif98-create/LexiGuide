import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import SkyCloudEnvironment from './components/SkyCloudEnvironment';
import CloudPlatform from './components/CloudPlatform';
import BouncyBunny from './components/BouncyBunny';
import LexiMascot3D from '../common/mascot/LexiMascot3D';
import VFXCameraJuice from '../common/vfx/VFXCameraJuice';
import VFXFloatingText3D from '../common/vfx/VFXFloatingText3D';
import VFXAmbientMotes from '../common/vfx/VFXAmbientMotes';
import VFXBurstParticles from '../common/vfx/VFXBurstParticles';
import VFXShockwaveRing from '../common/vfx/VFXShockwaveRing';

export default function CloudWorld({
  platforms = [],
  bunnyPos = [0, 2, 0],
  burstPos = [0, 2.5, -1],
  burstKey = 0,
  floatingText = 'SUPER BOUNCE!',
  floatingTextKey = 0,
  mascotState = 'idle',
  isSummitReached = false,
  onBounceCloud,
}) {
  return (
    <Canvas
      camera={{ position: [0, 5, 10], fov: 52 }}
      style={{ width: '100%', height: '100%', background: '#bae6fd' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#bae6fd']} />
      <ambientLight intensity={0.75} color="#ffffff" />
      <directionalLight position={[10, 20, 10]} intensity={1.2} color="#ffffff" />
      <pointLight position={[0, 8, 4]} intensity={0.5} color="#fef08a" />

      {/* Dynamic Camera Juice: Screen Shake & Victory Orbit */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.2}
        orbitActive={isSummitReached}
        orbitSpeed={0.4}
        basePosition={[0, 5, 10]}
        targetLookAt={[0, 4, 0]}
      />

      <Suspense fallback={null}>
        {/* Sky, Rainbow & Stars */}
        <SkyCloudEnvironment />

        {/* Ambient Rainbow Fairy Sparkles */}
        <VFXAmbientMotes mode="sparkles" count={45} area={[18, 12, 14]} center={[0, 4, -1]} />

        {/* Dynamic Cloud Bounce Shimmer Burst */}
        <VFXBurstParticles position={burstPos} triggerKey={burstKey} color="#f472b6" count={32} speed={4.5} size={0.15} />
        <VFXShockwaveRing position={burstPos} triggerKey={burstKey} color="#ec4899" maxRadius={2.5} />

        {/* 3D Action Comic Popup Text */}
        <VFXFloatingText3D
          text={floatingText}
          position={[burstPos[0], burstPos[1] + 1.2, burstPos[2]]}
          color="#ec4899"
          triggerKey={floatingTextKey}
        />

        {/* Mascot Companion cheering on fluffy cloud */}
        <group position={[4.2, 0.4, 2]} rotation={[0, -0.5, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[1.2, 1.4, 0.5, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          <LexiMascot3D position={[0, 0.4, 0]} scale={0.75} state={mascotState} theme="classic" />
        </group>

        {/* Cloud Platforms */}
        {platforms.map((platform) => (
          <CloudPlatform
            key={platform.id}
            word={platform.word}
            position={platform.pos}
            isTarget={platform.isTarget}
            isBounced={platform.isBounced}
            onBounce={() => onBounceCloud(platform)}
          />
        ))}

        {/* Mascot Bunny */}
        <BouncyBunny currentPos={bunnyPos} />
      </Suspense>
    </Canvas>
  );
}
