import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Memory } from '../types';

interface LittleHelpersProps {
  memories: Memory[];
}

export const LittleHelpers: React.FC<LittleHelpersProps> = ({ memories }) => {
  // Create 3 helpers
  const helpers = useMemo(() => [1, 2, 3], []);

  if (memories.length === 0) return null;

  return (
    <group>
      {helpers.map(id => (
        <Agent key={id} memories={memories} id={id} />
      ))}
    </group>
  );
};

const Agent: React.FC<{ memories: Memory[], id: number }> = ({ memories, id }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [targetIndex, setTargetIndex] = useState(Math.floor(Math.random() * memories.length));
  const [state, setState] = useState<'MOVING' | 'POINTING'>('MOVING');
  const [timer, setTimer] = useState(0);

  // Agent visual props
  const color = id === 1 ? '#00ffff' : id === 2 ? '#ffff00' : '#ff00ff';

  useFrame((stateCtx, delta) => {
    if (!groupRef.current || memories.length === 0) return;

    const targetMemory = memories[targetIndex];
    // Calculate target position (slightly below and in front of the memory)
    const tx = targetMemory.position ? targetMemory.position[0] : 0;
    const ty = targetMemory.position ? targetMemory.position[1] - 2 : 0;
    const tz = targetMemory.position ? targetMemory.position[2] + 2 : 0;
    
    const targetPos = new THREE.Vector3(tx, ty, tz);
    const currentPos = groupRef.current.position;

    if (state === 'MOVING') {
      // Move towards target
      const dist = currentPos.distanceTo(targetPos);
      const speed = 5 * delta;

      if (dist < 0.5) {
        setState('POINTING');
        setTimer(0);
      } else {
        // Lerp movement
        const direction = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
        currentPos.add(direction.multiplyScalar(speed));
        
        // Face the target
        groupRef.current.lookAt(targetPos);
      }
    } else if (state === 'POINTING') {
      setTimer(prev => prev + delta);
      
      // Face the memory
      const memoryPos = new THREE.Vector3(
         targetMemory.position ? targetMemory.position[0] : 0,
         targetMemory.position ? targetMemory.position[1] : 0,
         targetMemory.position ? targetMemory.position[2] : 0
      );
      groupRef.current.lookAt(memoryPos);

      // Wobble animation to simulate "excited pointing"
      groupRef.current.rotation.z = Math.sin(stateCtx.clock.elapsedTime * 10) * 0.1;

      // Pick new target after 3 seconds
      if (timer > 3) {
        let next = Math.floor(Math.random() * memories.length);
        if (next === targetIndex) next = (next + 1) % memories.length;
        setTargetIndex(next);
        setState('MOVING');
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Arm (Pointing) */}
      <mesh position={[0.3, 0.6, 0.3]} rotation={[0.5, 0, 0]}>
         <boxGeometry args={[0.1, 0.4, 0.1]} />
         <meshStandardMaterial color={color} />
      </mesh>
      {/* Hover Jet particles */}
      <mesh position={[0, 0, 0]}>
         <coneGeometry args={[0.2, 0.4, 8]} />
         <meshBasicMaterial color="cyan" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};