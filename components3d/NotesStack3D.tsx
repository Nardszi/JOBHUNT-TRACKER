"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Edges } from "@react-three/drei";
import * as THREE from "three";
import { Note } from "@/lib/types";

interface NotesStack3DProps {
  notes: Note[];
  performanceMode?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Behavioral: "#f59e0b",
  "Web Fundamentals": "#3b82f6",
  React: "#06b6d4",
  "PHP/Laravel": "#a78bfa",
  Troubleshooting: "#ef4444",
  Networking: "#10b981",
};

function NoteCard({
  position,
  color,
  title,
  isUrgent,
  index,
  performanceMode,
}: {
  position: [number, number, number];
  color: string;
  title: string;
  isUrgent: boolean;
  index: number;
  performanceMode: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const phase = index * 1.1;
    groupRef.current.rotation.y = Math.sin(t * 0.2 + phase) * 0.08;
    groupRef.current.rotation.z = Math.cos(t * 0.15 + phase) * 0.04;
    if (matRef.current) {
      const base = isUrgent ? 0.9 : 0.6;
      matRef.current.emissiveIntensity = performanceMode
        ? base
        : base + Math.sin(t * 1.0 + phase) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <boxGeometry args={[0.7, 0.5, 0.01]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0a1420"
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.92}
          roughness={0.3}
          metalness={0.1}
        />
        <Edges threshold={15} color={color} linewidth={1} />
      </mesh>
      <Text
        position={[0, 0.08, 0.01]}
        fontSize={0.05}
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={0.6}
      >
        {title.length > 18 ? title.slice(0, 18) + "…" : title}
      </Text>
      {isUrgent && (
        <Text
          position={[0, -0.12, 0.01]}
          fontSize={0.035}
          color="#ef4444"
          anchorX="center"
        >
          ⚡ urgent
        </Text>
      )}
    </group>
  );
}

export default function NotesStack3D({ notes, performanceMode = false }: NotesStack3DProps) {
  const cards = useMemo(() => {
    const now = Date.now();
    const sorted = [...notes].sort((a, b) => {
      const aUrgent = a.lastPracticedAt
        ? now - new Date(a.lastPracticedAt).getTime() > 7 * 86400000
        : true;
      const bUrgent = b.lastPracticedAt
        ? now - new Date(b.lastPracticedAt).getTime() > 7 * 86400000
        : true;
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return 0;
    });

    const displayNotes = sorted.slice(0, 20);
    return displayNotes.map((note, i) => {
      const angle = (i / displayNotes.length) * Math.PI * 0.6 - Math.PI * 0.3;
      const radius = 0.4 + i * 0.04;
      const isUrgent =
        !note.lastPracticedAt ||
        now - new Date(note.lastPracticedAt).getTime() > 7 * 86400000;

      return {
        position: [
          Math.sin(angle) * radius * 0.5,
          (displayNotes.length / 2 - i) * 0.08,
          Math.cos(angle) * 0.3,
        ] as [number, number, number],
        color: CATEGORY_COLORS[note.category] || "#78716c",
        title: note.title,
        isUrgent,
        index: i,
      };
    });
  }, [notes]);

  return (
    <group position={[0, 0, 0]}>
      {cards.map((card, i) => (
        <NoteCard key={i} {...card} performanceMode={performanceMode} />
      ))}
      {cards.length === 0 && (
        <Text position={[0, 0, 0]} fontSize={0.12} color="#333" anchorX="center">
          No notes yet
        </Text>
      )}
    </group>
  );
}
