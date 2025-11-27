
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Script, TeleprompterSettings } from '../types';
import { saveScript } from '../services/storageService';
import Webcam from 'react-webcam';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  ArrowRight,
  ArrowLeft, 
  Video as VideoIcon, 
  VideoOff, 
  Type, 
  Move, 
  FlipHorizontal, 
  PictureInPicture2,
  Sun,
  Moon,
  AlignJustify,
  Palette,
  Layout,
  RefreshCcw,
  X,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';

interface Props {
  script: Script;
  onExit: () => void;
}

const FONTS = [
  { id: 'Vazirmatn', name: 'Vazirmatn (FA)' },
  { id: 'Lalezar', name: 'Lalezar (FA Headline)' },
  { id: 'Poppins', name: 'Poppins (EN)' },
  { id: 'Tahoma', name: 'Tahoma' },
  { id: 'Arial', name: 'Arial' },
];

const Teleprompter: React.FC<Props> = ({ script, onExit }) => {
  const { t, dir } = useLocalization();
  const [settings, setSettings] = useState<TeleprompterSettings>({
    scrollSpeed: script.lastUsedSettings?.scrollSpeed ?? 25,
    fontSize: script.lastUsedSettings?.fontSize ?? 48,
    isMirrored: script.lastUsedSettings?.isMirrored ?? false,
    isDarkMode: script.lastUsedSettings?.isDarkMode ?? true,
    padding: script.lastUsedSettings?.padding ?? 15,
    presenterMode: script.lastUsedSettings?.presenterMode ?? true,
    lineHeight: script.lastUsedSettings?.lineHeight ?? 1.8,
    fontFamily: script.lastUsedSettings?.fontFamily ?? 'Vazirmatn',
    customBackgroundColor: script.lastUsedSettings?.customBackgroundColor ?? '',
    customTextColor: script.lastUsedSettings?.customTextColor ?? '',
    cameraBrightness: script.lastUsedSettings?.cameraBrightness ?? 100,
    cameraContrast: script.lastUsedSettings?.cameraContrast ?? 100,
    cameraZoom: script.lastUsedSettings?.cameraZoom ?? 1,
    cameraMirrored: script.lastUsedSettings?.cameraMirrored ?? true,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'visual' | 'text' | 'color' | 'camera'>('visual');
  const [showCamera, setShowCamera] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Scrolling Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Content
  const [content, setContent] = useState(script.content);

  // Auto-save settings
  useEffect(() => {
    const timer = setTimeout(() => {
      saveScript({
        ...script,
        lastUsedSettings: settings
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [settings, script.id]);

  // Timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine effective colors
  const bgColor = settings.customBackgroundColor || (settings.isDarkMode ? '#0f172a' : '#f8fafc');
  const textColor = settings.customTextColor || (settings.isDarkMode ? '#f1f5f9' : '#0f172a');

  // Scroll Logic
  const animateScroll = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    
    if (scrollContainerRef.current && isPlaying) {
      // Speed calculation
      const pixelMove = (settings.scrollSpeed / 10) * (delta / 16); 
      scrollContainerRef.current.scrollTop += pixelMove;
      
      // Auto stop at end
      if (scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >= scrollContainerRef.current.scrollHeight - 10) {
        setIsPlaying(false);
      }
    }
    
    lastTimeRef.current = time;
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animateScroll);
    }
  }, [isPlaying, settings.scrollSpeed]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animateScroll);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, animateScroll]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const resetScroll = () => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    setIsPlaying(false);
    setElapsedTime(0);
  };

  const handleResetSettings = () => {
    setSettings({
        scrollSpeed: 25,
        fontSize: 48,
        isMirrored: false,
        isDarkMode: true,
        padding: 15,
        presenterMode: true,
        lineHeight: 1.8,
        fontFamily: 'Vazirmatn',
        customBackgroundColor: '',
        customTextColor: '',
        cameraBrightness: 100,
        cameraContrast: 100,
        cameraZoom: 1,
        cameraMirrored: true,
    });
  };

  // Floating Window (Document Picture-in-Picture)
  const togglePiP = async () => {
    if (window.self !== window.top) {
      alert(t('teleprompter.pip_iframe_error'));
      return;
    }

    if ('documentPictureInPicture' in window) {
      try {
        const dpip = (window as any).documentPictureInPicture;
        
        if (dpip.window) {
          dpip.window.close();
          return;
        }

        const pipWindow = await dpip.requestWindow({
          width: 500,
          height: 600,
        });

        const styles = Array.from(document.styleSheets)
          .map((styleSheet) => {
            try { return Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join(""); } catch (e) { return ""; }
          }).join("");
        
        const styleEl = document.createElement("style");
        styleEl.textContent = styles + `
          body { 
            background: ${bgColor} !important; 
            color: ${textColor} !important; 
            display: flex; 
            flex-direction: column;
            overflow: hidden; 
            font-family: '${settings.fontFamily}', sans-serif;
            direction: ${dir};
            margin: 0;
          }
          .pip-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            font-size: ${settings.fontSize}px;
            text-align: center;
            white-space: pre-wrap;
            scrollbar-width: none;
            line-height: ${settings.lineHeight};
          }
          ::-webkit-scrollbar { display: none; }
          .controls {
            display: flex;
            justify-content: center;
            gap: 20px;
            padding: 10px;
            background: rgba(0,0,0,0.2);
            border-top: 1px solid rgba(255,255,255,0.1);
          }
          button {
            background: none;
            border: 1px solid rgba(128,128,128,0.5);
            color: inherit;
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
          }
        `;
        pipWindow.document.head.appendChild(styleEl);

        const container = document.createElement('div');
        container.className = 'pip-container';
        container.textContent = content;
        
        let pipReqId: number;
        let pipLastTime = 0;
        
        const animatePiP = (time: number) => {
           if (!pipLastTime) pipLastTime = time;
           const delta = time - pipLastTime;
           if (isPlaying) {
             const move = (settings.scrollSpeed / 10) * (delta / 16);
             container.scrollTop += move;
           }
           pipLastTime = time;
           pipReqId = pipWindow.requestAnimationFrame(animatePiP);
        };

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'controls';
        
        const playBtn = document.createElement('button');
        playBtn.innerText = isPlaying ? 'Stop' : 'Play';
        playBtn.onclick = () => {
          setIsPlaying(!isPlaying);
          playBtn.innerText = playBtn.innerText === 'Play' ? 'Stop' : 'Play';
        };

        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Close';
        closeBtn.onclick = () => pipWindow.close();

        controlsDiv.appendChild(playBtn);
        controlsDiv.appendChild(closeBtn);

        pipWindow.document.body.appendChild(container);
        pipWindow.document.body.appendChild(controlsDiv);

        pipReqId = pipWindow.requestAnimationFrame(animatePiP);

        pipWindow.addEventListener('pagehide', () => {
             cancelAnimationFrame(pipReqId);
             setIsPlaying(false);
        });

      } catch (error) {
        console.error("PiP failed:", error);
      }
    } else {
      alert(t('teleprompter.pip_unsupported_error'));
    }
  };

  return (
    <div 
      className={`w-full h-full relative flex flex-col transition-colors duration-500 ${showCamera ? 'ring-4 ring-inset ring-red-500/20' : ''}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      
      {/* Top Bar */}
      <div className={`flex justify-between items-center p-4 backdrop-blur-md z-20 border-b absolute top-0 w-full transition-colors ${settings.isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-slate-50/50 border-black/10'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onExit} className={`p-2 rounded-full transition-colors ${settings.isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
             {dir === 'rtl' ? <ArrowRight /> : <ArrowLeft />}
          </button>
          <div className="flex flex-col">
            <h2 className="font-bold text-lg" style={{ fontFamily: 'Lalezar, Poppins, cursive' }}>{script.title}</h2>
            <span className="text-xs opacity-60 font-mono">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={togglePiP}
            className="p-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-full transition-colors"
            title={t('teleprompter.pip')}
          >
            <PictureInPicture2 size={20} />
          </button>
          
          <button 
            onClick={() => setShowCamera(!showCamera)}
            className={`p-3 rounded-full transition-colors ${showCamera ? 'bg-red-500/20 text-red-500' : (settings.isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20')}`}
          >
             {showCamera ? <VideoIcon size={20} /> : <VideoOff size={20} />}
          </button>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-full transition-colors ${settings.isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 overflow-hidden">
        
        {/* Camera Overlay */}
        {showCamera && (
          <div className="absolute inset-0 z-0 opacity-50 pointer-events-none overflow-hidden">
             <div style={{
                 width: '100%',
                 height: '100%',
                 filter: `brightness(${settings.cameraBrightness ?? 100}%) contrast(${settings.cameraContrast ?? 100}%)`,
                 transform: `scale(${settings.cameraZoom ?? 1})`,
                 transformOrigin: 'center center',
                 transition: 'all 0.2s ease-out'
             }}>
                <Webcam 
                  audio={false}
                  className="w-full h-full object-cover"
                  mirrored={settings.cameraMirrored ?? true}
                />
            </div>
          </div>
        )}

        {/* Camera Active Indicator Badge */}
        {showCamera && (
            <div className={`absolute top-24 ${dir === 'rtl' ? 'left-6' : 'right-6'} z-10 pointer-events-none animate-in fade-in zoom-in duration-300`}>
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/50 shadow-lg">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">{t('teleprompter.camera_indicator')}</span>
                </div>
            </div>
        )}

        {/* Scroll Area */}
        <div 
          ref={scrollContainerRef}
          className={`w-full h-full overflow-y-auto no-scrollbar relative z-10 px-[10%] ${settings.isMirrored ? 'scale-x-[-1]' : ''}`}
          style={{ 
            paddingTop: '40vh', 
            paddingBottom: '40vh',
          }}
        >
          <p 
            className="text-center font-bold whitespace-pre-wrap transition-all duration-300"
            style={{ 
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              fontFamily: settings.fontFamily,
              paddingLeft: `${settings.padding}%`,
              paddingRight: `${settings.padding}%`
            }}
          >
            {content}
          </p>
        </div>

        {/* Center Guide Line */}
        <div className="absolute top-1/2 left-0 w-full flex items-center justify-between pointer-events-none z-20 opacity-30">
          <div className="h-[2px] bg-red-500 flex-1" />
          <div className="bg-red-500 text-black text-[10px] px-2 rounded-full font-bold mx-2">READ HERE</div>
          <div className="h-[2px] bg-red-500 flex-1" />
        </div>
      </div>

      {/* Floating Controls (Bottom) */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30 backdrop-blur-xl px-8 py-4 rounded-full border shadow-2xl ${settings.isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-slate-50/80 border-black/10'}`}>
        <button 
          onClick={resetScroll}
          className={`p-3 transition-colors ${settings.isDarkMode ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <RotateCcw size={24} />
        </button>
        
        <button 
          onClick={togglePlay}
          className={`w-16 h-16 flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${isPlaying ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}
        >
          {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex flex-col items-center gap-1 w-32">
            <div className="flex justify-between w-full text-[10px] font-bold uppercase">
                <span className={`${settings.isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>{t('teleprompter.speed')}</span>
                <span className={`${settings.isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{settings.scrollSpeed}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={settings.scrollSpeed} 
              onChange={(e) => setSettings({...settings, scrollSpeed: parseInt(e.target.value)})}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all ${settings.isDarkMode ? 'bg-white/20' : 'bg-black/20'}`}
            />
        </div>
      </div>

      {/* Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ x: dir === 'rtl' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: dir === 'rtl' ? '-100%' : '100%' }}
            className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} top-0 bottom-0 w-80 md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-40 shadow-2xl flex flex-col`}
          >
             {/* Drawer Header */}
             <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <Settings size={20} className="text-blue-400"/>
                   {t('teleprompter.settings_title')}
                </h3>
                <div className="flex items-center gap-2">
                   <button onClick={handleResetSettings} className="p-2 text-white/50 hover:text-red-400 transition-colors" title={t('teleprompter.reset')}>
                      <RefreshCcw size={18} />
                   </button>
                   <button onClick={() => setShowSettings(false)} className="p-2 text-white/50 hover:text-white transition-colors">
                      <X size={24} />
                   </button>
                </div>
             </div>

             {/* Tabs */}
             <div className="flex border-b border-white/10">
                <button 
                  onClick={() => setSettingsTab('visual')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${settingsTab === 'visual' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                  <div className="flex flex-col items-center gap-1">
                     <Layout size={18} />
                     {t('teleprompter.tabs.visual')}
                  </div>
                </button>
                <button 
                  onClick={() => setSettingsTab('text')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${settingsTab === 'text' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                  <div className="flex flex-col items-center gap-1">
                     <Type size={18} />
                     {t('teleprompter.tabs.text')}
                  </div>
                </button>
                <button 
                  onClick={() => setSettingsTab('color')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${settingsTab === 'color' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                   <div className="flex flex-col items-center gap-1">
                     <Palette size={18} />
                     {t('teleprompter.tabs.color')}
                  </div>
                </button>
                <button 
                  onClick={() => setSettingsTab('camera')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${settingsTab === 'camera' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                   <div className="flex flex-col items-center gap-1">
                     <Camera size={18} />
                     {t('teleprompter.tabs.camera')}
                  </div>
                </button>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* Visual Settings */}
                {settingsTab === 'visual' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                     <div className="space-y-3">
                        <label className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                           <Move size={16} /> Margin ({settings.padding}%)
                        </label>
                        <input 
                           type="range" 
                           min="0" 
                           max="40" 
                           value={settings.padding} 
                           onChange={(e) => setSettings({...settings, padding: parseInt(e.target.value)})}
                           className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                     </div>

                     <div className="space-y-2 pt-4 border-t border-white/10">
                        <button 
                          onClick={() => setSettings({...settings, isMirrored: !settings.isMirrored})}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${settings.isMirrored ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'bg-white/5 border-white/10 text-slate-400'}`}
                        >
                           <span className="flex items-center gap-2 font-bold text-sm"><FlipHorizontal size={18}/> {t('teleprompter.mirror')}</span>
                           <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.isMirrored ? 'bg-blue-500' : 'bg-slate-600'}`}>
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.isMirrored ? 'left-6' : 'left-1'}`} />
                           </div>
                        </button>
                     </div>
                  </div>
                )}

                {/* Text Settings */}
                {settingsTab === 'text' && (
                   <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                           <Type size={16} /> {t('teleprompter.font_size')} ({settings.fontSize}px)
                        </label>
                        <input 
                           type="range" 
                           min="20" 
                           max="150" 
                           value={settings.fontSize} 
                           onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
                           className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                           <AlignJustify size={16} /> {t('teleprompter.line_height')} ({settings.lineHeight})
                        </label>
                        <input 
                           type="range" 
                           min="1" 
                           max="2.5" 
                           step="0.1"
                           value={settings.lineHeight} 
                           onChange={(e) => setSettings({...settings, lineHeight: parseFloat(e.target.value)})}
                           className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                           <Type size={16} /> Font
                        </label>
                        <div className="space-y-2">
                           {FONTS.map(font => (
                              <button
                                 key={font.id}
                                 onClick={() => setSettings({...settings, fontFamily: font.id})}
                                 className={`w-full text-right p-3 rounded-lg border text-sm transition-colors ${settings.fontFamily === font.id ? 'bg-blue-500/20 border-blue-500 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                                 style={{ fontFamily: font.id === 'Vazirmatn' ? 'inherit' : font.id }}
                              >
                                 {font.name}
                              </button>
                           ))}
                        </div>
                      </div>
                   </div>
                )}

                {/* Color Settings */}
                {settingsTab === 'color' && (
                   <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      
                      <button 
                        onClick={() => setSettings({...settings, isDarkMode: !settings.isDarkMode, customBackgroundColor: '', customTextColor: ''})}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all mb-6 ${settings.isDarkMode ? 'bg-slate-800 border-white/20 text-white' : 'bg-slate-100 border-white/20 text-black'}`}
                      >
                         <span className="flex items-center gap-2 font-bold text-sm">
                           {settings.isDarkMode ? <Moon size={18}/> : <Sun size={18}/>}
                           {t('teleprompter.dark_mode')}
                         </span>
                         <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.isDarkMode ? 'bg-blue-500' : 'bg-slate-400'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.isDarkMode ? 'left-6' : 'left-1'}`} />
                         </div>
                      </button>

                      <div className="space-y-4 pt-4 border-t border-white/10">
                         <h4 className="text-white font-bold text-sm">Custom Colors</h4>
                         
                         <div className="space-y-2">
                            <label className="text-xs text-slate-400">Background</label>
                            <div className="flex gap-2">
                               <input 
                                 type="color" 
                                 value={settings.customBackgroundColor || (settings.isDarkMode ? '#0f172a' : '#f8fafc')}
                                 onChange={(e) => setSettings({...settings, customBackgroundColor: e.target.value})}
                                 className="h-10 w-10 rounded overflow-hidden cursor-pointer"
                               />
                               <input 
                                 type="text" 
                                 value={settings.customBackgroundColor}
                                 placeholder={settings.isDarkMode ? '#0f172a' : '#f8fafc'}
                                 onChange={(e) => setSettings({...settings, customBackgroundColor: e.target.value})}
                                 className="flex-1 bg-black/40 border border-white/10 rounded px-3 text-white text-sm dir-ltr font-mono"
                               />
                            </div>
                         </div>

                         <div className="space-y-2">
                            <label className="text-xs text-slate-400">Text Color</label>
                            <div className="flex gap-2">
                               <input 
                                 type="color" 
                                 value={settings.customTextColor || (settings.isDarkMode ? '#f1f5f9' : '#0f172a')}
                                 onChange={(e) => setSettings({...settings, customTextColor: e.target.value})}
                                 className="h-10 w-10 rounded overflow-hidden cursor-pointer"
                               />
                               <input 
                                 type="text" 
                                 value={settings.customTextColor}
                                 placeholder={settings.isDarkMode ? '#f1f5f9' : '#0f172a'}
                                 onChange={(e) => setSettings({...settings, customTextColor: e.target.value})}
                                 className="flex-1 bg-black/40 border border-white/10 rounded px-3 text-white text-sm dir-ltr font-mono"
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {/* Camera Settings */}
                {settingsTab === 'camera' && (
                   <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                      {!showCamera && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm mb-4">
                           {t('teleprompter.camera_warning')}
                        </div>
                      )}
                      
                      <div className="space-y-3">
                         <button 
                           onClick={() => setSettings({...settings, cameraMirrored: !settings.cameraMirrored})}
                           className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${settings.cameraMirrored ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'bg-white/5 border-white/10 text-slate-400'}`}
                         >
                            <span className="flex items-center gap-2 font-bold text-sm"><FlipHorizontal size={18}/> {t('teleprompter.camera_flip')}</span>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.cameraMirrored ? 'bg-blue-500' : 'bg-slate-600'}`}>
                               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.cameraMirrored ? 'left-6' : 'left-1'}`} />
                            </div>
                         </button>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                           {t('teleprompter.brightness')} ({settings.cameraBrightness}%)
                        </label>
                        <input 
                           type="range" 
                           min="50" 
                           max="200" 
                           value={settings.cameraBrightness} 
                           onChange={(e) => setSettings({...settings, cameraBrightness: parseInt(e.target.value)})}
                           className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                           {t('teleprompter.contrast')} ({settings.cameraContrast}%)
                        </label>
                        <input 
                           type="range" 
                           min="50" 
                           max="200" 
                           value={settings.cameraContrast} 
                           onChange={(e) => setSettings({...settings, cameraContrast: parseInt(e.target.value)})}
                           className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                           {t('teleprompter.zoom')} ({settings.cameraZoom}x)
                        </label>
                        <input 
                           type="range" 
                           min="1" 
                           max="3" 
                           step="0.1"
                           value={settings.cameraZoom} 
                           onChange={(e) => setSettings({...settings, cameraZoom: parseFloat(e.target.value)})}
                           className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                   </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teleprompter;
