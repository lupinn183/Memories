import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Instance, Instances } from '@react-three/drei';

// --- CONFIGURATION ---
const TREE_LEVELS = 5; // Detail level
const BRANCH_ANGLE = 0.55; 
const TRUNK_COLOR = "#3d2817";
const PETAL_COLOR = "#ff69b4";
const PETAL_EMISSIVE = "#ff1493";

// --- HELPER FUNCTIONS ---
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

interface BranchSegment {
  midPoint: THREE.Vector3;
  orientation: THREE.Quaternion;
  length: number;
  radiusTop: number;
  radiusBottom: number;
}

export const PeachTree: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  // 1. GENERATE SKELETON (Recursive)
  // We calculate exact midpoints and quaternions to align cylinders perfectly
  const { segments, leafPositions } = useMemo(() => {
    const segs: BranchSegment[] = [];
    const leaves: { pos: THREE.Vector3, rot: THREE.Euler, scale: number }[] = [];

    const grow = (
      startPoint: THREE.Vector3,
      direction: THREE.Vector3, // Normalized direction
      length: number,
      radius: number,
      level: number
    ) => {
      // 1. Create the branch segment geometry data
      const endPoint = startPoint.clone().add(direction.clone().multiplyScalar(length));
      
      // Calculate midpoint for the cylinder position
      const midPoint = startPoint.clone().add(endPoint).multiplyScalar(0.5);
      
      // Calculate rotation (Quaternion) to align Y-axis with direction
      const defaultUp = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultUp, direction);

      segs.push({
        midPoint,
        orientation: quaternion,
        length,
        radiusTop: radius * 0.7,
        radiusBottom: radius
      });

      if (level <= 0) {
        // Add leaves at the tips of terminal branches
        const clusterSize = 8;
        for(let i=0; i<clusterSize; i++) {
            leaves.push({
                pos: endPoint.clone().add(new THREE.Vector3(
                    randomRange(-1.5, 1.5), 
                    randomRange(-1.5, 1.5), 
                    randomRange(-1.5, 1.5)
                )),
                rot: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0),
                scale: randomRange(0.2, 0.4)
            });
        }
        return;
      }

      // 2. Spawn Children
      const childCount = 2 + (Math.random() > 0.5 ? 1 : 0);
      
      for (let i = 0; i < childCount; i++) {
        // Perturb direction
        const angleX = randomRange(-BRANCH_ANGLE, BRANCH_ANGLE);
        const angleZ = randomRange(-BRANCH_ANGLE, BRANCH_ANGLE);
        
        // Create a rotation matrix for the perturbation
        const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(angleX, 0, angleZ));
        
        // Apply rotation to current direction relative to World is tricky, 
        // simpler is to just jitter the vector
        const newDir = direction.clone().applyMatrix4(rotationMatrix).normalize();
        
        // Add some random twist
        newDir.applyAxisAngle(new THREE.Vector3(0,1,0), randomRange(0, Math.PI * 2));

        grow(
            endPoint, 
            newDir.normalize(), 
            length * 0.85, 
            radius * 0.7, 
            level - 1
        );
      }
    };

    // Initial Trunk
    // Start at [0, 0, 0] relative to the tree group
    grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 4, 1.0, TREE_LEVELS);

    return { segments: segs, leafPositions: leaves };
  }, []);

  // Material
  const barkMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: TRUNK_COLOR, 
    roughness: 0.9 
  }), []);

  return (
    // Lower the entire tree group so the canopy is near World (0,0,0)
    // The trunk starts at 0, grows up ~12 units. Center is ~6-8.
    <group ref={groupRef} position={[0, -8, 0]}>
      
      {/* RENDER BRANCHES */}
      {segments.map((seg, i) => (
        <mesh 
            key={i} 
            position={seg.midPoint} 
            quaternion={seg.orientation}
            castShadow 
            receiveShadow
        >
            <cylinderGeometry args={[seg.radiusTop, seg.radiusBottom, seg.length, 6]} />
            <primitive object={barkMaterial} />
        </mesh>
      ))}

      {/* RENDER FLOWERS (Optimized InstancedMesh) */}
      <Instances range={20000}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial 
            color={PETAL_COLOR} 
            emissive={PETAL_EMISSIVE} 
            emissiveIntensity={0.6}
            side={THREE.DoubleSide} 
            transparent 
            opacity={0.95} 
        />
        {leafPositions.map((leaf, i) => (
            <Instance 
                key={i} 
                position={leaf.pos} 
                rotation={leaf.rot} 
                scale={[leaf.scale, leaf.scale, leaf.scale]} 
            />
        ))}
      </Instances>

       {/* Falling Petals Effect */}
       <FallingPetals />
       
       {/* Darker root base blending into space */}
       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
         <circleGeometry args={[3, 16]} />
         <meshBasicMaterial color="#000" transparent opacity={0.8} />
       </mesh>
    </group>
  );
};

const FallingPetals = () => {
    const count = 200;
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    // Create random start positions around the canopy area (y: 8 to 15)
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            x: (Math.random() - 0.5) * 20,
            y: Math.random() * 10 + 8,
            z: (Math.random() - 0.5) * 20,
            speed: Math.random() * 0.04 + 0.01,
            rotationSpeed: (Math.random() - 0.5) * 0.05
        }));
    }, []);

    useFrame((state) => {
        if (!mesh.current) return;
        particles.forEach((p, i) => {
            p.y -= p.speed;
            p.x += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.01;
            
            // Reset if falls below tree roots
            if (p.y < 0) {
                p.y = 18;
                p.x = (Math.random() - 0.5) * 15;
                p.z = (Math.random() - 0.5) * 15;
            }

            dummy.position.set(p.x, p.y, p.z);
            dummy.rotation.x += p.rotationSpeed;
            dummy.rotation.y += p.rotationSpeed;
            dummy.scale.setScalar(0.25);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color="#ffc0cb" side={THREE.DoubleSide} />
        </instancedMesh>
    )
}