"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Text } from "@react-three/drei";
import * as THREE from "three";
import { Application, AppStatus } from "@/lib/types";

interface PipelineCards3DProps {
  applications: Application[];
  performanceMode?: boolean;
}

const STAGE_ORDER: AppStatus[] = ["Applied", "Interview Scheduled", "Case Study", "Offer", "Rejected", "Ghosted"];

const STAGE_COLORS: Record<AppStatus, string> = {
  Applied: "#3b82f6",
  "Interview Scheduled": "#f59e0b",
  "Case Study": "#a78bfa",
  Offer: "#10b981",
  Rejected: "#ef4444",
  Ghosted: "#78716c",
};

function PipelineCard({
  position,
  color,
  label,
  index,
  performanceMode,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  index: number;
  performanceMode: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const phase = index * 1.7;
    groupRef.current.position.z = position[2] + Math.sin(t * 0.4 + phase) * 0.08;
    groupRef.current.rotation.y = Math.sin(t * 0.25 + phase) * 0.06;
    groupRef.current.rotation.x = Math.cos(t * 0.3 + phase) * 0.03;
    if (matRef.current) {
      const pulse = 0.7 + Math.sin(t * 1.2 + phase) * 0.15;
      matRef.current.emissiveIntensity = performanceMode ? 0.75 : pulse;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <boxGeometry args={[0.55, 0.35, 0.04]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0a1420"
          emissive={color}
          emissiveIntensity={0.7}
          transparent
          opacity={0.92}
          roughness={0.3}
          metalness={0.15}
        />
        <Edges threshold={15} color={color} linewidth={1} />
      </mesh>
      <Text
        position={[0, 0, 0.03]}
        fontSize={0.055}
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={0.48}
      >
        {label}
      </Text>
    </group>
  );
}

export default function PipelineCards3D({ applications, performanceMode = false }: PipelineCards3DProps) {
  const stageGroups = useMemo(() => {
    const groups: Record<string, Application[]> = {};
    for (const stage of STAGE_ORDER) groups[stage] = [];
    for (const app of applications) {
      if (groups[app.status]) groups[app.status].push(app);
    }
    return groups;
  }, [applications]);

  const cards = useMemo(() => {
    const result: {
      position: [number, number, number];
      color: string;
      label: string;
      index: number;
    }[] = [];

    let xIdx = 0;
    for (const stage of STAGE_ORDER) {
      const apps = stageGroups[stage];
      if (apps.length === 0) continue;
      const color = STAGE_COLORS[stage];
      for (let i = 0; i < apps.length; i++) {
        result.push({
          position: [xIdx * 0.9, i * 0.45 - (apps.length - 1) * 0.22, 0],
          color,
          label: apps[i].company.length > 12 ? apps[i].company.slice(0, 12) + "…" : apps[i].company,
          index: result.length,
        });
      }
      xIdx++;
    }
    return result;
  }, [stageGroups]);

  const stageLabels = useMemo(() => {
    const result: { position: [number, number, number]; label: string; color: string }[] = [];
    let xIdx = 0;
    for (const stage of STAGE_ORDER) {
      if (stageGroups[stage].length === 0) continue;
      result.push({
        position: [xIdx * 0.9, -1.0, 0],
        label: `${stage} (${stageGroups[stage].length})`,
        color: STAGE_COLORS[stage],
      });
      xIdx++;
    }
    return result;
  }, [stageGroups]);

  return (
    <group position={[0, 0, 0]}>
      {cards.map((card, i) => (
        <PipelineCard
          key={i}
          position={card.position}
          color={card.color}
          label={card.label}
          index={card.index}
          performanceMode={performanceMode}
        />
      ))}
      {stageLabels.map((sl, i) => (
        <Text
          key={`label-${i}`}
          position={sl.position}
          fontSize={0.07}
          color={sl.color}
          anchorX="center"
          anchorY="middle"
        >
          {sl.label}
        </Text>
      ))}
      {cards.length === 0 && (
        <Text position={[0, 0, 0]} fontSize={0.12} color="#333" anchorX="center">
          No applications yet
        </Text>
      )}
    </group>
  );
}
