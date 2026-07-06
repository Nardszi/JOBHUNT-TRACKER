"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { DailyCheckin } from "@/lib/types";

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getColor(count: number): string {
  if (count === 0) return "#1a1a2e";
  if (count === 1) return "#065f46";
  if (count <= 3) return "#059669";
  return "#34d399";
}

function getEmissive(count: number): string {
  if (count === 0) return "#000000";
  if (count === 1) return "#022c22";
  if (count <= 3) return "#064e3b";
  return "#059669";
}

interface BarProps {
  position: [number, number, number];
  height: number;
  color: string;
  emissive: string;
  date: string;
  count: number;
  categories: string[];
}

function Bar({ position, height, color, emissive, date, count, categories }: BarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? 1.15 : 1;
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, target, 0.1);
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
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
        <boxGeometry args={[0.08, height, 0.08]} />
        <meshStandardMaterial
          color={hovered ? "#ffffff" : color}
          emissive={hovered ? "#34d399" : emissive}
          emissiveIntensity={hovered ? 0.4 : 0.1}
          transparent
          opacity={0.9}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {hovered && (
        <group position={[0, height / 2 + 0.15, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.2, 0.35]} />
            <meshBasicMaterial color="#0f0f1a" transparent opacity={0.9} />
          </mesh>
          <Text position={[0, 0.04, 0]} fontSize={0.06} color="white" anchorX="center">
            {date}
          </Text>
          <Text position={[0, -0.06, 0]} fontSize={0.05} color="#a0a0b0" anchorX="center">
            {count} activit{count === 1 ? "y" : "ies"}{categories.length > 0 ? ` · ${categories.join(", ")}` : ""}
          </Text>
        </group>
      )}
    </group>
  );
}

export default function StreakBars3D({ checkins }: { checkins: DailyCheckin[] }) {
  const groupRef = useRef<THREE.Group>(null);

  const { bars, maxCount } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (20 * 7) - ((today.getDay() + 6) % 7));

    const checkinMap: Record<string, DailyCheckin> = {};
    checkins.forEach((c) => { checkinMap[c.date] = c; });

    const bars: { position: [number, number, number]; height: number; color: string; emissive: string; date: string; count: number; categories: string[] }[] = [];
    let maxCount = 0;
    const currentDate = new Date(startDate);

    for (let w = 0; w < 20; w++) {
      for (let d = 0; d < 7; d++) {
        const dateStr = toLocalDateStr(currentDate);
        if (dateStr <= toLocalDateStr(today)) {
          const checkin = checkinMap[dateStr];
          const count = checkin?.activityCount || 0;
          maxCount = Math.max(maxCount, count);
          const height = count === 0 ? 0.02 : 0.05 + (count / 6) * 0.5;
          const cats = checkin
            ? Object.entries(checkin.categoriesCompleted)
                .filter(([, v]) => v)
                .map(([k]) => k === "applied" ? "Applied" : k === "exercised" ? "Exercised" : k === "followedUp" ? "Follow-up" : "Notes")
            : [];

          bars.push({
            position: [(w - 10) * 0.12, height / 2, (d - 3) * 0.12],
            height,
            color: getColor(count),
            emissive: getEmissive(count),
            date: dateStr,
            count,
            categories: cats,
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return { bars, maxCount };
  }, [checkins]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Text position={[0, 0.55, 0]} fontSize={0.08} color="#666" anchorX="center">
        Activity Heatmap (20 weeks)
      </Text>
      {bars.map((bar, i) => (
        <Bar key={i} {...bar} />
      ))}
    </group>
  );
}
