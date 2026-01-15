import React, { useState, useEffect, useRef } from 'react';
import { MemoryVerse } from './components/MemoryVerse';
import { UIOverlay } from './components/UIOverlay';
import { Memory } from './types';

// Simple UUID generator fallback
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to generate a reliable placeholder image (Data URL)
const createCyberpunkPlaceholder = () => {
  if (typeof document === 'undefined') return ''; 
  
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: Deep Cyber/Space dark
  const gradient = ctx.createLinearGradient(0, 0, 400, 300);
  gradient.addColorStop(0, '#020005');
  gradient.addColorStop(1, '#1a0b2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 300);

  // Holographic Grid
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)'; // Pink-400 with opacity
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = 0; x <= 400; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 300);
    ctx.stroke();
  }
  for (let y = 0; y <= 300; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(400, y);
    ctx.stroke();
  }

  // Neon Accent Circle
  ctx.beginPath();
  ctx.arc(200, 150, 60, 0, Math.PI * 2);
  ctx.strokeStyle = '#22d3ee'; // Cyan
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Glow effect simulation
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0; // Reset

  // Text
  ctx.fillStyle = '#e879f9'; // Purple-400
  ctx.font = '20px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MEMORY_FRAGMENT', 200, 145);
  ctx.fillStyle = '#fff';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText('ENCRYPTED_DATA', 200, 170);

  return canvas.toDataURL('image/jpeg', 0.8);
};

// Generate the placeholder once to use across all memories
const PLACEHOLDER_URL = createCyberpunkPlaceholder();

// Generate 100 Placeholder Memories
const generateMemories = (count: number): Memory[] => {
  return Array.from({ length: count }).map((_, i) => {
    const date = new Date(2020, 0, 1 + i * 5); // Spread over time
    return {
      id: `mem-${i}`,
      url: PLACEHOLDER_URL, // Use the generated Data URL
      description: `Memory Log #${i + 1}: Analyzed pattern data from sector ${Math.floor(Math.random() * 99)}. Subject displayed high emotional resonance.`,
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
    };
  });
};

const INITIAL_MEMORIES: Memory[] = generateMemories(100);

// --- MUSIC CONFIGURATION ---
// Note: Since we cannot host files, using a copyright-free romantic piano track URL.
// Replace this URL with your Quan A.P mp3 link if you have one hosted.
const MUSIC_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=sad-piano-111666.mp3"; 

const App: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>(INITIAL_MEMORIES);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed (interaction required):", e));
    }
    setIsPlaying(!isPlaying);
  };

  // Function to add a new memory
  const addMemory = (file: File, description: string, date: string) => {
    const url = URL.createObjectURL(file);
    const newMemory: Memory = {
      id: generateId(),
      url,
      description,
      date,
      timestamp: new Date(date).getTime(),
    };
    
    // Sort by date to maintain the spiral logic order
    setMemories((prev) => [...prev, newMemory].sort((a, b) => a.timestamp - b.timestamp));
    setIsAddModalOpen(false);
  };

  const handleMemoryClick = (id: string) => {
    setSelectedMemoryId(id);
  };

  const closeDetailPopup = () => {
    setSelectedMemoryId(null);
  };

  const selectedMemory = memories.find(m => m.id === selectedMemoryId) || null;

  return (
    <div className="w-full h-screen relative bg-black">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <MemoryVerse 
          memories={memories} 
          onMemoryClick={handleMemoryClick} 
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UIOverlay 
          memoriesCount={memories.length}
          onAddClick={() => setIsAddModalOpen(true)}
          selectedMemory={selectedMemory}
          onCloseDetail={closeDetailPopup}
          isAddModalOpen={isAddModalOpen}
          onCloseAddModal={() => setIsAddModalOpen(false)}
          onAddMemory={addMemory}
          isMusicPlaying={isPlaying}
          onToggleMusic={toggleMusic}
        />
      </div>
    </div>
  );
};

export default App;