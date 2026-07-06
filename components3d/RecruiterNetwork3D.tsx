"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Edges } from "@react-three/drei";
import * as THREE from "three";
import { Application } from "@/lib/types";

interface RecruiterNetwork3DProps {
  applications: Application[];
  performanceMode?: boolean;
}

const SOURCE_COLORS: Record<string, string> = {
  LinkedIn: "#3b82f6",
  JobStreet: "#10b981",
  Referral: "#f59e0b",
  "Company Site": "#a78bfa",
  Indeed: "#3b82f6",
  "Facebook Group": "#ec4899",
  Other: "#78716c",
};

function NetworkNode({
  position,
  color,
  size,
  label,
  pulseSpeed,
  performanceMode,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  label: string;
  pulseSpeed: number;
  performanceMode: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.06;
    if (matRef.current) {
      matRef.current.emissiveIntensity = performanceMode
        ? 0.75
        : 0.6 + Math.sin(t * pulseSpeed) * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[size, 1]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0a1420"
          emissive={color}
          emissiveIntensity={0.7}
          transparent
          opacity={0.9}
          roughness={0.3}
          metalness={0.15}
        />
        <Edges threshold={15} color={color} linewidth={1} />
      </mesh>
      <Text
        position={[0, size + 0.15, 0]}
        fontSize={0.06}
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={1}
      >
        {label}
      </Text>
    </group>
  );
}

export default function RecruiterNetwork3D({ applications, performanceMode = false }: RecruiterNetwork3DProps) {
  const lineGroupRef = useRef<THREE.Group>(null);

  const sourceGroups = useMemo(() => {
    const groups: Record<string, Application[]> = {};
    for (const app of applications) {
      const src = app.source || "Other";
      if (!groups[src]) groups[src] = [];
      groups[src].push(app);
    }
    return groups;
  }, [applications]);

  const nodes = useMemo(() => {
    const entries = Object.entries(sourceGroups).sort((a, b) => b[1].length - a[1].length);
    const result: {
      position: [number, number, number];
      color: string;
      size: number;
      label: string;
      pulseSpeed: number;
    }[] = [];

    const totalSources = entries.length;
    entries.forEach(([source, apps], i) => {
      const angle = (i / totalSources) * Math.PI * 2;
      const radius = 1.8 + Math.min(apps.length * 0.15, 0.8);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const size = 0.08 + Math.min(apps.length * 0.03, 0.18);
      const newest = apps.reduce((a, b) =>
        new Date(a.dateApplied) > new Date(b.dateApplied) ? a : b
      );
      const daysSince = (Date.now() - new Date(newest.dateApplied).getTime()) / 86400000;
      const pulseSpeed = daysSince < 3 ? 2.5 : daysSince < 7 ? 1.5 : 0.8;

      result.push({
        position: [x, 0, z],
        color: SOURCE_COLORS[source] || "#78716c",
        size,
        label: `${source} (${apps.length})`,
        pulseSpeed,
      });
    });
    return result;
  }, [sourceGroups]);

  const lines = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const color = new THREE.Color();

    for (const node of nodes) {
      const srcColor = node.color;
      color.set(srcColor);
      positions.push(0, 0.3, 0);
      colors.push(color.r, color.g, color.b);
      positions.push(node.position[0], node.position[1] + 0.3, node.position[2]);
      colors.push(color.r * 0.6, color.g * 0.6, color.b * 0.6);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [nodes]);

  useFrame((state) => {
    if (lineGroupRef.current) {
      lineGroupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.02;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central "You" node */}
      <NetworkNode
        position={[0, 0.3, 0]}
        color="#00e5ff"
        size={0.15}
        label="You"
        pulseSpeed={1.2}
        performanceMode={performanceMode}
      />

      {/* Connecting lines */}
      <group ref={lineGroupRef}>
        <lineSegments geometry={lines}>
          <lineBasicMaterial vertexColors transparent opacity={0.45} />
        </lineSegments>
      </group>

      {/* Source nodes */}
      {nodes.map((node, i) => (
        <NetworkNode key={i} {...node} performanceMode={performanceMode} />
      ))}

      {nodes.length === 0 && (
        <Text position={[0, 0, 0]} fontSize={0.12} color="#333" anchorX="center">
          No application sources yet
        </Text>
      )}
    </group>
  );
}
