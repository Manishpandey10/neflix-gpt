import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { inSphere } from "maath/random";
import * as THREE from "three";

/* ─── Interactive Particle Layer ─── */
const StarParticles = ({ color, size, radius, speed, count, interactive }) => {
  const ref = useRef();
  const mouse = useRef(new THREE.Vector2(0, 0));
  const { viewport } = useThree();

  const sphere = useMemo(() => {
    return inSphere(new Float32Array(count * 3), { radius });
  }, [count, radius]);

  const handlePointerMove = useCallback(
    (e) => {
      if (!interactive) return;
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    [interactive]
  );

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Base rotation
    ref.current.rotation.x -= delta / (10 / speed);
    ref.current.rotation.y -= delta / (15 / speed);

    // Mouse-reactive tilt for interactivity
    if (interactive) {
      const targetRotX = mouse.current.y * 0.08;
      const targetRotZ = mouse.current.x * 0.05;
      ref.current.rotation.x += (targetRotX - ref.current.rotation.x) * 0.02;
      ref.current.rotation.z += (targetRotZ - ref.current.rotation.z) * 0.02;
    }

    // Gentle breathing scale effect
    const breath = Math.sin(state.clock.elapsedTime * 0.3) * 0.02 + 1;
    ref.current.scale.setScalar(breath);
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]} onPointerMove={handlePointerMove}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={color}
          size={size}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
};

/* ─── Floating Ring Effect ─── */
const FloatingRing = ({ radius, color, rotationSpeed }) => {
  const ref = useRef();

  const points = useMemo(() => {
    const pts = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        )
      );
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * rotationSpeed * 0.3;
      ref.current.rotation.y += delta * rotationSpeed * 0.5;
      ref.current.rotation.z += delta * rotationSpeed * 0.1;
    }
  });

  return (
    <line ref={ref} geometry={points}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
};

/* ─── Main Background Component ─── */
const ThreeBackground = () => {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false }}
        style={{ pointerEvents: "auto" }}
      >
        {/* Ambient atmosphere */}
        <fog attach="fog" args={["#000000", 1.5, 4]} />

        {/* Distant white star field — very subtle, slow rotation */}
        <StarParticles
          color="#ffffff"
          size={0.0015}
          radius={3}
          speed={0.05}
          count={3000}
          interactive={false}
        />

        {/* Mid-depth warm red nebula — follows your mouse */}
        <StarParticles
          color="#ff4b55"
          size={0.004}
          radius={1.8}
          speed={0.4}
          count={1800}
          interactive={true}
        />

        {/* Close Netflix-red embers — prominent, reactive */}
        <StarParticles
          color="#e50914"
          size={0.006}
          radius={1.2}
          speed={1}
          count={1200}
          interactive={true}
        />

        {/* Subtle accent gold dust */}
        <StarParticles
          color="#ffd700"
          size={0.002}
          radius={2}
          speed={0.2}
          count={400}
          interactive={false}
        />

        {/* Floating orbital rings */}
        <FloatingRing radius={1.0} color="#e50914" rotationSpeed={0.15} />
        <FloatingRing radius={1.4} color="#ff4b55" rotationSpeed={-0.1} />
        <FloatingRing radius={0.6} color="#ffd700" rotationSpeed={0.2} />
      </Canvas>

      {/* Multi-layer vignette for depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black/60" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
};

export default ThreeBackground;
