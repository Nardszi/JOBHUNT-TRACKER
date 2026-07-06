"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const BG_COLOR = "#05070d";
const GRID_PRIMARY = "#00e5ff";
const GRID_SECONDARY = "#0a2a3a";
const PARTICLE_COLOR = "#66e0ff";

interface SceneEnvironmentProps {
  performanceMode?: boolean;
}

function NeonGrid() {
  const gridRef = useRef<THREE.Group>(null);
  const primaryMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: GRID_PRIMARY, transparent: true, opacity: 0.35 }),
    []
  );
  const secondaryMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: GRID_SECONDARY, transparent: true, opacity: 0.18 }),
    []
  );

  const { primaryGeo, secondaryGeo } = useMemo(() => {
    const size = 40;
    const divisions = 40;
    const step = size / divisions;
    const half = size / 2;

    const pPoints: number[] = [];
    const sPoints: number[] = [];

    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step;
      const isPrimary = i % 5 === 0;
      const arr = isPrimary ? pPoints : sPoints;
      arr.push(-half, 0, pos, half, 0, pos);
      arr.push(pos, 0, -half, pos, 0, half);
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.Float32BufferAttribute(pPoints, 3));
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.Float32BufferAttribute(sPoints, 3));

    return { primaryGeo: pGeo, secondaryGeo: sGeo };
  }, []);

  return (
    <group ref={gridRef} position={[0, -2.5, 0]}>
      <lineSegments geometry={primaryGeo} material={primaryMat} />
      <lineSegments geometry={secondaryGeo} material={secondaryMat} />
    </group>
  );
}

function ParticleField({ performanceMode }: { performanceMode: boolean }) {
  const count = performanceMode ? 120 : 250;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return { positions: pos, sizes: sz };
  }, [count]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    return g;
  }, [positions, sizes]);

  useFrame((state) => {
    if (pointsRef.current && !performanceMode) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.012;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.006) * 0.02;
    }
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        color={PARTICLE_COLOR}
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function SceneEnvironment({ performanceMode = false }: SceneEnvironmentProps) {
  return (
    <>
      <color attach="background" args={[BG_COLOR]} />
      <fogExp2 attach="fog" args={[BG_COLOR, 0.045]} />

      <ambientLight color="#224466" intensity={0.6} />
      <directionalLight position={[5, 8, 5]} color="#66ccff" intensity={0.8} />

      <NeonGrid />
      <ParticleField performanceMode={performanceMode} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={14}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  );
}
