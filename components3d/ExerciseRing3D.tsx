"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Text } from "@react-three/drei";
import * as THREE from "three";
import { Workout } from "@/lib/types";

interface ExerciseRing3DProps {
  workouts: Workout[];
  performanceMode?: boolean;
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function OrbitingSphere({
  angle,
  radius,
  speed,
  color,
  size,
  phase,
  performanceMode,
}: {
  angle: number;
  radius: number;
  speed: number;
  color: string;
  size: number;
  phase: number;
  performanceMode: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const a = angle + t * speed;
    ref.current.position.x = Math.cos(a) * radius;
    ref.current.position.z = Math.sin(a) * radius;
    ref.current.position.y = Math.sin(t * 0.6 + phase) * 0.05;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, performanceMode ? 8 : 16, performanceMode ? 8 : 16]} />
      <meshStandardMaterial
        color="#0a1420"
        emissive={color}
        emissiveIntensity={0.85}
        transparent
        opacity={0.9}
        roughness={0.3}
        metalness={0.1}
      />
      <Edges threshold={15} color={color} linewidth={1} />
    </mesh>
  );
}

export default function ExerciseRing3D({ workouts, performanceMode = false }: ExerciseRing3DProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const arcRef = useRef<THREE.Mesh>(null);

  const { completionPct, todayLogged, thisWeekWorkouts } = useMemo(() => {
    const today = new Date();
    const todayStr = toLocalDateStr(today);
    const todayLogged = workouts.some((w) => w.date === todayStr);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekStr = toLocalDateStr(startOfWeek);
    const thisWeekWorkouts = workouts.filter((w) => w.date >= weekStr);

    const goal = 4;
    const completionPct = Math.min(thisWeekWorkouts.length / goal, 1);
    return { completionPct, todayLogged, thisWeekWorkouts };
  }, [workouts]);

  const arcAngle = completionPct * Math.PI * 2;

  const orbitSpheres = useMemo(() => {
    return thisWeekWorkouts.map((w, i) => ({
      angle: (i / Math.max(thisWeekWorkouts.length, 1)) * Math.PI * 2,
      radius: 1.6,
      speed: 0.3 + (i % 3) * 0.1,
      color: "#34d399",
      size: 0.07,
      phase: i * 0.8,
    }));
  }, [thisWeekWorkouts]);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
    }
    if (ringMatRef.current) {
      const t = state.clock.elapsedTime;
      ringMatRef.current.emissiveIntensity = todayLogged
        ? 0.8 + Math.sin(t * 1.5) * 0.15
        : 0.5 + Math.sin(t * 0.8) * 0.1;
    }
  });

  const arcLine = useMemo(() => {
    if (arcAngle <= 0.01) return null;
    const curve = new THREE.EllipseCurve(0, 0, 1.2, 1.2, 0, arcAngle, false, 0);
    const pts = curve.getPoints(performanceMode ? 32 : 64);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: "#34d399", transparent: true, opacity: 0.9 });
    return new THREE.Line(geo, mat);
  }, [arcAngle, performanceMode]);

  const fullRingLine = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, 1.2, 1.2, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(performanceMode ? 32 : 64);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: "#0f1f2a", transparent: true, opacity: 0.3 });
    return new THREE.Line(geo, mat);
  }, [performanceMode]);

  return (
    <group position={[0, 0, 0]}>
      {/* Full ring - dim */}
      <primitive object={fullRingLine} />

      {/* Active arc */}
      {arcLine && <primitive object={arcLine} />}

      {/* Ring body for glow */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.04, 8, performanceMode ? 32 : 64]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color="#0a1420"
          emissive={todayLogged ? "#34d399" : "#065f46"}
          emissiveIntensity={todayLogged ? 0.85 : 0.5}
          transparent
          opacity={0.8}
          roughness={0.3}
          metalness={0.1}
        />
        <Edges threshold={15} color={todayLogged ? "#34d399" : "#065f46"} linewidth={1} />
      </mesh>

      {/* Orbiting workout spheres */}
      {orbitSpheres.map((s, i) => (
        <OrbitingSphere key={i} {...s} performanceMode={performanceMode} />
      ))}

      {/* Center text */}
      <Text position={[0, 0.15, 0]} fontSize={0.22} color="#34d399" anchorX="center">
        {`${Math.round(completionPct * 100)}%`}
      </Text>
      <Text position={[0, -0.1, 0]} fontSize={0.07} color="#666" anchorX="center">
        weekly goal
      </Text>
    </group>
  );
}
