import React, { useState, useEffect, useCallback } from 'react';
import { Settings, LogIn, ChevronLeft, ChevronRight } from 'lucide-react';
import SkillSphere from './components/SkillSphere';
import TaskList from './components/TaskList';
import SettingsModal from './components/SettingsModal';
import CapabilityManager from './components/CapabilityManager';
import { Capability, Task, TaskStatus, VisualSettings } from './types';
import { distributePointsOnSphere } from './utils/math';

const INITIAL_CAPS_EN: Capability[] = [
  { id: '1', name: 'Strength', color: '#ef4444', score: 0, phi: 0, theta: 0, description: 'Physical power and endurance.', criteria: 'Workouts, sports.' },
  { id: '2', name: 'Intellect', color: '#3b82f6', score: 0, phi: 0, theta: 0, description: 'Mental acuity and knowledge.', criteria: 'Reading, puzzles, learning.' },
  { id: '3', name: 'Creativity', color: '#a855f7', score: 0, phi: 0, theta: 0, description: 'Artistic expression.', criteria: 'Creating art, writing.' },
  { id: '4', name: 'Willpower', color: '#eab308', score: 0, phi: 0, theta: 0, description: 'Discipline and consistency.', criteria: 'Routines, early wake up.' },
  { id: '5', name: 'Health', color: '#22c55e', score: 0, phi: 0, theta: 0, description: 'Vitality and well-being.', criteria: 'Eating clean, sleep.' },
];

const INITIAL_CAPS_ZH: Capability[] = [
  { id: '1', name: '力量', color: '#ef4444', score: 0, phi: 0, theta: 0, description: '身体素质与耐力。', criteria: '健身、运动。' },
  { id: '2', name: '智力', color: '#3b82f6', score: 0, phi: 0, theta: 0, description: '思维敏捷度与知识储备。', criteria: '阅读、解题、学习。' },
  { id: '3', name: '创造', color: '#a855f7', score: 0, phi: 0, theta: 0, description: '艺术表现力与创新。', criteria: '创作、写作。' },
  { id: '4', name: '意志', color: '#eab308', score: 0, phi: 0, theta: 0, description: '自律性与毅力。', criteria: '坚持常规、早起。' },
  { id: '5', name: '健康', color: '#22c55e', score: 0, phi: 0, theta: 0, description: '生命力与身心状态。', criteria: '健康饮食、睡眠。' },
];

const DEFAULT_VISUALS: VisualSettings = {
  language: 'en',
  backgroundColor: '#09090b',
  backgroundImage: null,
  taskPanelColor: '#18181b',
  taskPanelOpacity: 0.8,
  showTaskPanel: true,
  coreColor: '#6366f1',
  coreShape: 'icosahedron',
  coreRadius: 1.0,
  showCoreInner: true, 
  showCoreOuter: true, 
  outerCoreStyle: 'wireframe',
  environmentType: 'stars',
  barShape: 'cylinder',
  barThickness: 0.1,
  barBaseLength: 0.5, 
  scoreScale: 0.3,
  tipShape: 'octahedron',
  tipSize: 0.2,
  connectionStyle: 'curve-in',
  connectionThickness: 2,
  connectionMode: 'auto',
  connectionNeighbors: 3,
  useCustomConnectionColor: false,
  connectionColor: '#ffffff',
  fillMesh: true,
  fillColorMode: 'gradient',
  fillSolidColor: '#6366f1',
  fillOpacity: 0.2,
  autoRotateScene: true,
  autoRotateCore: true,
  labelMode: 'rising',
  showLabels: true,
  labelContent: 'both',
  labelSize: 12,
  minLabelSize: 8 // Default minimum font size on screen
};

const App: React.FC = () => {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(DEFAULT_VISUALS);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWidgetMode, setIsWidgetMode] = useState(false); 
  const [isDetached, setIsDetached] = useState(false); 

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'widget') {
      setIsWidgetMode(true);
      document.body.style.backgroundColor = 'transparent';
    }
  }, []);

  // Initial Load - Comprehensive recovery
  useEffect(() => {
    const savedCaps = localStorage.getItem('holoskill_caps');
    const savedTasks = localStorage.getItem('holoskill_tasks');
    const savedVisuals = localStorage.getItem('holoskill_visuals');
    const savedDetachedState = localStorage.getItem('holoskill_detached');

    if (savedCaps) {
      setCapabilities(JSON.parse(savedCaps));
    } else {
      updateCapabilitiesLayout(DEFAULT_VISUALS.language === 'zh' ? INITIAL_CAPS_ZH : INITIAL_CAPS_EN);
    }

    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedVisuals) {
      setVisualSettings({...DEFAULT_VISUALS, ...JSON.parse(savedVisuals)});
    }
    if (savedDetachedState === 'true' && !isWidgetMode) setIsDetached(true);
  }, [isWidgetMode]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'holoskill_caps' && e.newValue) setCapabilities(JSON.parse(e.newValue));
      if (e.key === 'holoskill_tasks' && e.newValue) setTasks(JSON.parse(e.newValue));
      if (e.key === 'holoskill_visuals' && e.newValue) setVisualSettings(JSON.parse(e.newValue));
      if (e.key === 'holoskill_detached') setIsDetached(e.newValue === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Immediate Persistence
  useEffect(() => {
    if (capabilities.length > 0) localStorage.setItem('holoskill_caps', JSON.stringify(capabilities));
  }, [capabilities]);

  useEffect(() => {
    localStorage.setItem('holoskill_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('holoskill_visuals', JSON.stringify(visualSettings));
  }, [visualSettings]);

  const updateCapabilitiesLayout = useCallback((caps: Capability[]) => {
    const points = distributePointsOnSphere(caps.length);
    const updated = caps.map((cap, index) => ({
      ...cap,
      phi: points[index].phi,
      theta: points[index].theta
    }));
    setCapabilities(updated);
  }, []);

  const handleAddTask = (title: string, capIds: string[], impact: number = 1, impactMap?: Record<string, number>) => {
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      capabilityIds: capIds,
      impact,
      impactMap, 
      status: TaskStatus.TODO,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status !== TaskStatus.TODO) return;

    const newTasks = tasks.map(t => 
      t.id === taskId 
        ? { ...t, status: TaskStatus.COMPLETED, completedAt: new Date().toISOString() } 
        : t
    );
    setTasks(newTasks);

    const newCaps = capabilities.map(cap => {
      if (task.capabilityIds.includes(cap.id)) {
        const value = task.impactMap?.[cap.id] ?? task.impact ?? 1;
        return { ...cap, score: cap.score + value };
      }
      return cap;
    });
    setCapabilities(newCaps);
  };

  const handleCancelTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: TaskStatus.CANCELED, canceledAt: new Date().toISOString() } 
        : t
    ));
  };

  const handleDeleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
  }

  const handleAddCapability = (name: string, color: string, description: string, criteria: string) => {
    const newCap: Capability = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      color,
      description,
      criteria,
      score: 0,
      phi: 0, 
      theta: 0
    };
    const newCapsList = [...capabilities, newCap];
    updateCapabilitiesLayout(newCapsList);
  };

  const handleRemoveCapability = (id: string) => {
    const newCapsList = capabilities.filter(c => c.id !== id);
    updateCapabilitiesLayout(newCapsList);
  };

  const handleReset = () => {
    setTasks([]);
    setVisualSettings(DEFAULT_VISUALS);
    updateCapabilitiesLayout(DEFAULT_VISUALS.language === 'zh' ? INITIAL_CAPS_ZH : INITIAL_CAPS_EN);
  };

  const handleImportData = (data: { tasks: Task[], capabilities: Capability[], visuals: VisualSettings }) => {
      setTasks(data.tasks);
      setCapabilities(data.capabilities);
      setVisualSettings(data.visuals);
      
      // Explicitly push to localStorage for safety
      localStorage.setItem('holoskill_caps', JSON.stringify(data.capabilities));
      localStorage.setItem('holoskill_tasks', JSON.stringify(data.tasks));
      localStorage.setItem('holoskill_visuals', JSON.stringify(data.visuals));
  };

  const handleDetach = () => {
    setIsDetached(true);
    localStorage.setItem('holoskill_detached', 'true');
    window.open(
      `${window.location.pathname}?mode=widget`, 
      'HoloSkillWidget', 
      'width=360,height=600,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  const handleAttach = () => {
    setIsDetached(false);
    localStorage.setItem('holoskill_detached', 'false');
  };

  const toggleTaskPanel = () => {
    setVisualSettings(prev => ({ ...prev, showTaskPanel: !prev.showTaskPanel }));
  }

  if (isWidgetMode) {
    return (
      <div className="h-screen w-screen bg-background border border-white/10 overflow-hidden">
        <TaskList 
          tasks={tasks} 
          capabilities={capabilities}
          onAddTask={handleAddTask}
          onCompleteTask={handleCompleteTask}
          onCancelTask={handleCancelTask}
          onDeleteTask={handleDeleteTask}
          isWidget={true}
          onDetach={() => {}} 
          settings={visualSettings}
          onTogglePanel={() => {}}
        />
      </div>
    );
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
  };

  const panelBg = `rgba(${hexToRgb(visualSettings.taskPanelColor)}, ${visualSettings.taskPanelOpacity})`;

  return (
    <div 
      className="h-screen w-screen text-white flex flex-col md:flex-row overflow-hidden relative transition-colors duration-500 bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundColor: visualSettings.backgroundColor,
        backgroundImage: visualSettings.backgroundImage ? `url(${visualSettings.backgroundImage})` : undefined
      }}
    >
      {visualSettings.backgroundImage && (
        <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />
      )}
      
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-black/40 hover:bg-white/10 text-white rounded-lg backdrop-blur border border-white/20 transition-all font-medium"
        >
          <Settings size={18} />
          <span className="text-xs uppercase tracking-wider hidden sm:inline">
            {visualSettings.language === 'zh' ? '系统设置' : 'Settings'}
          </span>
        </button>
      </div>

      <div className={`relative z-0 transition-all duration-500 ease-in-out ${isDetached || !visualSettings.showTaskPanel ? 'w-full h-full' : 'w-full h-[50vh] md:w-1/2 md:h-full'} p-4`}>
        <SkillSphere capabilities={capabilities} settings={visualSettings} />
        
        {isDetached && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
             <button 
               onClick={handleAttach}
               className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-full shadow-2xl transition-all font-bold"
             >
               <LogIn size={20} />
               <span>{visualSettings.language === 'zh' ? '恢复主界面' : 'Restore UI'}</span>
             </button>
          </div>
        )}

        {!isDetached && !visualSettings.showTaskPanel && (
          <button 
            onClick={toggleTaskPanel}
            className="absolute top-1/2 -right-2 -translate-y-1/2 bg-surface/80 hover:bg-white/20 p-1 rounded-l-md border border-white/20 transition-all z-50"
            title={visualSettings.language === 'zh' ? '展开面板' : 'Expand Panel'}
          >
            <ChevronLeft size={24} />
          </button>
        )}
      </div>

      {!isDetached && visualSettings.showTaskPanel && (
        <div 
           className="w-full h-[50vh] md:w-1/2 md:h-full p-4 md:pl-0 z-10 transition-all duration-500 relative"
           style={{ backgroundColor: panelBg }}
        >
          <TaskList 
            tasks={tasks} 
            capabilities={capabilities}
            onAddTask={handleAddTask}
            onCompleteTask={handleCompleteTask}
            onCancelTask={handleCancelTask}
            onDeleteTask={handleDeleteTask}
            onDetach={handleDetach}
            settings={visualSettings}
            onTogglePanel={toggleTaskPanel}
          />
        </div>
      )}

      {!isDetached && (
            <CapabilityManager 
                capabilities={capabilities}
                tasks={tasks}
                onAddCapability={handleAddCapability}
                onRemoveCapability={handleRemoveCapability}
                language={visualSettings.language}
                visualSettings={visualSettings}
                onImportData={handleImportData}
                onResetAll={handleReset}
            />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        capabilities={capabilities}
        visualSettings={visualSettings}
        onResetData={handleReset}
        onUpdateVisuals={setVisualSettings}
      />
    </div>
  );
};

export default App;