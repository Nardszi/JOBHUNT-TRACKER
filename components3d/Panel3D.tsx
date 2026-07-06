"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface Panel3DProps {
  position: [number, number, number];
  label: string;
  icon: string;
  color: string;
  glowColor: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
  activityLevel: number;
}

export default function Panel3D({
  position,
  label,
  icon,
  color,
  glowColor,
  index,
  isActive,
  onClick,
  activityLevel,
}: Panel3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const offset = index * 1.3;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + offset) * 0.08;
    groupRef.current.rotation.y = Math.sin(t * 0.3 + offset) * 0.05;
    groupRef.current.rotation.x = Math.cos(t * 0.4 + offset) * 0.02;

    if (meshRef.current) {
      const targetScale = hovered ? 1.08 : isActive ? 1.05 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <RoundedBox
        ref={meshRef}
        args={[2, 1.4, 0.15]}
        radius={0.08}
        smoothness={4}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <meshStandardMaterial
          color={hovered ? color : "#252540"}
          emissive={hovered ? glowColor : glowColor}
          emissiveIntensity={hovered ? 0.5 : Math.max(0.08, activityLevel * 0.35)}
          transparent
          opacity={0.95}
          roughness={0.3}
          metalness={0.1}
        />
      </RoundedBox>

      <Text
        position={[0, 0.25, 0.1]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {icon}
      </Text>

      <Text
        position={[0, -0.15, 0.1]}
        fontSize={0.13}
        color="#a0a0b0"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.6}
      >
        {label}
      </Text>

      {(hovered || isActive || activityLevel > 0.5) && (
        <pointLight
          position={[0, 0, 0.5]}
          color={glowColor}
          intensity={hovered ? 0.8 : activityLevel * 0.6}
          distance={2}
        />
      )}
    </group>
  );
}
