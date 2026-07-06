"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Edges, Html } from "@react-three/drei";
import * as THREE from "three";
import { DailyCheckin } from "@/lib/types";

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getColor(count: number): string {
  if (count === 0) return "#0f1a2a";
  if (count === 1) return "#065f46";
  if (count <= 3) return "#059669";
  return "#34d399";
}

interface BarProps {
  position: [number, number, number];
  targetHeight: number;
  color: string;
  date: string;
  count: number;
  categories: string[];
  barIndex: number;
  performanceMode: boolean;
}

function Bar({ position, targetHeight, color, date, count, categories, barIndex, performanceMode }: BarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const revealProgress = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Wave reveal: staggered per bar
    if (revealProgress.current < 1) {
      const delay = barIndex * 0.008;
      const t = Math.max(0, state.clock.elapsedTime - delay);
      revealProgress.current = Math.min(t / 0.4, 1);
      const eased = 1 - Math.pow(1 - revealProgress.current, 3);
      meshRef.current.scale.y = eased;
    }

    const hoverScale = hovered ? 1.12 : 1;
    if (revealProgress.current >= 1) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, hoverScale, 0.1);
    }

    if (matRef.current) {
      const base = count > 0 ? 0.6 : 0.15;
      matRef.current.emissiveIntensity = performanceMode
        ? base
        : base + Math.sin(state.clock.elapsedTime * 0.8 + barIndex * 0.5) * 0.15;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        scale={[1, 0, 1]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[0.08, targetHeight, 0.08]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0a1420"
          emissive={hovered ? "#34d399" : color}
          emissiveIntensity={count > 0 ? 0.6 : 0.15}
          transparent
          opacity={0.92}
          roughness={0.3}
          metalness={0.1}
        />
        <Edges threshold={15} color={color} linewidth={1} />
      </mesh>
      {hovered && (
        <Html position={[0, targetHeight / 2 + 0.18, 0]} center distanceFactor={6}>
          <div className="bg-[#0a0f1a]/95 border border-white/10 rounded-lg px-3 py-2 text-center whitespace-nowrap pointer-events-none">
            <div className="text-white text-xs font-medium">{date}</div>
            <div className="text-neutral-400 text-[10px]">
              {count} activit{count === 1 ? "y" : "ies"}
              {categories.length > 0 && ` · ${categories.join(", ")}`}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

interface StreakBars3DProps {
  checkins: DailyCheckin[];
  performanceMode?: boolean;
}

export default function StreakBars3D({ checkins, performanceMode = false }: StreakBars3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const bars = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (20 * 7) - ((today.getDay() + 6) % 7));

    const checkinMap: Record<string, DailyCheckin> = {};
    checkins.forEach((c) => { checkinMap[c.date] = c; });

    const result: {
      position: [number, number, number];
      targetHeight: number;
      color: string;
      date: string;
      count: number;
      categories: string[];
      barIndex: number;
    }[] = [];

    let idx = 0;
    const currentDate = new Date(startDate);

    for (let w = 0; w < 20; w++) {
      for (let d = 0; d < 7; d++) {
        const dateStr = toLocalDateStr(currentDate);
        if (dateStr <= toLocalDateStr(today)) {
          const checkin = checkinMap[dateStr];
          const count = checkin?.activityCount || 0;
          const height = count === 0 ? 0.02 : 0.05 + (count / 6) * 0.5;
          const cats = checkin
            ? Object.entries(checkin.categoriesCompleted)
                .filter(([, v]) => v)
                .map(([k]) => k === "applied" ? "Applied" : k === "exercised" ? "Exercised" : k === "followedUp" ? "Follow-up" : "Notes")
            : [];

          result.push({
            position: [(w - 10) * 0.12, height / 2, (d - 3) * 0.12],
            targetHeight: height,
            color: getColor(count),
            date: dateStr,
            count,
            categories: cats,
            barIndex: idx,
          });
          idx++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return result;
  }, [checkins]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.015;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Text position={[0, 0.55, 0]} fontSize={0.08} color="#334" anchorX="center">
        Activity Heatmap (20 weeks)
      </Text>
      {bars.map((bar, i) => (
        <Bar key={i} {...bar} performanceMode={performanceMode} />
      ))}
    </group>
  );
}
