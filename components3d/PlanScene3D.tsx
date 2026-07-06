"use client";

import { Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import SceneEnvironment from "./SceneEnvironment";
import PlanTimeline3D from "./PlanTimeline3D";
import TimelineEvents3D from "./TimelineEvents3D";
import { Application } from "@/lib/types";
import { useRouter } from "next/navigation";

interface PlanScene3DProps {
  planStartDate: string;
  dayNumber: number;
  completedDays: Set<string>;
  applications: Application[];
}

export default function PlanScene3D({
  planStartDate,
  dayNumber,
  completedDays,
  applications,
}: PlanScene3DProps) {
  const router = useRouter();

  const handleApplicationClick = useCallback(
    (appId: string) => {
      router.push(`/applications?highlight=${appId}`);
    },
    [router]
  );

  return (
    <Canvas
      camera={{ position: [0, 0.25, 0], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2)]}
    >
      <SceneEnvironment />
      <Suspense fallback={null}>
        <PlanTimeline3D
          planStartDate={planStartDate}
          dayNumber={dayNumber}
          completedDays={completedDays}
          applications={applications}
        />
        <TimelineEvents3D
          applications={applications}
          planStartDate={planStartDate}
          onApplicationClick={handleApplicationClick}
        />
      </Suspense>
    </Canvas>
  );
}
