"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import SceneEnvironment from "./SceneEnvironment";
import NotesStack3D from "./NotesStack3D";
import { Note } from "@/lib/types";

interface NotesScene3DProps {
  notes: Note[];
}

export default function NotesScene3D({ notes }: NotesScene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 1, 4], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2)]}
    >
      <SceneEnvironment />
      <Suspense fallback={null}>
        <NotesStack3D notes={notes} />
      </Suspense>
    </Canvas>
  );
}
