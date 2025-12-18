import React, { useState } from 'react';
import { CheckCircle2, Circle, XCircle, Tag, Plus, Trash2, Calendar, Clock, X, ExternalLink, Zap, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { Task, TaskStatus, Capability, VisualSettings } from '../types';

interface TaskListProps {
  tasks: Task[];
  capabilities: Capability[];
  onAddTask: (title: string, capIds: string[], impact: number, impactMap?: Record<string, number>) => void;
  onCompleteTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  isWidget?: boolean;
  onDetach?: () => void;
  settings: VisualSettings;
  onTogglePanel: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, capabilities, onAddTask, onCompleteTask, onCancelTask, onDeleteTask, isWidget = false, onDetach, settings, onTogglePanel
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCapIds, setSelectedCapIds] = useState<string[]>([]);
  const [impact, setImpact] = useState(1);
  const [impactMap, setImpactMap] = useState<Record<string, number>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isAdvancedImpact, setIsAdvancedImpact] = useState(false);

  const t = (zh: string, en: string) => settings.language === 'zh' ? zh : en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || selectedCapIds.length === 0) return;
    let finalMap: Record<string, number> | undefined = undefined;
    if (isAdvancedImpact) {
        finalMap = {};
        selectedCapIds.forEach(id => { finalMap![id] = impactMap[id] ?? 1; });
    }
    onAddTask(newTaskTitle, selectedCapIds, impact, finalMap);
    setNewTaskTitle(''); setSelectedCapIds([]); setImpact(1); setImpactMap({}); setIsAdding(false); setIsAdvancedImpact(false);
  };

  const toggleCapSelection = (id: string) => {
    setSelectedCapIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
         const newMap = {...impactMap}; delete newMap[id]; setImpactMap(newMap);
         return prev.filter(c => c !== id);
      } else {
         setImpactMap({...impactMap, [id]: 1});
         return [...prev, id];
      }
    });
  };

  const updateIndividualImpact = (id: string, value: number) => {
      setImpactMap(prev => {
          const newVal = Math.min(99, Math.max(1, value));
          return { ...prev, [id]: newVal };
      });
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case TaskStatus.CANCELED: return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className={`flex flex-col h-full rounded-xl border border-white/5 overflow-hidden ${isWidget ? 'bg-black/90' : ''}`}>
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          {t('任务日志', 'Task Log')}
        </h2>
        <div className="flex items-center gap-2">
            {!isWidget && (
               <button onClick={onTogglePanel} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10" title={t('收起面板', 'Collapse')}>
                  <ChevronRight size={20} />
               </button>
            )}
            {!isWidget && onDetach && (
                <button onClick={onDetach} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10" title={t('分离挂件', 'Detach')}>
                <ExternalLink size={20} />
                </button>
            )}
            <button onClick={() => setIsAdding(!isAdding)} className={`p-2 rounded-lg transition-colors ${isAdding ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}>
            {isAdding ? <X size={20} /> : <Plus size={20} />}
            </button>
        </div>
      </div>

      {isAdding && (
        <div className="p-4 bg-white/5 border-b border-white/5 animate-in slide-in-from-top-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder={t('输入任务目标...', 'Enter task goal...')} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" autoFocus />
            <div className="flex flex-col gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">{t('目标属性', 'Targets')}</label>
                    <div className="flex flex-wrap gap-2">
                        {capabilities.map(cap => (
                        <button key={cap.id} type="button" onClick={() => toggleCapSelection(cap.id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${selectedCapIds.includes(cap.id) ? 'bg-opacity-20 border-opacity-50' : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30'}`} style={{ backgroundColor: selectedCapIds.includes(cap.id) ? cap.color : 'transparent', borderColor: selectedCapIds.includes(cap.id) ? cap.color : undefined, color: selectedCapIds.includes(cap.id) ? cap.color : undefined }}>
                            {cap.name}
                        </button>
                        ))}
                    </div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                     <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1"> <Zap size={10} /> {t('经验值', 'Experience')} </label>
                        <div className="flex bg-black/40 rounded p-0.5 border border-white/10">
                            <button type="button" onClick={() => setIsAdvancedImpact(false)} className={`px-2 py-0.5 text-[10px] rounded ${!isAdvancedImpact ? 'bg-white/20 text-white' : 'text-gray-500'}`}>{t('统一', 'Uniform')}</button>
                            <button type="button" onClick={() => setIsAdvancedImpact(true)} className={`px-2 py-0.5 text-[10px] rounded ${isAdvancedImpact ? 'bg-white/20 text-white' : 'text-gray-500'}`}>{t('独立', 'Custom')}</button>
                        </div>
                     </div>
                     {!isAdvancedImpact && (
                         <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setImpact(Math.max(1, impact - 1))} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-gray-400">-</button>
                            <input 
                              type="number" 
                              value={impact} 
                              onChange={(e) => setImpact(Math.min(99, Math.max(1, parseInt(e.target.value) || 1)))}
                              className="flex-1 bg-transparent text-center font-mono font-bold text-primary text-lg focus:outline-none"
                            />
                            <button type="button" onClick={() => setImpact(Math.min(99, impact + 1))} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-gray-400">+</button>
                         </div>
                     )}
                     {isAdvancedImpact && (
                         <div className="space-y-2">
                             {selectedCapIds.length === 0 && <div className="text-xs text-gray-500 italic text-center py-2">{t('请选择属性', 'Select targets first')}</div>}
                             {selectedCapIds.map(id => {
                                 const cap = capabilities.find(c => c.id === id); if (!cap) return null; const val = impactMap[id] ?? 1;
                                 return (
                                     <div key={id} className="flex items-center gap-3">
                                         <span className="text-xs text-gray-300 w-24 truncate">{cap.name}</span>
                                         <div className="flex items-center gap-1 flex-1">
                                             <button type="button" onClick={() => updateIndividualImpact(id, val - 1)} className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-gray-400">-</button>
                                             <input 
                                                type="number" 
                                                value={val} 
                                                onChange={(e) => updateIndividualImpact(id, parseInt(e.target.value) || 1)}
                                                className="flex-1 bg-transparent text-center text-xs font-mono text-primary focus:outline-none"
                                             />
                                             <button type="button" onClick={() => updateIndividualImpact(id, val + 1)} className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-gray-400">+</button>
                                         </div>
                                     </div>
                                 )
                             })}
                         </div>
                     )}
                </div>
            </div>
            <button type="submit" disabled={!newTaskTitle.trim() || selectedCapIds.length === 0} className="w-full py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-medium rounded-lg">{t('开启任务', 'Start Task')}</button>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-10 text-gray-500"> <p>{t('暂无任务。', 'No tasks yet.')}</p> </div>
        ) : (
          sortedTasks.map(task => (
            <div key={task.id} className={`group relative p-4 rounded-xl border transition-all ${task.status === TaskStatus.TODO ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-black/20 border-transparent opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-1">{getStatusIcon(task.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                      <h3 className={`font-medium truncate ${task.status !== TaskStatus.TODO ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</h3>
                      {!task.impactMap && task.impact > 1 && ( <span className="ml-2 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-[10px] font-bold"> +{task.impact} </span> )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {task.capabilityIds.map(capId => {
                      const cap = capabilities.find(c => c.id === capId); if (!cap) return null; const val = task.impactMap?.[capId] ?? task.impact ?? 1;
                      return (
                        <span key={capId} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
                           <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cap.color }} /> {cap.name} {val > 1 && <span className="text-primary font-mono ml-0.5">+{val}</span>}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500 font-mono">
                    <span className="flex items-center gap-1"> <Calendar size={10} /> {new Date(task.createdAt).toLocaleDateString()} </span>
                    {task.completedAt && <span className="flex items-center gap-1 text-green-500/70"> <Clock size={10} /> {new Date(task.completedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} </span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {task.status === TaskStatus.TODO && (
                    <>
                      <button onClick={() => onCompleteTask(task.id)} className="p-1.5 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20"> <CheckCircle2 size={16} /> </button>
                      <button onClick={() => onCancelTask(task.id)} className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"> <XCircle size={16} /> </button>
                    </>
                  )}
                  <button onClick={() => onDeleteTask(task.id)} className="p-1.5 rounded bg-gray-500/10 text-gray-400 hover:text-white"> <Trash2 size={16} /> </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;