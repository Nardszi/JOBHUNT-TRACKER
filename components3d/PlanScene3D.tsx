"use client";

import { Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import SceneEnvironment from "./SceneEnvironment";
import PlanTimeline3D from "./PlanTimeline3D";
import TimelineEvents3D from "./TimelineEvents3D";
import CameraRig from "./CameraRig";
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
  const [flyTarget, setFlyTarget] = useState<{
    position: [number, number, number];
    lookAt: [number, number, number];
  } | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const [zoomedDay, setZoomedDay] = useState<number | null>(null);

  const handleApplicationClick = useCallback(
    (appId: string) => {
      router.push(`/applications?highlight=${appId}`);
    },
    [router]
  );

  const handleDayClick = useCallback(
    (dayNum: number, position: [number, number, number]) => {
      setFlyTarget({
        position,
        lookAt: [position[0], position[1] - 0.1, position[2] - 0.15],
      });
      setIsFlying(true);
      setZoomedDay(dayNum);
    },
    []
  );

  const handleFlyComplete = useCallback(() => {
    setIsFlying(false);
  }, []);

  const handleResetCamera = useCallback(() => {
    const todayZ = (Math.min(dayNumber, 90) - 1) * 0.08;
    setFlyTarget({
      position: [0.5, 0.25, todayZ - 0.3],
      lookAt: [0, 0, Math.min(todayZ + 0.5, 89 * 0.08)],
    });
    setIsFlying(true);
    setZoomedDay(null);
  }, [dayNumber]);

  return (
    <div className="relative w-full h-full">
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
            onDayClick={handleDayClick}
          />
          <TimelineEvents3D
            applications={applications}
            planStartDate={planStartDate}
            onApplicationClick={handleApplicationClick}
          />
        </Suspense>

        <CameraRig
          targetPosition={flyTarget?.position ?? null}
          targetLookAt={flyTarget?.lookAt ?? null}
          isFlying={isFlying}
          onFlyComplete={handleFlyComplete}
        />
      </Canvas>

      {zoomedDay !== null && (
        <button
          onClick={handleResetCamera}
          className="absolute top-4 left-4 glass rounded-xl px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white/[0.06] transition-all duration-200 active:scale-95 z-10"
        >
          ← Back to Overview
        </button>
      )}

      {zoomedDay !== null && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-xl px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400 z-10">
          Viewing Day {zoomedDay}
        </div>
      )}
    </div>
  );
}
