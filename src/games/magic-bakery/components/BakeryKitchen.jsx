import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Creates a cute chalkboard sign texture reading:
 * "Fresh Cakes \n Happy Kids ♥" matching the bakery reference photo.
 */
function createChalkboardTexture() {
  if (typeof document === 'undefined') return new THREE.Texture();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;
  if (ctx) {
    // 1. Dark blackboard slate
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 384);

    // 2. Subtle chalk border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, 480, 352);

    // 3. Chalk lettering
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Baloo 2", "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Fresh Cakes', 256, 125);
    ctx.fillText('Happy Kids', 256, 205);

    // 4. Pink chalk heart
    ctx.font = 'bold 52px sans-serif';
    ctx.fillStyle = '#f472b6';
    ctx.fillText('♥', 256, 295);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function BakeryKitchen({ isBakeComplete = false }) {
  const sprinkleRef = useRef();

  const chalkboardTexture = useMemo(() => createChalkboardTexture(), []);

  useFrame((state, delta) => {
    if (isBakeComplete && sprinkleRef.current) {
      const positions = sprinkleRef.current.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= delta * 3.5;
        if (positions[i] < 0) {
          positions[i] = 12;
        }
      }
      sprinkleRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Cozy Pastel Bakery Back Wall & Baseboard                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <mesh position={[0, 5.5, -8.6]}>
        <planeGeometry args={[34, 18]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.7} />
      </mesh>
      {/* Wooden Wall Baseboard Trim */}
      <mesh position={[0, 0.2, -8.5]}>
        <boxGeometry args={[34, 0.4, 0.2]} />
        <meshStandardMaterial color="#b45309" roughness={0.6} />
      </mesh>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Arched Sunny Bakery Window (Left Side: -6.8, 5.2, -8.4)          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <group position={[-6.8, 5.2, -8.4]}>
        {/* Sunny blue sky & outdoor garden foliage backdrop */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[3.2, 4.4]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>
        {/* Distant green garden treetop */}
        <mesh position={[0, -0.8, -0.02]}>
          <circleGeometry args={[1.5, 24]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>

        {/* White window frame border */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[3.4, 4.6, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Cutout glass pane */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[3.0, 4.2]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={0.3} />
        </mesh>

        {/* Window muntin bars (Cross slats) */}
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[0.08, 4.2, 0.04]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.4, 0.08]}>
          <boxGeometry args={[3.0, 0.08, 0.04]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {/* Windowsill Shelf */}
        <mesh position={[0, -2.25, 0.2]}>
          <boxGeometry args={[3.8, 0.2, 0.5]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Cute pink flowerpot on the sill */}
        <group position={[-0.8, -1.85, 0.2]}>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.3, 0.22, 0.35, 16]} />
            <meshStandardMaterial color="#f472b6" roughness={0.5} />
          </mesh>
          {/* Green flower foliage */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.26, 12, 12]} />
            <meshStandardMaterial color="#22c55e" roughness={0.4} />
          </mesh>
          {/* White flower blossom */}
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Framed Chalkboard Sign: "Fresh Cakes Happy Kids ♥"               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <group position={[-3.8, 5.4, -8.3]}>
        {/* Wooden outer frame */}
        <mesh>
          <boxGeometry args={[2.5, 1.9, 0.1]} />
          <meshStandardMaterial color="#b45309" roughness={0.6} />
        </mesh>
        {/* Chalkboard face with text texture */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.3, 1.7]} />
          <meshBasicMaterial map={chalkboardTexture} />
        </mesh>
      </group>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. Warm Oak Bakery Shelves & Pastry Displays                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Upper Long Bakery Shelf */}
      <group position={[0.6, 5.9, -8.0]}>
        <mesh>
          <boxGeometry args={[11.2, 0.22, 1.2]} />
          <meshStandardMaterial color="#b45309" roughness={0.6} />
        </mesh>

        {/* A. Artisanal Baguette Bread Basket on Shelf */}
        <group position={[-4.0, 0.45, 0]}>
          {/* Wicker basket */}
          <mesh>
            <cylinderGeometry args={[0.6, 0.45, 0.5, 16]} />
            <meshStandardMaterial color="#d97706" roughness={0.8} />
          </mesh>
          {/* Golden baguettes tilted upward */}
          {[-0.2, 0.0, 0.2].map((x, i) => (
            <mesh key={`baguette-${i}`} position={[x, 0.45, 0]} rotation={[0, 0, -0.25 + i * 0.2]}>
              <cylinderGeometry args={[0.1, 0.12, 1.1, 10]} />
              <meshStandardMaterial color="#b45309" roughness={0.6} />
            </mesh>
          ))}
        </group>

        {/* B. Trio of Decorated Swirled Cupcakes */}
        <group position={[-1.8, 0.25, 0]}>
          {[-0.5, 0, 0.5].map((x, i) => (
            <group key={`cupcake-${i}`} position={[x, 0, 0]}>
              {/* Cupcake paper wrapper */}
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.18, 0.12, 0.22, 12]} />
                <meshStandardMaterial color="#fed7aa" />
              </mesh>
              {/* Frosting swirl */}
              <mesh position={[0, 0.26, 0]}>
                <sphereGeometry args={[0.17, 12, 12]} />
                <meshStandardMaterial
                  color={['#f472b6', '#fef08a', '#38bdf8'][i]}
                  roughness={0.3}
                />
              </mesh>
              {/* Cherry on top */}
              <mesh position={[0, 0.42, 0]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#e11d48" roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>

        {/* C. Miniature 2-Tier Pink Celebration Cake on Mini Pedestal Stand */}
        <group position={[0.5, 0.35, 0]}>
          {/* Mini pedestal */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.08, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          {/* Bottom tier */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.3, 16]} />
            <meshStandardMaterial color="#f472b6" roughness={0.4} />
          </mesh>
          {/* Top tier */}
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.2, 16]} />
            <meshStandardMaterial color="#fbcfe8" roughness={0.4} />
          </mesh>
          {/* Mini strawberry topper */}
          <mesh position={[0, 0.65, 0]}>
            <coneGeometry args={[0.08, 0.16, 8]} />
            <meshStandardMaterial color="#e11d48" />
          </mesh>
        </group>

        {/* D. Clear Jars of Colourful Rainbow Sprinkles & Candy */}
        {[2.4, 3.6].map((x, i) => (
          <group key={`jar-sprinkles-${i}`} position={[x, 0.42, 0]}>
            {/* Glass canister */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.65, 16]} />
              <meshStandardMaterial
                color={['#fb7185', '#38bdf8'][i]}
                roughness={0.15}
                transparent
                opacity={0.88}
              />
            </mesh>
            {/* Golden screw lid */}
            <mesh position={[0, 0.36, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.08, 16]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* E. Potted Green Kitchen Herb Plant */}
        <group position={[4.8, 0.35, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.18, 0.35, 14]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial color="#16a34a" roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. Warm Copper Hanging Pendant Lamps                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {[-2.0, 2.0].map((x, idx) => (
        <group key={`lamp-${idx}`} position={[x, 6.8, -6.6]}>
          {/* Black hanging wire */}
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 1.6, 8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Copper cone shade */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.55, 0.45, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Warm downward light pool */}
          <pointLight position={[0, -0.3, 0]} intensity={0.75} color="#fde68a" distance={7} />
        </group>
      ))}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. Vintage Pastel Mint Retro Baking Oven (Right Side: 7.2, 2.8, -7.5)*/}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <group position={[7.2, 2.8, -7.5]}>
        {/* Retro mint oven body */}
        <mesh>
          <boxGeometry args={[3.2, 4.2, 2.4]} />
          <meshStandardMaterial color="#2dd4bf" roughness={0.4} />
        </mesh>
        {/* Top Control Panel Chrome Bezel */}
        <mesh position={[0, 1.6, 1.22]}>
          <boxGeometry args={[2.8, 0.6, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* 3 Chrome Temperature/Timer Dials */}
        {[-0.8, 0, 0.8].map((dialX, i) => (
          <mesh key={`dial-${i}`} position={[dialX, 1.6, 1.28]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {/* Glass oven door window with glowing bake interior */}
        <mesh position={[0, 0.1, 1.22]}>
          <planeGeometry args={[2.2, 1.8]} />
          <meshStandardMaterial
            color="#ea580c"
            emissive="#ea580c"
            emissiveIntensity={0.85}
            roughness={0.2}
          />
        </mesh>
        {/* Chrome Oven Door Handle Bar */}
        <mesh position={[0, 1.15, 1.32]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 2.0, 12]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. Warm Honey Oak Countertop Table                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[26, 0.8, 16]} />
        <meshStandardMaterial color="#d97706" roughness={0.45} />
      </mesh>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. Foreground Baking Accents (Pink Checkered Cloth & Rolling Pin)    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <group position={[6.0, 0.04, 2.8]}>
        {/* Pink folded baker's napkin */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <planeGeometry args={[1.8, 1.4]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.8} />
        </mesh>
        {/* Wooden rolling pin */}
        <group position={[0.2, 0.1, 0]} rotation={[0, 0.3, Math.PI / 2]}>
          {/* Main rolling cylinder */}
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, 1.4, 16]} />
            <meshStandardMaterial color="#b45309" roughness={0.5} />
          </mesh>
          {/* Side handles */}
          {[-0.8, 0.8].map((handleY, i) => (
            <mesh key={`handle-${i}`} position={[0, handleY, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.25, 12]} />
              <meshStandardMaterial color="#92400e" roughness={0.4} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. Central Elegant Confectionery Cake Stand (Top surface at y = 0.70)*/}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <group position={[0, 0, 0]}>
        {/* Pedestal Foot Base */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[1.7, 2.0, 0.1, 32]} />
          <meshStandardMaterial color="#fefce8" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Fluted Ceramic Pedestal Stem */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.45, 0.7, 0.5, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Decorative Golden Neck Collar */}
        <mesh position={[0, 0.57, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.06, 24]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.5} />
        </mesh>
        {/* Main Ivory Platter Plate (Top surface rests flush at y = 0.65 + 0.05 = 0.70) */}
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[2.05, 2.05, 0.1, 32]} />
          <meshStandardMaterial color="#fffbeb" roughness={0.35} metalness={0.08} />
        </mesh>
        {/* Gleaming Golden Outer Platter Rim */}
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[2.08, 2.08, 0.04, 32]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.5} />
        </mesh>
        {/* Subtle Decorative Golden Lace / Cake Target Guide Ring on Top Plate */}
        <mesh position={[0, 0.701, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.52, 1.80, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.32} depthWrite={false} />
        </mesh>
        {/* Center Decorative Bakery Emblem */}
        <mesh position={[0, 0.701, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.45, 24]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 10. Celebration Confetti / Falling Sprinkles on Level Complete      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isBakeComplete && (
        <points ref={sprinkleRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={60}
              array={
                new Float32Array(
                  Array.from({ length: 180 }, (_, i) =>
                    i % 3 === 1 ? Math.random() * 12 : (Math.random() - 0.5) * 12
                  )
                )
              }
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial color="#f43f5e" size={0.35} sizeAttenuation />
        </points>
      )}
    </group>
  );
}
