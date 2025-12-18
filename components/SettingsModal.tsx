import React, { useRef, useState } from 'react';
import { X, RefreshCw, Palette, Cuboid, Orbit, Network, Globe, Triangle, Upload, Eye, Languages, Layout, Image, Zap, RotateCw, BoxSelect, Circle } from 'lucide-react';
import { Capability, VisualSettings, EnvironmentType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  capabilities: Capability[];
  visualSettings: VisualSettings;
  onResetData: () => void;
  onUpdateVisuals: (settings: VisualSettings) => void;
}

type Tab = 'general' | 'environment' | 'geometry' | 'connectivity';

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, capabilities, visualSettings, onResetData, onUpdateVisuals
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;

  const t = (zh: string, en: string) => visualSettings.language === 'zh' ? zh : en;

  const updateVisual = (key: keyof VisualSettings, value: any) => {
    onUpdateVisuals({ ...visualSettings, [key]: value });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { updateVisual('backgroundImage', reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const clearBackgroundImage = () => updateVisual('backgroundImage', null);

  const tabs: {id: Tab, icon: any, label: string}[] = [
    { id: 'general', icon: <Layout size={14}/>, label: t('通用', 'General') },
    { id: 'environment', icon: <Globe size={14}/>, label: t('环境', 'World') },
    { id: 'geometry', icon: <Cuboid size={14}/>, label: t('几何', 'Geo') },
    { id: 'connectivity', icon: <Network size={14}/>, label: t('连接', 'Links') },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"> 
            <Palette size={20} className="text-primary" /> {t('全息系统配置', 'System Hologram Config')} 
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"> <X size={24} /> </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-black/20 border-b border-white/5 p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-lg transition-all ${activeTab === tab.id ? 'bg-primary/20 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
              <section className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><Languages size={12}/> {t('语言与面板', 'Interface')}</h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-300">{t('界面语言', 'Language')}</label>
                    <div className="flex gap-2">
                      <button onClick={() => updateVisual('language', 'zh')} className={`px-3 py-1 text-xs rounded-md border ${visualSettings.language === 'zh' ? 'bg-primary border-primary text-white' : 'border-white/10 text-gray-500'}`}>中文</button>
                      <button onClick={() => updateVisual('language', 'en')} className={`px-3 py-1 text-xs rounded-md border ${visualSettings.language === 'en' ? 'bg-primary border-primary text-white' : 'border-white/10 text-gray-500'}`}>English</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs text-gray-300">{t('面板透明度', 'Task Panel Opacity')}</label>
                      <span className="text-[10px] font-mono text-primary">{(visualSettings.taskPanelOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={visualSettings.taskPanelOpacity} onChange={(e) => updateVisual('taskPanelOpacity', parseFloat(e.target.value))} className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><RotateCw size={12}/> {t('动态效果', 'Animation')}</h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                   <div className="flex justify-between items-center">
                      <label className="text-xs text-gray-300">{t('全局自旋', 'Auto-Rotate Scene')}</label>
                      <input type="checkbox" checked={visualSettings.autoRotateScene} onChange={(e) => updateVisual('autoRotateScene', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                   </div>
                   <div className="flex justify-between items-center">
                      <label className="text-xs text-gray-300">{t('核心自旋', 'Auto-Rotate Core')}</label>
                      <input type="checkbox" checked={visualSettings.autoRotateCore} onChange={(e) => updateVisual('autoRotateCore', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                   </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><Eye size={12}/> {t('标签显示', 'Label Settings')}</h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                   <div className="flex justify-between items-center">
                      <label className="text-xs text-gray-300">{t('显示属性标签', 'Show Labels')}</label>
                      <input type="checkbox" checked={visualSettings.showLabels} onChange={(e) => updateVisual('showLabels', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                   </div>
                   {visualSettings.showLabels && (
                     <>
                      <div className="flex gap-1">
                        {['name', 'score', 'both'].map(mode => (
                          <button key={mode} onClick={() => updateVisual('labelContent', mode)} className={`flex-1 py-1 text-[10px] uppercase rounded border transition-colors ${visualSettings.labelContent === mode ? 'bg-primary border-primary text-white' : 'border-white/10 text-gray-500'}`}>
                            {t(mode === 'name' ? '名称' : mode === 'score' ? '数值' : '全部', mode)}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-gray-400 uppercase">{t('基础字体', 'Base Size')}</label>
                          <span className="text-[10px] font-mono text-primary">{visualSettings.labelSize}px</span>
                        </div>
                        <input type="range" min="8" max="48" step="1" value={visualSettings.labelSize} onChange={(e) => updateVisual('labelSize', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-gray-400 uppercase">{t('最小可视字体', 'Min Visual Size')}</label>
                          <span className="text-[10px] font-mono text-primary">{visualSettings.minLabelSize}px</span>
                        </div>
                        <input type="range" min="4" max="24" step="1" value={visualSettings.minLabelSize} onChange={(e) => updateVisual('minLabelSize', parseInt(e.target.value))} className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                      </div>
                     </>
                   )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'environment' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
               <section className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><Globe size={12}/> {t('环境渲染', 'World Rendering')}</h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {['stars', 'nebula', 'grid', 'matrix', 'ocean', 'none'].map((type) => (
                        <button key={type} onClick={() => updateVisual('environmentType', type)} className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase font-bold transition-all ${visualSettings.environmentType === type ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}> {type} </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">{t('空间底色', 'Space Color')}</label>
                      <input type="color" value={visualSettings.backgroundColor} onChange={(e) => updateVisual('backgroundColor', e.target.value)} className="w-full h-8 bg-transparent border-0 cursor-pointer rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500">{t('面板底色', 'Panel Color')}</label>
                      <input type="color" value={visualSettings.taskPanelColor} onChange={(e) => updateVisual('taskPanelColor', e.target.value)} className="w-full h-8 bg-transparent border-0 cursor-pointer rounded-lg" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><Image size={12}/> {t('背景壁纸', 'Wallpaper')}</h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-xl border border-dashed border-white/20 hover:border-primary text-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2 text-xs">
                    <Upload size={14} /> {t('上传自定义背景', 'Upload Image')}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  {visualSettings.backgroundImage && (
                    <button onClick={clearBackgroundImage} className="w-full py-2 text-[10px] uppercase text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20">{t('清除背景', 'Clear Image')}</button>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'geometry' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
               <section className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><Cuboid size={12}/> {t('核心构造', 'Core Structure')}</h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                   <div className="grid grid-cols-3 gap-2">
                      {['icosahedron', 'dodecahedron', 'sphere'].map(shape => (
                        <button key={shape} onClick={() => updateVisual('coreShape', shape)} className={`py-2 text-[10px] uppercase rounded-lg border font-bold ${visualSettings.coreShape === shape ? 'bg-primary border-primary text-white' : 'border-white/10 text-gray-500'}`}>
                          {t(shape === 'icosahedron' ? '二十面' : shape === 'dodecahedron' ? '十二面' : '球体', shape)}
                        </button>
                      ))}
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-300">{t('显示内球', 'Inner Core')}</label>
                        <input type="checkbox" checked={visualSettings.showCoreInner} onChange={(e) => updateVisual('showCoreInner', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-300">{t('显示外架', 'Outer Frame')}</label>
                        <input type="checkbox" checked={visualSettings.showCoreOuter} onChange={(e) => updateVisual('showCoreOuter', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <label className="text-xs text-gray-300 shrink-0">{t('核心大小', 'Radius')}</label>
                      <input type="range" min="0.5" max="3.0" step="0.1" value={visualSettings.coreRadius} onChange={(e) => updateVisual('coreRadius', parseFloat(e.target.value))} className="flex-1 accent-primary h-1 bg-white/10 rounded-lg appearance-none" />
                      <input type="color" value={visualSettings.coreColor} onChange={(e) => updateVisual('coreColor', e.target.value)} className="w-6 h-6 shrink-0 bg-transparent border-0 cursor-pointer" />
                   </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><Triangle size={12}/> {t('属性表现', 'Element Geometry')}</h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-5">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-gray-300 uppercase tracking-tight">{t('柱体形状', 'Bar Shape')}</label>
                        <div className="flex gap-1">
                          {['cylinder', 'cone', 'prism'].map(shape => (
                            <button key={shape} onClick={() => updateVisual('barShape', shape)} className={`px-2 py-1 text-[10px] uppercase rounded border ${visualSettings.barShape === shape ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-gray-500'}`}>
                              {t(shape === 'cylinder' ? '圆柱' : shape === 'cone' ? '圆锥' : '棱柱', shape)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-[10px] text-gray-500 uppercase">{t('柱体粗细', 'Bar Thickness')}</label>
                          <span className="text-[10px] font-mono text-primary">{visualSettings.barThickness.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0.01" max="0.5" step="0.01" value={visualSettings.barThickness} onChange={(e) => updateVisual('barThickness', parseFloat(e.target.value))} className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <label className="text-[10px] text-gray-500 uppercase">{t('基础长度', 'Base Length')}</label>
                          <span className="text-[10px] font-mono text-primary">{visualSettings.barBaseLength.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0.1" max="5.0" step="0.1" value={visualSettings.barBaseLength} onChange={(e) => updateVisual('barBaseLength', parseFloat(e.target.value))} className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                             <label className="text-[10px] text-gray-500 uppercase">{t('长度比例', 'Score Multiplier')}</label>
                          </div>
                          <span className="text-[10px] font-mono text-primary">{visualSettings.scoreScale.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0.1" max="1.5" step="0.1" value={visualSettings.scoreScale} onChange={(e) => updateVisual('scoreScale', parseFloat(e.target.value))} className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                      </div>
                   </div>
                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-gray-500 uppercase">{t('节点形状', 'Tip Shape')}</label>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                          {['sphere', 'cube', 'octahedron', 'dodecahedron', 'none'].map(shape => (
                            <button key={shape} onClick={() => updateVisual('tipShape', shape)} className={`px-2 py-1 text-[10px] uppercase rounded border ${visualSettings.tipShape === shape ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-gray-500'}`}>
                              {t(shape === 'sphere' ? '球' : shape === 'cube' ? '方' : shape === 'octahedron' ? '菱' : shape === 'dodecahedron' ? '多' : '无', shape === 'none' ? 'None' : shape)}
                            </button>
                          ))}
                        </div>
                      </div>
                      {visualSettings.tipShape !== 'none' && (
                        <div className="space-y-2 animate-in fade-in">
                          <div className="flex justify-between">
                            <label className="text-[10px] text-gray-500 uppercase">{t('节点大小', 'Tip Size')}</label>
                            <span className="text-[10px] font-mono text-primary">{visualSettings.tipSize.toFixed(2)}</span>
                          </div>
                          <input type="range" min="0.05" max="1.0" step="0.05" value={visualSettings.tipSize} onChange={(e) => updateVisual('tipSize', parseFloat(e.target.value))} className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                        </div>
                      )}
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'connectivity' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
               <section className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><Network size={12}/> {t('连接逻辑', 'Link Style')}</h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {['none', 'straight', 'curve-in', 'curve-out'].map(style => (
                        <button key={style} onClick={() => updateVisual('connectionStyle', style)} className={`px-2.5 py-1.5 rounded-lg border text-[10px] uppercase font-bold transition-all ${visualSettings.connectionStyle === style ? 'bg-primary border-primary text-white' : 'border-white/10 text-gray-500'}`}>
                          {t(style === 'none' ? '无' : style === 'straight' ? '直线' : style === 'curve-in' ? '内凹' : '外凸', style)}
                        </button>
                    ))}
                  </div>
                  {visualSettings.connectionStyle !== 'none' && (
                    <div className="flex items-center gap-4 animate-in fade-in">
                       <label className="text-xs text-gray-300 shrink-0">{t('线条粗细', 'Weight')}</label>
                       <input type="range" min="0.5" max="8" step="0.5" value={visualSettings.connectionThickness} onChange={(e) => updateVisual('connectionThickness', parseFloat(e.target.value))} className="flex-1 accent-primary h-1 bg-white/10 rounded-lg appearance-none" />
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><BoxSelect size={12}/> {t('容积填充', 'Mesh Fill')}</h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                   <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-300">{t('开启面填充', 'Enable Surface Fill')}</label>
                      <input type="checkbox" checked={visualSettings.fillMesh} onChange={(e) => updateVisual('fillMesh', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                   </div>
                   {visualSettings.fillMesh && (
                     <div className="space-y-4 pl-4 border-l border-white/10 animate-in fade-in">
                        <div className="flex gap-1">
                           {['solid', 'gradient', 'core'].map(mode => (
                             <button key={mode} onClick={() => updateVisual('fillColorMode', mode)} className={`flex-1 py-1 text-[10px] uppercase rounded border ${visualSettings.fillColorMode === mode ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-gray-500'}`}>
                                {t(mode === 'solid' ? '纯色' : mode === 'gradient' ? '渐变' : '核心', mode)}
                             </button>
                           ))}
                        </div>
                        {visualSettings.fillColorMode === 'solid' && (
                          <div className="flex items-center justify-between animate-in slide-in-from-top-2">
                             <label className="text-[10px] text-gray-500 uppercase">{t('填充颜色', 'Solid Color')}</label>
                             <input type="color" value={visualSettings.fillSolidColor} onChange={(e) => updateVisual('fillSolidColor', e.target.value)} className="w-8 h-8 bg-transparent border-0 cursor-pointer" />
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                           <label className="text-[10px] text-gray-500 uppercase shrink-0">{t('不透明度', 'Opacity')}</label>
                           <input type="range" min="0.05" max="1.0" step="0.01" value={visualSettings.fillOpacity} onChange={(e) => updateVisual('fillOpacity', parseFloat(e.target.value))} className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none" />
                        </div>
                     </div>
                   )}
                </div>
              </section>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex gap-4">
          <button 
            onClick={() => { if(window.confirm(t("确定重置？这将删除所有任务和能力记录。", "Reset system? This wipes all progress."))) { onResetData(); onClose(); } }} 
            className="flex-1 py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all"
          > 
            <RefreshCw size={12} className="inline mr-2 mb-0.5" /> {t('恢复出厂设置', 'Factory Reset')} 
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-2 bg-white text-black hover:bg-gray-200 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all"
          >
            {t('确认', 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;