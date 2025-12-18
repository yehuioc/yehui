export interface Capability {
  id: string;
  name: string;
  color: string;
  score: number;
  description?: string;
  criteria?: string;
  phi: number;
  theta: number;
}

export enum TaskStatus {
  TODO = 'TODO',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

export interface Task {
  id: string;
  title: string;
  capabilityIds: string[];
  impact: number;
  impactMap?: Record<string, number>;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  canceledAt?: string;
}

export type EnvironmentType = 'stars' | 'nebula' | 'grid' | 'matrix' | 'ocean' | 'none';

export interface VisualSettings {
  language: 'en' | 'zh';
  backgroundColor: string;
  backgroundImage: string | null;
  taskPanelColor: string;
  taskPanelOpacity: number; // 0 to 1
  showTaskPanel: boolean;
  
  coreColor: string;
  coreShape: 'sphere' | 'icosahedron' | 'dodecahedron';
  coreRadius: number;
  
  showCoreInner: boolean;
  showCoreOuter: boolean;
  outerCoreStyle: 'wireframe' | 'filled';
  
  environmentType: EnvironmentType;

  barShape: 'cylinder' | 'cone' | 'prism';
  barThickness: number;
  barBaseLength: number; // Base length regardless of score
  scoreScale: number; // Multiplier for score to length conversion
  
  tipShape: 'sphere' | 'cube' | 'octahedron' | 'dodecahedron' | 'none';
  tipSize: number;

  connectionStyle: 'none' | 'straight' | 'curve-in' | 'curve-out';
  connectionThickness: number; 
  connectionMode: 'fixed' | 'auto'; 
  connectionNeighbors: number; 
  
  useCustomConnectionColor: boolean;
  connectionColor: string;

  fillMesh: boolean;
  fillColorMode: 'solid' | 'gradient' | 'core'; 
  fillSolidColor: string; 
  fillOpacity: number;

  autoRotateScene: boolean;
  autoRotateCore: boolean;

  labelMode: 'rising' | 'fixed'; 
  showLabels: boolean;
  labelContent: 'name' | 'score' | 'both';
  labelSize: number; 
  minLabelSize: number; // New setting for minimum visual size on screen
}