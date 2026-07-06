"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import SceneEnvironment from "./SceneEnvironment";
import PipelineCards3D from "./PipelineCards3D";
import { Application } from "@/lib/types";

interface ApplicationsScene3DProps {
  applications: Application[];
}

export default function ApplicationsScene3D({ applications }: ApplicationsScene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 5], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2)]}
    >
      <SceneEnvironment />
      <Suspense fallback={null}>
        <PipelineCards3D applications={applications} />
      </Suspense>
    </Canvas>
  );
}
