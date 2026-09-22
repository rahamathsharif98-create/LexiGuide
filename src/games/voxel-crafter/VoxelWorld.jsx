import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import VoxelEnvironment from './components/VoxelEnvironment';
import VoxelBlock from './components/VoxelBlock';
import LexiMascot3D from '../common/mascot/LexiMascot3D';
import VFXCameraJuice from '../common/vfx/VFXCameraJuice';
import VFXFloatingText3D from '../common/vfx/VFXFloatingText3D';
import VFXAmbientMotes from '../common/vfx/VFXAmbientMotes';
import VFXBurstParticles from '../common/vfx/VFXBurstParticles';
import VFXShockwaveRing from '../common/vfx/VFXShockwaveRing';

export default function VoxelWorld({
  blocks = [],
  isCrafted = false,
  rewardName = 'Trophy',
  burstPos = [0, 1.6, 0],
  burstKey = 0,
  floatingText = 'PERFECT!',
  floatingTextKey = 0,
  mascotState = 'idle',
  onSelectBlock,
}) {
  return (
    <Canvas
      camera={{ position: [0, 4.2, 7.5], fov: 48 }}
      style={{ width: '100%', height: '100%', background: '#38bdf8' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#38bdf8']} />
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.3}
        color="#fff"
        castShadow
      />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#4ade80" />

      {/* Dynamic Camera Juice: Screen Shake & Victory Orbit Sweep */}
      <VFXCameraJuice
        shakeKey={burstKey}
        intensity={0.18}
        isVictory={isCrafted}
        basePosition={[0, 4.2, 7.5]}
        targetLookAt={[0, 1.2, 0]}
      />

      <Suspense fallback={null}>
        {/* Living Voxel Sandbox World with Windmill & Castle */}
        <VoxelEnvironment isCrafted={isCrafted} rewardName={rewardName} />

        {/* 3D Animated Mascot Companion (Lexi) cheering on the child! */}
        <LexiMascot3D
          position={[2.4, 0.05, 1.8]}
          rotation={[0, -0.7, 0]}
          scale={0.9}
          state={isCrafted ? 'victory' : mascotState}
          theme="classic"
        />

        {/* Floating 3D Action Popup Badges */}
        <VFXFloatingText3D
          text={floatingText}
          position={[burstPos[0], burstPos[1] + 0.6, burstPos[2]]}
          color="#fbbf24"
          triggerKey={floatingTextKey}
        />

        {/* Ambient Floating Crafting Sawdust & Magic Sparkles */}
        <VFXAmbientMotes mode="sparkles" count={45} area={[16, 10, 14]} center={[0, 3, 0]} />

        {/* Dynamic Snap Burst VFX */}
        <VFXBurstParticles position={burstPos} triggerKey={burstKey} color="#fbbf24" count={30} speed={4.0} />
        <VFXShockwaveRing position={burstPos} triggerKey={burstKey} color="#38bdf8" maxRadius={2.4} />

        {/* Voxel Blocks */}
        {blocks.map((block) => (
          <VoxelBlock
            key={block.id}
            letter={block.letter}
            blockColor={block.blockColor}
            targetPos={block.pos}
            isPlaced={block.isPlaced}
            slotIndex={block.slotIndex}
            isNext={block.isNext}
            onClick={() => onSelectBlock(block)}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}
