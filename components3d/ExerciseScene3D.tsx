"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import SceneEnvironment from "./SceneEnvironment";
import ExerciseRing3D from "./ExerciseRing3D";
import { Workout } from "@/lib/types";

interface ExerciseScene3DProps {
  workouts: Workout[];
}

export default function ExerciseScene3D({ workouts }: ExerciseScene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 4.5], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2)]}
    >
      <SceneEnvironment />
      <Suspense fallback={null}>
        <ExerciseRing3D workouts={workouts} />
      </Suspense>
    </Canvas>
  );
}
