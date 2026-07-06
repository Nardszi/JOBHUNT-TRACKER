"use client";

import { Suspense, useCallback, useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import SceneEnvironment from "./SceneEnvironment";
import PlanTimeline3D from "./PlanTimeline3D";
import TimelineEvents3D from "./TimelineEvents3D";
import { Application } from "@/lib/types";
import { useRouter } from "next/navigation";

const FLY_DURATION_MS = 800;

function CameraAnimator({
  targetPosition,
  targetLookAt,
  isFlying,
  onFlyComplete,
}: {
  targetPosition: [number, number, number] | null;
  targetLookAt: [number, number, number] | null;
  isFlying: boolean;
  onFlyComplete: () => void;
}) {
  const { camera } = useThree();
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const flyStart = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (isFlying && targetPosition && targetLookAt) {
      startPos.current.copy(camera.position);
      flyStart.current = performance.now();
      doneRef.current = false;
    }
  }, [isFlying, targetPosition, targetLookAt, camera]);

  useFrame(() => {
    if (!isFlying || !targetPosition || !targetLookAt) return;
    if (doneRef.current) return;

    const elapsed = performance.now() - flyStart.current;
    const raw = Math.min(elapsed / FLY_DURATION_MS, 1);
    const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;

    camera.position.lerpVectors(
      startPos.current,
      new THREE.Vector3(...targetPosition),
      t
    );

    if (raw >= 1) {
      doneRef.current = true;
      onFlyComplete();
    }
  });

  return null;
}

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
  const controlsRef = useRef<any>(null);
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
    if (controlsRef.current && flyTarget) {
      controlsRef.current.target.set(...flyTarget.lookAt);
      controlsRef.current.update();
    }
  }, [flyTarget]);

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

        <CameraAnimator
          targetPosition={flyTarget?.position ?? null}
          targetLookAt={flyTarget?.lookAt ?? null}
          isFlying={isFlying}
          onFlyComplete={handleFlyComplete}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={14}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.1}
          dampingFactor={0.05}
          enableDamping
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
