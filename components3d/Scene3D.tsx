"use client";

import { useState, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Panel3D from "./Panel3D";
import CameraRig from "./CameraRig";
import StreakBars3D from "./StreakBars3D";
import { DailyCheckin } from "@/lib/types";

interface PanelConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  glowColor: string;
  position: [number, number, number];
  cameraPosition: [number, number, number];
  lookAt: [number, number, number];
}

const PANELS: PanelConfig[] = [
  {
    id: "applications",
    label: "Applications",
    icon: "💼",
    color: "#3b82f6",
    glowColor: "#3b82f6",
    position: [-3, 0.5, 0],
    cameraPosition: [-3, 0.5, 2.5],
    lookAt: [-3, 0.5, 0],
  },
  {
    id: "exercise",
    label: "Exercise",
    icon: "🏋️",
    color: "#10b981",
    glowColor: "#10b981",
    position: [-1.2, 0.8, 0.5],
    cameraPosition: [-1.2, 0.8, 3],
    lookAt: [-1.2, 0.8, 0.5],
  },
  {
    id: "notes",
    label: "Notes",
    icon: "📝",
    color: "#a78bfa",
    glowColor: "#a78bfa",
    position: [0.6, 0.3, 0.2],
    cameraPosition: [0.6, 0.3, 2.7],
    lookAt: [0.6, 0.3, 0.2],
  },
  {
    id: "recruiters",
    label: "Recruiters",
    icon: "🤝",
    color: "#f59e0b",
    glowColor: "#f59e0b",
    position: [2.4, 0.7, 0.3],
    cameraPosition: [2.4, 0.7, 2.8],
    lookAt: [2.4, 0.7, 0.3],
  },
  {
    id: "streaks",
    label: "Streaks & Activity",
    icon: "🔥",
    color: "#ef4444",
    glowColor: "#ef4444",
    position: [4.2, 0.4, 0],
    cameraPosition: [4.2, 0.4, 2.5],
    lookAt: [4.2, 0.4, 0],
  },
];

interface Scene3DProps {
  checkins: DailyCheckin[];
  onPanelClick: (panelId: string) => void;
  activePanel: string | null;
}

export default function Scene3D({ checkins, onPanelClick, activePanel }: Scene3DProps) {
  const [flyTarget, setFlyTarget] = useState<{
    position: [number, number, number];
    lookAt: [number, number, number];
  } | null>(null);
  const [isFlying, setIsFlying] = useState(false);

  const handlePanelClick = useCallback(
    (panel: PanelConfig) => {
      setFlyTarget({ position: panel.cameraPosition, lookAt: panel.lookAt });
      setIsFlying(true);
      onPanelClick(panel.id);
    },
    [onPanelClick]
  );

  const handleFlyComplete = useCallback(() => {
    setIsFlying(false);
  }, []);

  const handleResetCamera = useCallback(() => {
    setFlyTarget(null);
    setIsFlying(true);
    onPanelClick("");
  }, [onPanelClick]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 1, 7], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2)]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-3, 2, 2]} intensity={0.5} color="#8b5cf6" />
        <pointLight position={[3, 2, 2]} intensity={0.5} color="#34d399" />

        <Suspense fallback={null}>
          {PANELS.map((panel, i) => (
            <Panel3D
              key={panel.id}
              position={panel.position}
              label={panel.label}
              icon={panel.icon}
              color={panel.color}
              glowColor={panel.glowColor}
              index={i}
              isActive={activePanel === panel.id}
              onClick={() => handlePanelClick(panel)}
            />
          ))}

          <group position={[0.6, -1.2, 0.5]}>
            <StreakBars3D checkins={checkins} />
          </group>
        </Suspense>

        <CameraRig
          targetPosition={flyTarget?.position ?? null}
          targetLookAt={flyTarget?.lookAt ?? null}
          isFlying={isFlying}
          onFlyComplete={handleFlyComplete}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={12}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={!isFlying && !activePanel}
          autoRotateSpeed={0.3}
          dampingFactor={0.05}
          enableDamping
        />

        <fog attach="fog" args={["#09090b", 12, 25]} />
      </Canvas>

      {activePanel && (
        <button
          onClick={handleResetCamera}
          className="absolute top-4 left-4 glass rounded-xl px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-white/[0.06] transition-all duration-200 active:scale-95 z-10"
        >
          ← Back to Overview
        </button>
      )}
    </div>
  );
}
