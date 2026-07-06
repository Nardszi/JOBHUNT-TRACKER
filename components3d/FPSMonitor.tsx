"use client";

import { useRef, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";

interface FPSMonitorProps {
  onDegraded: () => void;
  threshold?: number;
  sampleSize?: number;
}

export default function FPSMonitor({
  onDegraded,
  threshold = 15,
  sampleSize = 60,
}: FPSMonitorProps) {
  const frames = useRef<number[]>([]);
  const lastTime = useRef(performance.now());
  const degraded = useRef(false);

  const checkFPS = useCallback(() => {
    const now = performance.now();
    frames.current.push(now - lastTime.current);
    lastTime.current = now;

    if (frames.current.length > sampleSize) {
      frames.current.shift();
    }

    if (frames.current.length >= sampleSize && !degraded.current) {
      const avg = frames.current.reduce((a, b) => a + b, 0) / frames.current.length;
      const fps = 1000 / avg;
      if (fps < threshold) {
        degraded.current = true;
        onDegraded();
      }
    }
  }, [onDegraded, threshold, sampleSize]);

  useFrame(() => {
    checkFPS();
  });

  return null;
}
