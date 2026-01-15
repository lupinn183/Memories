import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Sparkles, Grid } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Memory } from '../types';
import { PeachTree } from './PeachTree';
import { FloatingMemories } from './FloatingMemories';
import { LittleHelpers } from './LittleHelpers';

interface MemoryVerseProps {
  memories: Memory[];
  onMemoryClick: (id: string) => void;
}

export const MemoryVerse: React.FC<MemoryVerseProps> = ({ memories, onMemoryClick }) => {
  return (
    <Canvas gl={{ antialias: false, stencil: false, alpha: false }}>
      <Suspense fallback={null}>
        {/* Camera: Positioned to look at the center of the sphere */}
        <PerspectiveCamera makeDefault position={[0, 10, 80]} fov={50} />
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          maxDistance={150} 
          minDistance={10} 
          target={[0, 0, 0]} /* Look exactly at World Origin (Tree Canopy) */
          autoRotate={true}
          autoRotateSpeed={0.8}
          dampingFactor={0.05}
        />

        {/* Lighting */}
        <ambientLight intensity={0.1} color="#2e1065" />
        {/* Central warm light from the Tree's heart */}
        <pointLight position={[0, 0, 0]} intensity={2.5} color="#fb7185" distance={50} decay={2} /> 
        <pointLight position={[50, 50, 50]} intensity={1} color="#22d3ee" />
        <pointLight position={[-50, -20, -50]} intensity={0.5} color="#c084fc" />
        
        {/* Background */}
        <color attach="background" args={['#020005']} />
        <Stars radius={250} depth={100} count={12000} factor={6} saturation={1} fade speed={1} />
        
        {/* Floor Grid - Lowered to match tree roots (-8y) */}
        <Grid 
          position={[0, -15, 0]} 
          args={[200, 200]} 
          cellSize={3} 
          cellThickness={1} 
          cellColor="#be185d" 
          sectionSize={15} 
          sectionThickness={1.2} 
          sectionColor="#0ea5e9" 
          fadeDistance={120} 
          fadeStrength={1.2}
          infiniteGrid 
        />

        {/* Particles surrounding the tree */}
        <Sparkles count={1000} scale={60} size={8} speed={0.4} opacity={0.6} color="#fbcfe8" />
        
        {/* Objects */}
        <PeachTree />
        <FloatingMemories memories={memories} onMemoryClick={onMemoryClick} />
        <LittleHelpers memories={memories} />

        {/* Effects */}
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={1.5} mipmapBlur radius={0.5} />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>

      </Suspense>
    </Canvas>
  );
};