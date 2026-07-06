"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CameraRigProps {
  targetPosition: [number, number, number] | null;
  targetLookAt: [number, number, number] | null;
  isFlying: boolean;
  onFlyComplete: () => void;
}

const DEFAULT_POSITION: [number, number, number] = [0, 1, 7];
const DEFAULT_LOOK_AT: [number, number, number] = [0, 0, 0];

export default function CameraRig({
  targetPosition,
  targetLookAt,
  isFlying,
  onFlyComplete,
}: CameraRigProps) {
  const { camera } = useThree();
  const flyProgress = useRef(0);
  const startPosition = useRef(new THREE.Vector3(...DEFAULT_POSITION));
  const startLookAt = useRef(new THREE.Vector3(...DEFAULT_LOOK_AT));
  const currentLookAt = useRef(new THREE.Vector3(...DEFAULT_LOOK_AT));

  useEffect(() => {
    if (isFlying && targetPosition) {
      startPosition.current.copy(camera.position);
      startLookAt.current.copy(currentLookAt.current);
      flyProgress.current = 0;
    }
  }, [isFlying, targetPosition, camera]);

  useFrame(() => {
    if (!isFlying || !targetPosition || !targetLookAt) {
      if (!isFlying) {
        const defaultPos = new THREE.Vector3(...DEFAULT_POSITION);
        const defaultLook = new THREE.Vector3(...DEFAULT_LOOK_AT);
        camera.position.lerp(defaultPos, 0.05);
        currentLookAt.current.lerp(defaultLook, 0.05);
        camera.lookAt(currentLookAt.current);
      }
      return;
    }

    flyProgress.current = Math.min(flyProgress.current + 0.02, 1);
    const t = easeInOutCubic(flyProgress.current);

    camera.position.lerpVectors(
      startPosition.current,
      new THREE.Vector3(...targetPosition),
      t
    );

    currentLookAt.current.lerpVectors(
      startLookAt.current,
      new THREE.Vector3(...targetLookAt),
      t
    );
    camera.lookAt(currentLookAt.current);

    if (flyProgress.current >= 1) {
      onFlyComplete();
    }
  });

  return null;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
