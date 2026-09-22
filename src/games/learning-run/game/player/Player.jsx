import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// A friendly, fully-procedural low-poly child character built from primitives
// so the project has zero dependency on external/copyrighted character models.
// Legs/arms swing via a simple sine-based run cycle; jumping/sliding are driven
// by the parent via the `stateRef` (avoids React re-renders in the hot loop).

export default function Player({ stateRef, primaryColor = '#38e1ff', accent = '#ffd166' }) {
  const group = useRef();
  const legL = useRef();
  const legR = useRef();
  const armL = useRef();
  const armR = useRef();
  const bob = useRef();
  const clock = useRef(0);

  useFrame((_, delta) => {
    const s = stateRef.current;
    if (!group.current) return;

    // Lane + vertical position are computed by the engine loop and written
    // into stateRef every frame; we just read them here for rendering.
    group.current.position.x = s.renderX;
    group.current.position.y = s.renderY;
    group.current.position.z = 0;
    group.current.rotation.z = s.tilt || 0;
    group.current.scale.y = s.isSliding ? 0.55 : 1;
    group.current.scale.x = s.isSliding ? 1.15 : 1;

    if (!s.isSliding) {
      clock.current += delta * (s.running ? 10 : 0);
      const swing = Math.sin(clock.current) * (s.isJumping ? 0.25 : 0.65);
      if (legL.current) legL.current.rotation.x = swing;
      if (legR.current) legR.current.rotation.x = -swing;
      if (armL.current) armL.current.rotation.x = -swing * 0.9;
      if (armR.current) armR.current.rotation.x = swing * 0.9;
      if (bob.current) bob.current.position.y = s.isJumping ? 0 : Math.abs(Math.sin(clock.current)) * 0.08;
    }
  });

  return (
    <group ref={group}>
      <group ref={bob}>
        {/* ======================================================== */}
        {/* 1. Explorer Backpack (Facing camera at +Z on player's back) */}
        {/* ======================================================== */}
        <group position={[0, 1.08, 0.26]}>
          {/* Main rucksack pack */}
          <mesh castShadow>
            <boxGeometry args={[0.52, 0.56, 0.26]} />
            <meshStandardMaterial color="#2d6a4f" roughness={0.7} />
          </mesh>

          {/* Left utility pocket */}
          <mesh position={[-0.28, -0.05, 0]}>
            <boxGeometry args={[0.1, 0.32, 0.18]} />
            <meshStandardMaterial color="#1b4332" roughness={0.8} />
          </mesh>

          {/* Right utility pocket / Canteen */}
          <mesh position={[0.28, -0.05, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.3, 10]} />
            <meshStandardMaterial color="#0891b2" roughness={0.4} metalness={0.5} />
          </mesh>

          {/* Rolled Sleeping Mat / Explorer Bedroll strapped to top */}
          <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.58, 12]} />
            <meshStandardMaterial color="#52b788" roughness={0.8} />
          </mesh>
          {/* Bedroll leather tie straps */}
          <mesh position={[-0.18, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.105, 0.02, 8, 12]} />
            <meshStandardMaterial color="#43281c" roughness={0.9} />
          </mesh>
          <mesh position={[0.18, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.105, 0.02, 8, 12]} />
            <meshStandardMaterial color="#43281c" roughness={0.9} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* 2. Torso - Adventurer Safari Explorer Jacket & Belt */}
        {/* ======================================================== */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <capsuleGeometry args={[0.32, 0.55, 6, 12]} />
          <meshStandardMaterial color="#d4a373" roughness={0.65} />
        </mesh>
        {/* Explorer Leather Utility Belt */}
        <mesh position={[0, 0.84, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.08, 16]} />
          <meshStandardMaterial color="#43281c" roughness={0.8} />
        </mesh>
        {/* Brass Belt Buckle (facing forward towards -Z) */}
        <mesh position={[0, 0.84, -0.34]}>
          <boxGeometry args={[0.12, 0.09, 0.03]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* ======================================================== */}
        {/* 3. Head & Safari Explorer Fedora Hat */}
        {/* ======================================================== */}
        <mesh position={[0, 1.72, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.7} />
        </mesh>

        {/* Hair showing below hat brim at back (+Z) */}
        <mesh position={[0, 1.68, 0.16]}>
          <sphereGeometry args={[0.22, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>

        {/* Face features pointing forward towards -Z (running direction) */}
        <mesh position={[0.1, 1.74, -0.28]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[-0.1, 1.74, -0.28]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>

        {/* --- Iconic Safari Fedora / Explorer Hat --- */}
        <group position={[0, 1.88, -0.02]} rotation={[-0.05, 0, 0]}>
          {/* Hat Wide Brim */}
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.56, 0.56, 0.04, 24]} />
            <meshStandardMaterial color="#c29f68" roughness={0.7} />
          </mesh>

          {/* Hat Crown (creased safari top) */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.31, 0.28, 18]} />
            <meshStandardMaterial color="#c29f68" roughness={0.7} />
          </mesh>

          {/* Dark Leather Hat Band */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.315, 0.315, 0.06, 18]} />
            <meshStandardMaterial color="#3e2723" roughness={0.8} />
          </mesh>

          {/* Gold Explorer Badge on side */}
          <mesh position={[0.32, 0.05, 0]}>
            <boxGeometry args={[0.02, 0.08, 0.06]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* 4. Arms & Explorer Sleeves */}
        {/* ======================================================== */}
        {/* Right Arm */}
        <group position={[0.42, 1.25, 0]} ref={armR}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.085, 0.35, 4, 8]} />
            <meshStandardMaterial color="#d4a373" />
          </mesh>
          {/* Hand / Clenched running fist */}
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial color="#fed7aa" />
          </mesh>
        </group>

        {/* Left Arm */}
        <group position={[-0.42, 1.25, 0]} ref={armL}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.085, 0.35, 4, 8]} />
            <meshStandardMaterial color="#d4a373" />
          </mesh>
          {/* Hand / Clenched running fist */}
          <mesh position={[0, -0.42, 0]}>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial color="#fed7aa" />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* 5. Legs & Sturdy Safari Trekking Boots */}
        {/* ======================================================== */}
        {/* Right Leg */}
        <group position={[0.16, 0.72, 0]} ref={legR}>
          {/* Cargo shorts/trousers */}
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.44, 4, 8]} />
            <meshStandardMaterial color="#583101" />
          </mesh>
          {/* Heavy-duty explorer hiking boot (pointed forward into -Z) */}
          <mesh position={[0, -0.58, -0.06]} castShadow>
            <boxGeometry args={[0.18, 0.16, 0.32]} />
            <meshStandardMaterial color="#3e2723" roughness={0.8} />
          </mesh>
          {/* Sturdy boot sole */}
          <mesh position={[0, -0.66, -0.06]}>
            <boxGeometry args={[0.19, 0.05, 0.33]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
        </group>

        {/* Left Leg */}
        <group position={[-0.16, 0.72, 0]} ref={legL}>
          {/* Cargo shorts/trousers */}
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.44, 4, 8]} />
            <meshStandardMaterial color="#583101" />
          </mesh>
          {/* Heavy-duty explorer hiking boot (pointed forward into -Z) */}
          <mesh position={[0, -0.58, -0.06]} castShadow>
            <boxGeometry args={[0.18, 0.16, 0.32]} />
            <meshStandardMaterial color="#3e2723" roughness={0.8} />
          </mesh>
          {/* Sturdy boot sole */}
          <mesh position={[0, -0.66, -0.06]}>
            <boxGeometry args={[0.19, 0.05, 0.33]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
