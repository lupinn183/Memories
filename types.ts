import { Vector3 } from 'three';

export interface Memory {
  id: string;
  url: string;
  description: string;
  date: string; // ISO string
  timestamp: number;
  position?: [number, number, number]; // Calculated 3D position
}

export interface HelperAgent {
  id: string;
  targetMemoryId: string | null;
  position: Vector3;
}

export interface UIState {
  isAddModalOpen: boolean;
  selectedMemory: Memory | null;
  isControlsVisible: boolean;
}