import React, { useState, useMemo, useRef } from 'react';
import { Plus, X, ChevronRight, Trash2, Sparkles, Calendar as CalendarIcon, List, ArrowLeft, ArrowRight, CheckCircle2, Circle, Layers, BarChart3, Menu, Download, Upload, Database, RotateCcw } from 'lucide-react';
import { Capability, Task, TaskStatus, VisualSettings } from '../types';

interface CapabilityManagerProps {
  capabilities: Capability[];
  tasks: Task[];
  onAddCapability: (name: string, color: string, description: string, criteria: string) => void;
  onRemoveCapability: (id: string) => void;
  language: 'en' | 'zh';
  visualSettings: VisualSettings;
  onImportData: (data: { tasks: Task[], capabilities: Capability[], visuals: VisualSettings }) => void;
  onResetAll: () => void;
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
  '#f43f5e', '#8b5cf6', '#10b981', '#14b8a6', '#6366f1', '#d946ef'
];

const PRESETS_EN = [
  { name: 'Strength', color: '#ef4444', description: 'Power and endurance.', criteria: 'Physical training.' },
  { name: 'Intellect', color: '#3b82f6', description: 'Mental acuity.', criteria: 'Reading or learning.' },
  { name: 'Creativity', color: '#a855f7', description: 'Innovation and art.', criteria: 'Creating artifacts.' },
  { name: 'Willpower', color: '#eab308', description: 'Consistency.', criteria: 'Routines.' },
  { name: 'Social', color: '#22c55e', description: 'Networking.', criteria: 'Conversations.' }
];

const PRESETS_ZH = [
  { name: '力量', color: '#ef4444', description: '身体素质与生命力。', criteria: '体能训练。' },
  { name: '智力', color: '#3b82f6', description: '知识水平与解决能力。', criteria: '学习或阅读。' },
  { name: '创造', color: '#a855f7', description: '艺术表现与创新。', criteria: '制作或脑暴。' },
  { name: '意志', color: '#eab308', description: '一致性与常规维护。', criteria: '遵守计划表。' },
  { name: '社交', color: '#22c55e', description: '人际网络与情感智力。', criteria: '社交活动。' }
];

type ViewMode = 'week' | 'month' | 'year';
type FilterMode = 'completed' | 'created';
type ActivePanel = 'none' | 'calendar' | 'skills' | 'data';

const CapabilityManager: React.FC<CapabilityManagerProps> = ({ 
  capabilities, tasks, onAddCapability, onRemoveCapability, language, visualSettings, onImportData, onResetAll 
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [skillSubTab, setSkillSubTab] = useState<'custom' | 'presets'>('presets');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newDesc, setNewDesc] = useState('');
  const [newCriteria, setNewCriteria] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterMode, setFilterMode] = useState<FilterMode>('completed');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;

  const toggleMenu = () => {
    if (activePanel !== 'none') {
      setActivePanel('none');
    } else {
      setMenuOpen(!menuOpen);
    }
  };

  const openPanel = (panel: ActivePanel) => {
    setActivePanel(panel);
    setMenuOpen(false);
  };

  const checkDateMatch = (task: Task, date: Date, mode: FilterMode) => {
      const targetDate = mode === 'completed' ? (task.completedAt ? new Date(task.completedAt) : null) : new Date(task.createdAt);
      if (!targetDate) return false;
      return targetDate.getDate() === date.getDate() && targetDate.getMonth() === date.getMonth() && targetDate.getFullYear() === date.getFullYear();
  };

  const getTasksForDate = (date: Date) => tasks.filter(task => checkDateMatch(task, date, filterMode));

  const stats = useMemo(() => {
      const year = currentDate.getFullYear(); const month = currentDate.getMonth();
      const monthTasks = tasks.filter(t => {
          const d = filterMode === 'completed' ? (t.completedAt ? new Date(t.completedAt) : null) : new Date(t.createdAt);
          return d && d.getMonth() === month && d.getFullYear() === year;
      });
      const curr = new Date(currentDate); const firstDayOfWeek = curr.getDate() - curr.getDay(); 
      const weekStart = new Date(curr.getFullYear(), curr.getMonth(), firstDayOfWeek);
      const weekEnd = new Date(curr.getFullYear(), curr.getMonth(), firstDayOfWeek + 6);
      weekStart.setHours(0,0,0,0); weekEnd.setHours(23,59,59,999);
      const weekTasks = tasks.filter(t => {
          const d = filterMode === 'completed' ? (t.completedAt ? new Date(t.completedAt) : null) : new Date(t.createdAt);
          return d && d >= weekStart && d <= weekEnd;
      });
      return { monthTotal: monthTasks.length, weekTotal: weekTasks.length };
  }, [tasks, currentDate, filterMode]);

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const l = language === 'zh' ? 'zh-CN' : 'en-US';
    if (viewMode === 'month') {
        const days = []; const start = new Date(year, month, 1).getDay();
        for(let i=0; i<start; i++) days.push(null);
        for(let i=1; i<=new Date(year, month + 1, 0).getDate(); i++) {
            const d = new Date(year, month, i); days.push({ date: d, tasks: getTasksForDate(d) });
        }
        return { type: 'month', days, label: currentDate.toLocaleDateString(l, { month: 'long', year: 'numeric' }) };
    } 
    else if (viewMode === 'week') {
        const curr = new Date(currentDate); const first = curr.getDate() - curr.getDay(); 
        const days = [];
        for(let i=0; i<7; i++) {
            const fresh = new Date(currentDate); fresh.setDate(first + i);
            days.push({ date: fresh, tasks: getTasksForDate(fresh) });
        }
        return { type: 'week', days, label: `${days[0].date.toLocaleDateString(l, { month: 'short', day: 'numeric' })} - ${days[6].date.toLocaleDateString(l, { month: 'short', day: 'numeric' })}` };
    }
    else {
        const months = [];
        for(let i=0; i<12; i++) {
            const count = tasks.filter(t => {
                 const target = filterMode === 'completed' ? (t.completedAt ? new Date(t.completedAt) : null) : new Date(t.createdAt);
                 return target && target.getMonth() === i && target.getFullYear() === year;
            }).length;
            months.push({ date: new Date(year, i, 1), count });
        }
        return { type: 'year', months, label: t(`${year}年`, `${year}`) };
    }
  }, [currentDate, viewMode, filterMode, tasks, language]);

  const displayedTasks = useMemo(() => selectedDate ? getTasksForDate(selectedDate) : [], [selectedDate, filterMode, tasks]);
  const navigateDate = (dir: number) => {
      const newDate = new Date(currentDate);
      if (viewMode === 'week') newDate.setDate(newDate.getDate() + (dir * 7));
      if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + dir);
      if (viewMode === 'year') newDate.setFullYear(newDate.getFullYear() + dir);
      setCurrentDate(newDate);
  };

  const handleAddSkill = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (newName.trim()) { onAddCapability(newName, newColor, newDesc, newCriteria); setNewName(''); setIsAddingSkill(false); }
  };

  const applyPreset = (preset: typeof PRESETS_ZH[0]) => {
    setNewName(preset.name); setNewColor(preset.color); setNewDesc(preset.description); setNewCriteria(preset.criteria); setSkillSubTab('custom');
  };

  const handleExport = () => {
      const data = {
          tasks,
          capabilities,
          visuals: visualSettings,
          exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `holoskill_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (data.tasks && data.capabilities && data.visuals) {
                  if (window.confirm(t('导入将覆盖当前所有数据，是否继续？', 'Import will overwrite current data. Continue?'))) {
                    onImportData(data);
                    alert(t('导入成功！', 'Import Successful!'));
                  }
              } else {
                  alert(t('无效的数据格式', 'Invalid data format'));
              }
          } catch (err) {
              alert(t('解析文件失败', 'Failed to parse file'));
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  return (
    <div className={`fixed right-6 bottom-6 z-50 flex flex-col items-end`}>
      {activePanel === 'calendar' && (
        <div className="bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 h-[650px] w-[360px] animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
             <div className="p-4 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center gap-2"> <CalendarIcon size={18} className="text-primary"/> <span>{t('任务历史回放', 'Task History')}</span> </h3>
                    <button onClick={() => setActivePanel('none')} className="p-1 rounded-full hover:bg-white/10 text-gray-400"> <X size={18} /> </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{t('本月记录', 'Month Stats')}</span>
                        <div className="flex items-end gap-2"> <span className="text-2xl font-bold text-white">{stats.monthTotal}</span> <span className="text-[10px] text-gray-500">{t('项任务', 'Tasks')}</span> </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{t('本周记录', 'Week Stats')}</span>
                        <div className="flex items-end gap-2"> <span className="text-2xl font-bold text-white">{stats.weekTotal}</span> <span className="text-[10px] text-gray-500">{t('项任务', 'Tasks')}</span> </div>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                     <div className="flex bg-black/40 rounded p-0.5 border border-white/10">
                        {(['week', 'month', 'year'] as ViewMode[]).map(m => ( <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1 text-[10px] uppercase rounded font-medium ${viewMode === m ? 'bg-primary text-white' : 'text-gray-500'}`}> {m === 'week' ? t('周', 'W') : m === 'month' ? t('月', 'M') : t('年', 'Y')} </button> ))}
                    </div>
                    <button onClick={() => setFilterMode(filterMode === 'completed' ? 'created' : 'completed')} className={`px-2 py-1.5 border rounded text-[10px] uppercase font-medium flex items-center gap-1.5 ${filterMode === 'completed' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                        {filterMode === 'completed' ? <CheckCircle2 size={12} /> : <Plus size={12} />} {filterMode === 'completed' ? t('完成', 'Done') : t('创建', 'New')}
                    </button>
                </div>
             </div>
             <div className="px-4 py-2 flex items-center justify-between border-b border-white/5 bg-black/20">
                <button onClick={() => navigateDate(-1)} className="p-1 hover:bg-white/10 rounded text-gray-400"> <ArrowLeft size={16}/> </button>
                <span className="font-mono font-bold text-white text-sm">{calendarData.label}</span>
                <button onClick={() => navigateDate(1)} className="p-1 hover:bg-white/10 rounded text-gray-400"> <ArrowRight size={16}/> </button>
             </div>
             <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-black/10">
                {viewMode === 'year' ? (
                    <div className="grid grid-cols-3 gap-2">
                        {(calendarData.months as any[]).map((m: any, i: number) => (
                            <button key={i} onClick={() => { const d = new Date(currentDate); d.setMonth(i); setCurrentDate(d); setViewMode('month'); }} className="aspect-square rounded border border-white/5 bg-white/5 flex flex-col items-center justify-center gap-1">
                                <span className="text-xs font-bold text-gray-300">{t(`${i+1}月`, m.date.toLocaleDateString('en-US', {month:'short'}))}</span>
                                {m.count > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full">{m.count}</span>}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div>
                        <div className="grid grid-cols-7 text-center mb-2"> { (language === 'zh' ? ['日','一','二','三','四','五','六'] : ['S','M','T','W','T','F','S']).map((d,i) => ( <div key={i} className="text-[10px] text-gray-600 font-bold">{d}</div> )) } </div>
                        <div className="grid grid-cols-7 gap-1">
                            {(calendarData.days as any[]).map((day: any, i: number) => {
                                if (!day) return <div key={i} />;
                                const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                                return ( <button key={i} onClick={() => setSelectedDate(day.date)} className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${isSelected ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'}`}> <span className="text-xs font-medium relative z-10">{day.date.getDate()}</span> {day.tasks.length > 0 && <div className="absolute inset-0 flex items-center justify-center opacity-30"><div className="w-4 h-4 rounded-full bg-white/20 blur-sm"></div></div>} </button> )
                            })}
                        </div>
                    </div>
                )}
             </div>
             <div className="h-48 border-t border-white/10 bg-black/30 overflow-y-auto custom-scrollbar p-3">
                <div className="flex items-center justify-between mb-2"> <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"> <List size={12} /> {selectedDate ? selectedDate.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US') : t('请选择日期', 'Select Date')} </h4> </div>
                <div className="space-y-2">
                     {displayedTasks.length === 0 ? <div className="text-center text-gray-600 text-xs py-4">{t('当日无记录。', 'No records.')}</div> : displayedTasks.map(task => ( <div key={task.id} className="p-2 bg-white/5 rounded border border-white/5 flex items-start gap-2"> <div className="mt-0.5">{task.status === TaskStatus.COMPLETED ? <CheckCircle2 size={12} className="text-green-500"/> : <Circle size={12} className="text-gray-500"/>}</div> <div className="flex-1 min-w-0 text-xs text-white truncate">{task.title}</div> </div> ))}
                </div>
             </div>
        </div>
      )}

      {activePanel === 'skills' && (
        <div className="bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 h-[500px] w-[340px] animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
             <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between"> <h3 className="text-white font-bold flex items-center gap-2"> <Sparkles size={18} className="text-secondary"/> <span>{t('能力属性矩阵', 'Capability Matrix')}</span> </h3> <button onClick={() => setActivePanel('none')} className="p-1 rounded-full text-gray-400"> <X size={18} /> </button> </div>
             <div className="flex-1 overflow-y-auto p-3">
                <div className="flex justify-between items-center mb-4"> <h4 className="text-xs font-bold text-gray-400 uppercase">{t('已定义技能', 'Skills')}</h4> <button onClick={() => setIsAddingSkill(!isAddingSkill)} className={`p-1.5 rounded ${isAddingSkill ? 'bg-red-500/20 text-red-400' : 'bg-secondary/20 text-secondary'}`}> {isAddingSkill ? <X size={14} /> : <Plus size={14} />} </button> </div>
                {isAddingSkill && (
                    <div className="mb-4 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                         <div className="flex border-b border-white/5"> <button onClick={() => setSkillSubTab('presets')} className={`flex-1 py-2 text-xs ${skillSubTab === 'presets' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>{t('预设', 'Presets')}</button> <button onClick={() => setSkillSubTab('custom')} className={`flex-1 py-2 text-xs ${skillSubTab === 'custom' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>{t('自定义', 'Custom')}</button> </div>
                         <div className="p-3 space-y-3"> {skillSubTab === 'presets' ? ( <div className="grid grid-cols-1 gap-2"> {(language === 'zh' ? PRESETS_ZH : PRESETS_EN).map(preset => ( <button key={preset.name} onClick={() => applyPreset(preset)} className="flex items-center gap-3 p-2 rounded bg-black/20 text-left group"> <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${preset.color}20` }}> <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }} /> </div> <div className="text-xs font-medium text-white">{preset.name}</div> </button> ))} </div> ) : ( <form onSubmit={handleAddSkill} className="space-y-3"> <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white" placeholder={t('名称...', 'Name...')} /> <div className="flex gap-1 flex-wrap"> {COLORS.map(c => ( <button key={c} type="button" onClick={() => setNewColor(c)} className={`w-4 h-4 rounded-full border ${newColor === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} /> ))} </div> <button type="submit" className="w-full bg-secondary text-white py-2 rounded text-xs font-bold uppercase">{t('添加', 'Add')}</button> </form> )} </div>
                    </div>
                )}
                <div className="space-y-2"> {capabilities.map(cap => ( <div key={cap.id} className="bg-white/5 rounded-lg border border-white/5 p-3 flex items-center justify-between"> <div className="flex items-center gap-3"> <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: cap.color }} /> <div> <div className="font-medium text-xs text-white">{cap.name}</div> <div className="text-[10px] text-gray-500 font-mono">{t('等级', 'Lvl')} {cap.score}</div> </div> </div> <button onClick={() => onRemoveCapability(cap.id)} className="text-gray-600 hover:text-red-500 p-1"><Trash2 size={12} /></button> </div> ))} </div>
             </div>
        </div>
      )}

      {activePanel === 'data' && (
        <div className="bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 w-[300px] animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
             <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between"> <h3 className="text-white font-bold flex items-center gap-2"> <Database size={18} className="text-green-500"/> <span>{t('数据管理', 'Data Center')}</span> </h3> <button onClick={() => setActivePanel('none')} className="p-1 rounded-full text-gray-400"> <X size={18} /> </button> </div>
             <div className="p-4 space-y-4">
                  <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t('系统备份', 'Backup & Restore')}</p>
                      <button onClick={handleExport} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group">
                          <span className="text-xs text-gray-300">{t('导出 JSON', 'Export JSON')}</span>
                          <Download size={16} className="text-primary group-hover:scale-110 transition-transform" />
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group">
                          <span className="text-xs text-gray-300">{t('导入 JSON', 'Import JSON')}</span>
                          <Upload size={16} className="text-green-500 group-hover:scale-110 transition-transform" />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 space-y-2">
                      <p className="text-[10px] text-red-500 uppercase tracking-widest">{t('危险区域', 'Danger Zone')}</p>
                      <button onClick={() => { if(window.confirm(t('确定重置所有数据？此操作不可撤销。', 'Reset all data? This cannot be undone.'))) onResetAll(); }} className="w-full flex items-center justify-between px-4 py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all group">
                          <span className="text-xs text-red-500">{t('重置所有数据', 'Wipe All Data')}</span>
                          <RotateCcw size={16} className="text-red-500 group-hover:rotate-180 transition-transform duration-500" />
                      </button>
                  </div>
             </div>
        </div>
      )}

      <div className="relative flex flex-col items-center gap-4">
          {menuOpen && activePanel === 'none' && (
              <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-5 duration-200">
                  <div className="flex items-center gap-3"> <span className="bg-black/60 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md">{t('数据', 'Data')}</span> <button onClick={() => openPanel('data')} className="w-10 h-10 rounded-full bg-[#18181b] border border-white/20 text-green-500 flex items-center justify-center transition-all hover:scale-110"> <Database size={18} /> </button> </div>
                  <div className="flex items-center gap-3"> <span className="bg-black/60 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md">{t('日历', 'Calendar')}</span> <button onClick={() => openPanel('calendar')} className="w-10 h-10 rounded-full bg-[#18181b] border border-white/20 text-primary flex items-center justify-center transition-all hover:scale-110"> <BarChart3 size={18} /> </button> </div>
                  <div className="flex items-center gap-3"> <span className="bg-black/60 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md">{t('技能', 'Skills')}</span> <button onClick={() => openPanel('skills')} className="w-10 h-10 rounded-full bg-[#18181b] border border-white/20 text-secondary flex items-center justify-center transition-all hover:scale-110"> <Layers size={18} /> </button> </div>
              </div>
          )}
          <button onClick={toggleMenu} className={`w-14 h-14 flex items-center justify-center border rounded-full text-white shadow-2xl transition-all hover:scale-105 z-50 ${activePanel !== 'none' || menuOpen ? 'bg-white text-black border-white' : 'bg-surface/80 border-white/20'}`}> {activePanel !== 'none' || menuOpen ? <X size={24} /> : <Menu size={24} />} </button>
      </div>
    </div>
  );
};

export default CapabilityManager;