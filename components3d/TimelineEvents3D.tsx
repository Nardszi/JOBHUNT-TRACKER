"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Html } from "@react-three/drei";
import * as THREE from "three";
import { Application, AppStatus } from "@/lib/types";
import MarkerTooltip, { TooltipData } from "./MarkerTooltip";

const SPACING = 0.08;

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayZ(dateStr: string, planStartDate: string): number {
  const start = new Date(planStartDate);
  const date = new Date(dateStr);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return diffDays * SPACING;
}

function dayNum(dateStr: string, planStartDate: string): number {
  const start = new Date(planStartDate);
  const date = new Date(dateStr);
  return Math.floor((date.getTime() - start.getTime()) / 86400000) + 1;
}

const STATUS_COLORS: Record<string, string> = {
  Applied: "#3b82f6",
  "Interview Scheduled": "#f59e0b",
  "Case Study": "#a78bfa",
  Offer: "#10b981",
  Rejected: "#ef4444",
  Ghosted: "#78716c",
};

const STATUS_LABELS: Record<string, string> = {
  Applied: "Applied",
  "Interview Scheduled": "Interview",
  "Case Study": "Case Study",
  Offer: "Offer",
  Rejected: "Rejected",
  Ghosted: "Ghosted",
};

interface EventMarkerProps {
  app: Application;
  position: [number, number, number];
  color: string;
  jitterIndex: number;
  performanceMode: boolean;
  onHover: (data: TooltipData) => void;
  onLeave: () => void;
  onClick: (appId: string) => void;
}

function EventMarker({
  app,
  position,
  color,
  jitterIndex,
  performanceMode,
  onHover,
  onLeave,
  onClick,
}: EventMarkerProps) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 0.6 + jitterIndex * 1.3) * 0.015;
    if (matRef.current && !performanceMode) {
      matRef.current.emissiveIntensity = 0.6 + Math.sin(t * 1.2 + jitterIndex) * 0.2;
    }
  });

  const handlePointerOver = useCallback(() => {
    onHover({
      position,
      dayNumber: dayNum(app.dateApplied, ""),
      date: app.dateApplied,
      label: `${STATUS_LABELS[app.status] || app.status} to`,
      company: app.company,
      status: app.status,
    });
  }, [app, position, onHover]);

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={(e) => { e.stopPropagation(); handlePointerOver(); }}
        onPointerOut={onLeave}
        onClick={(e) => { e.stopPropagation(); onClick(app.id); }}
      >
        <octahedronGeometry args={[0.012, 0]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0a1420"
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.95}
          roughness={0.3}
          metalness={0.1}
        />
        <Edges threshold={15} color={color} linewidth={1} />
      </mesh>
    </group>
  );
}

interface TimelineEvents3DProps {
  applications: Application[];
  planStartDate: string;
  performanceMode?: boolean;
  onApplicationClick?: (appId: string) => void;
}

export default function TimelineEvents3D({
  applications,
  planStartDate,
  performanceMode = false,
  onApplicationClick,
}: TimelineEvents3DProps) {
  const [hoveredTooltip, setHoveredTooltip] = useState<TooltipData | null>(null);

  const eventMarkers = useMemo(() => {
    const dayBuckets: Record<number, Application[]> = {};

    for (const app of applications) {
      const z = dayZ(app.dateApplied, planStartDate);
      const dn = dayNum(app.dateApplied, planStartDate);
      if (dn < 1 || dn > 90) continue;
      if (!dayBuckets[dn]) dayBuckets[dn] = [];
      dayBuckets[dn].push(app);
    }

    const markers: {
      app: Application;
      position: [number, number, number];
      color: string;
      jitterIndex: number;
    }[] = [];

    for (const [dayStr, apps] of Object.entries(dayBuckets)) {
      const dn = parseInt(dayStr);
      const z = (dn - 1) * SPACING;
      apps.forEach((app, i) => {
        const angle = (i / apps.length) * Math.PI * 2;
        const radius = apps.length > 1 ? 0.02 + i * 0.005 : 0;
        const x = Math.cos(angle) * radius;
        const yOffset = Math.sin(angle) * radius * 0.5;

        markers.push({
          app,
          position: [x, 0.04 + yOffset, z],
          color: STATUS_COLORS[app.status] || "#78716c",
          jitterIndex: markers.length,
        });
      });
    }

    return markers;
  }, [applications, planStartDate]);

  const handleHover = useCallback((data: TooltipData) => {
    setHoveredTooltip(data);
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredTooltip(null);
  }, []);

  const handleClick = useCallback(
    (appId: string) => {
      onApplicationClick?.(appId);
    },
    [onApplicationClick]
  );

  return (
    <group>
      {eventMarkers.map((marker, i) => (
        <EventMarker
          key={`${marker.app.id}-${i}`}
          app={marker.app}
          position={marker.position}
          color={marker.color}
          jitterIndex={marker.jitterIndex}
          performanceMode={performanceMode}
          onHover={handleHover}
          onLeave={handleLeave}
          onClick={handleClick}
        />
      ))}

      {hoveredTooltip && (
        <MarkerTooltip data={hoveredTooltip} onClose={handleLeave} />
      )}
    </group>
  );
}
