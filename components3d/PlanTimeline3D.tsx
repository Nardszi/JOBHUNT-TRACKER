"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Edges, Text } from "@react-three/drei";
import * as THREE from "three";
import { Application } from "@/lib/types";
import MarkerTooltip, { TooltipData } from "./MarkerTooltip";

const TOTAL_DAYS = 90;
const SPACING = 0.12;
const MILESTONES = [30, 60, 90];

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayToDate(startDate: string, dayNum: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + dayNum - 1);
  return toLocalDateStr(d);
}

function dayZ(dayNum: number): number {
  return (dayNum - 1) * SPACING;
}

interface PlanTimeline3DProps {
  planStartDate: string;
  dayNumber: number;
  completedDays: Set<string>;
  applications?: Application[];
  performanceMode?: boolean;
  onDayClick?: (dayNum: number, position: [number, number, number]) => void;
}

function DayMarker({
  dayNum,
  z,
  status,
  isToday,
  isMilestone,
  performanceMode,
  milestoneSummary,
  onHover,
  onLeave,
  onClick,
}: {
  dayNum: number;
  z: number;
  status: "completed" | "future" | "today";
  isToday: boolean;
  isMilestone: boolean;
  performanceMode: boolean;
  milestoneSummary?: { totalApps: number; interviews: number; offers: number; rejected: number };
  onHover: (data: TooltipData) => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => {
    if (hovered) return "#ffffff";
    if (status === "completed") return "#10b981";
    if (status === "today") return "#ffffff";
    return "#1e3a5f";
  }, [status, hovered]);

  const emissiveColor = useMemo(() => {
    if (hovered) return "#34d399";
    if (status === "completed") return "#059669";
    if (status === "today") return "#ffffff";
    return "#0f2a4a";
  }, [status, hovered]);

  const baseSize = isMilestone ? 0.06 : 0.035;

  useFrame((state) => {
    if (!ref.current || !matRef.current) return;
    const t = state.clock.elapsedTime;

    // Hover scale
    const targetScale = hovered ? 1.6 : isToday && !performanceMode ? 1 + Math.sin(t * 2) * 0.15 : 1;
    ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);

    // Emissive pulse
    if (isToday && !performanceMode) {
      matRef.current.emissiveIntensity = 0.7 + Math.sin(t * 2) * 0.3;
    } else if (hovered) {
      matRef.current.emissiveIntensity = 0.9;
    } else {
      matRef.current.emissiveIntensity = status === "completed" ? 0.5 : 0.15;
    }
  });

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    document.body.style.cursor = "pointer";
    const date = dayToDate("", dayNum);
    onHover({
      position: [0, 0.04, z],
      dayNumber: dayNum,
      date,
      label: isToday ? "Today" : status === "completed" ? "Completed" : "Upcoming",
      isMilestone,
      milestoneSummary,
    });
  }, [dayNum, z, isToday, status, isMilestone, milestoneSummary, onHover]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = "auto";
    onLeave();
  }, [onLeave]);

  return (
    <group position={[0, 0, z]}>
      <mesh
        ref={ref}
        onPointerOver={(e) => { e.stopPropagation(); handlePointerOver(); }}
        onPointerOut={handlePointerOut}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <sphereGeometry args={[baseSize, performanceMode ? 8 : 16, performanceMode ? 8 : 16]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0a1420"
          emissive={emissiveColor}
          emissiveIntensity={status === "today" ? 0.7 : status === "completed" ? 0.5 : 0.15}
          transparent
          opacity={0.95}
          roughness={0.3}
          metalness={0.1}
        />
        <Edges threshold={15} color={color} linewidth={1} />
      </mesh>

      {/* Glow ring on hover */}
      {hovered && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.8, baseSize * 2.2, 32]} />
          <meshBasicMaterial color={emissiveColor} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}

      {isMilestone && (
        <>
          <TorusArch dayNum={dayNum} z={z} performanceMode={performanceMode} />
          <Text
            position={[0.12, 0.08, z]}
            fontSize={0.025}
            color="#f59e0b"
            anchorX="left"
            anchorY="middle"
          >
            {`Day ${dayNum}`}
          </Text>
        </>
      )}

      {dayNum % 10 === 0 && !isMilestone && (
        <Text
          position={[0.06, -0.02, z]}
          fontSize={0.018}
          color="#445"
          anchorX="left"
          anchorY="middle"
        >
          {`${dayNum}`}
        </Text>
      )}
    </group>
  );
}

function TorusArch({
  dayNum,
  z,
  performanceMode,
}: {
  dayNum: number;
  z: number;
  performanceMode: boolean;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!matRef.current) return;
    if (!performanceMode) {
      matRef.current.emissiveIntensity =
        0.6 + Math.sin(state.clock.elapsedTime * 1.5 + dayNum * 0.1) * 0.2;
    }
  });

  return (
    <group position={[0, 0, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.008, 8, performanceMode ? 16 : 32]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0a1420"
          emissive="#f59e0b"
          emissiveIntensity={0.6}
          transparent
          opacity={0.9}
          roughness={0.3}
          metalness={0.1}
        />
        <Edges threshold={15} color="#f59e0b" linewidth={1} />
      </mesh>
    </group>
  );
}

export default function PlanTimeline3D({
  planStartDate,
  dayNumber,
  completedDays,
  applications = [],
  performanceMode = false,
  onDayClick,
}: PlanTimeline3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<TooltipData | null>(null);
  const { camera } = useThree();

  // Position camera looking forward from today
  useMemo(() => {
    const todayZ = dayZ(Math.min(dayNumber, TOTAL_DAYS));
    camera.position.set(0.5, 0.25, todayZ - 0.3);
    camera.lookAt(0, 0, Math.min(todayZ + 0.5, dayZ(TOTAL_DAYS)));
  }, [camera, dayNumber]);

  // Path line
  const pathLine = useMemo(() => {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, dayZ(TOTAL_DAYS))];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: "#0f2a4a", transparent: true, opacity: 0.4 });
    return new THREE.Line(geo, mat);
  }, []);

  const milestoneSummaries = useMemo(() => {
    const summaries: Record<number, { totalApps: number; interviews: number; offers: number; rejected: number }> = {};
    for (const m of MILESTONES) {
      const cutoffDate = dayToDate(planStartDate, m);
      const appsBefore = applications.filter((a) => a.dateApplied <= cutoffDate);
      summaries[m] = {
        totalApps: appsBefore.length,
        interviews: appsBefore.filter((a) => a.status === "Interview Scheduled" || a.status === "Case Study").length,
        offers: appsBefore.filter((a) => a.status === "Offer").length,
        rejected: appsBefore.filter((a) => a.status === "Rejected").length,
      };
    }
    return summaries;
  }, [applications, planStartDate]);

  // Day markers
  const markers = useMemo(() => {
    const result: {
      dayNum: number;
      z: number;
      status: "completed" | "future" | "today";
      isToday: boolean;
      isMilestone: boolean;
    }[] = [];

    for (let d = 1; d <= TOTAL_DAYS; d++) {
      const dateStr = dayToDate(planStartDate, d);
      const todayStr = toLocalDateStr(new Date());
      const isToday = dateStr === todayStr;
      const isCompleted = completedDays.has(dateStr);
      const isFuture = d > dayNumber;

      result.push({
        dayNum: d,
        z: dayZ(d),
        status: isToday ? "today" : isCompleted ? "completed" : isFuture ? "future" : "completed",
        isToday,
        isMilestone: MILESTONES.includes(d),
      });
    }
    return result;
  }, [planStartDate, dayNumber, completedDays]);

  const handleHover = useCallback((data: TooltipData) => {
    setHoveredTooltip(data);
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredTooltip(null);
  }, []);

  const handleDayClick = useCallback(
    (dayNum: number) => {
      const z = dayZ(dayNum);
      onDayClick?.(dayNum, [0, 0.15, z + 0.15]);
    },
    [onDayClick]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.005;
  });

  return (
    <group ref={groupRef}>
      {/* Path line */}
      <primitive object={pathLine} />

      {/* Day markers */}
      {markers.map((m) => (
        <DayMarker
          key={m.dayNum}
          dayNum={m.dayNum}
          z={m.z}
          status={m.status}
          isToday={m.isToday}
          isMilestone={m.isMilestone}
          performanceMode={performanceMode}
          milestoneSummary={m.isMilestone ? milestoneSummaries[m.dayNum] : undefined}
          onHover={handleHover}
          onLeave={handleLeave}
          onClick={() => handleDayClick(m.dayNum)}
        />
      ))}

      {/* Tooltip */}
      {hoveredTooltip && (
        <MarkerTooltip data={hoveredTooltip} onClose={handleLeave} />
      )}

      {/* End cap */}
      <Text
        position={[0, -0.04, dayZ(TOTAL_DAYS) + 0.04]}
        fontSize={0.02}
        color="#445"
        anchorX="center"
      >
        Day 90
      </Text>
    </group>
  );
}
