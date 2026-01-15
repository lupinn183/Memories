import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Memory } from '../types';

interface FloatingMemoriesProps {
  memories: Memory[];
  onMemoryClick: (id: string) => void;
}

export const FloatingMemories: React.FC<FloatingMemoriesProps> = ({ memories, onMemoryClick }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Calculate Spherical Nebula Positions
  const processedMemories = useMemo(() => {
    const total = memories.length;
    // Golden ratio for even distribution on sphere surface
    const phi = Math.PI * (3 - Math.sqrt(5)); 

    return memories.map((memory, i) => {
      // 1. Calculate Distance (Radius)
      // "Càng xa thì càng nhỏ, càng gần càng to" (Perspective handles size, we handle distance)
      // "Về xa dần sẽ được sắp xếp theo thời gian"
      // We start at a safe distance from the tree (12 units) and expand outward to 60 units
      const minRadius = 12;
      const maxRadius = 70;
      const progress = i / total;
      
      // Use a power curve so more memories are closer to the center, fewer at the edges (optional)
      // or linear. Let's do linear expansion for clear "timeline" feel.
      const radius = minRadius + (progress * (maxRadius - minRadius));

      // 2. Calculate Angle (Fibonacci Sphere Algorithm)
      // y goes from 1 to -1
      const y = 1 - (i / (total - 1)) * 2; 
      // Radius at y position
      const radiusAtY = Math.sqrt(1 - y * y);
      
      const theta = phi * i; // Golden angle increment

      // 3. Convert to Cartesian Coordinates
      // Note: We multiply by 'radius' to push them out
      const xPos = Math.cos(theta) * radiusAtY * radius;
      const yPos = y * radius;
      const zPos = Math.sin(theta) * radiusAtY * radius;

      return {
        ...memory,
        position: [xPos, yPos, zPos] as [number, number, number],
        // Randomize scale slightly for organic feel, but generally keep them large enough
        scale: 5 + Math.random() * 1.5, 
        // Add a random rotation speed for the frame itself
        rotationSpeed: (Math.random() - 0.5) * 0.002
      };
    });
  }, [memories]);

  useFrame(() => {
    if (groupRef.current) {
      // Slowly rotate the entire memory universe
      groupRef.current.rotation.y += 0.0005;
      groupRef.current.rotation.z += 0.0002;
    }
  });

  return (
    <group ref={groupRef}>
      {processedMemories.map((memory) => (
        <MemoryLabItem 
          key={memory.id} 
          memory={memory} 
          onClick={() => onMemoryClick(memory.id)}
        />
      ))}
    </group>
  );
};

// A tech-styled frame for the image
const MemoryLabItem: React.FC<{ memory: Memory & { position: [number, number, number], scale: number, rotationSpeed: number }, onClick: () => void }> = ({ memory, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Group>(null);

  // Animate hover
  useFrame((state) => {
    if (meshRef.current) {
        // Look at center (0,0,0) - The Tree
        meshRef.current.lookAt(0, 0, 0);
        
        // Floating effect (Bobbing) relative to its position radius
        const dist = Math.sqrt(memory.position[0]**2 + memory.position[1]**2 + memory.position[2]**2);
        const floatOffset = Math.sin(state.clock.elapsedTime + dist) * 0.5;
        
        // Apply floating locally in the lookAt direction is tricky, 
        // so we just apply a slight scale pulse or simple local Y oscillation if billboarded.
        // Since we are looking at 0,0,0, let's just use the group rotation for subtle movement.
    }
  });

  // When far away, perspective makes them small.
  // When hovered, we scale up significantly.
  const activeScale = hovered ? memory.scale * 1.5 : memory.scale;
  const borderColor = hovered ? "#ffff00" : "rgba(244, 114, 182, 0.6)"; // Pinkish default

  return (
    <group ref={meshRef} position={[memory.position[0], memory.position[1], memory.position[2]]}>
        
        {/* Holographic Backplate */}
        <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[activeScale * 1.1, activeScale * 0.85]} />
            <meshBasicMaterial 
                color={borderColor} 
                transparent 
                opacity={hovered ? 0.2 : 0.05} 
                side={THREE.DoubleSide}
            />
        </mesh>

        {/* Tech Borders */}
        <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[activeScale * 1.12, activeScale * 0.87]} />
            <meshBasicMaterial color={borderColor} wireframe transparent opacity={0.3} />
        </mesh>

        {/* The Image */}
        <Image 
          url={memory.url} 
          scale={[activeScale, activeScale * 0.75, 1]} 
          transparent 
          opacity={hovered ? 1 : 0.8}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer';
            setHovered(true);
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
            setHovered(false);
          }}
        />

        {/* Connection Line to Core (Optional aesthetic: thin line pointing to center) */}
        {/* Only draw lines for closer memories to avoid clutter */}
        {memory.scale > 5 && (
            <mesh position={[0, 0, -2]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.0, 4, 4]} />
                <meshBasicMaterial color={borderColor} transparent opacity={0.1} />
            </mesh>
        )}

        {/* Data Label */}
        {hovered && (
          <group position={[0, -activeScale * 0.5 - 1, 0]} rotation={[0, Math.PI, 0]}> 
            {/* Rotation 180 because LookAt(0,0,0) flips text sometimes depending on implementation, 
                but Image component handles it. Let's keep text simple. */}
            <Text
              fontSize={activeScale * 0.1}
              color={borderColor}
              anchorX="center"
              anchorY="top"
              font="https://fonts.gstatic.com/s/quicksand/v30/6xKtdSZaM9iE8KbpRA_hK1QN.woff2"
            >
              {memory.date}
            </Text>
          </group>
        )}
    </group>
  );
};