
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Script, TeleprompterSettings } from '../types';
import { saveScript, saveGlobalCameraSettings, getGlobalCameraSettings } from '../services/storageService';
import { saveMediaToDB } from '../services/mediaDb';
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
  Camera,
  Circle,
  Square,
  SwitchCamera,
  Layers,
  Mic,
  MicOff,
  Monitor,
  StopCircle,
  Wand2,
  Sliders
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
  const { t, dir, language } = useLocalization();
  
  // Initialize settings with fallback
  const [settings, setSettings] = useState<TeleprompterSettings>(() => {
    const globalCam = getGlobalCameraSettings();
    return {
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
      cameraBrightness: script.lastUsedSettings?.cameraBrightness ?? globalCam?.cameraBrightness ?? 100,
      cameraContrast: script.lastUsedSettings?.cameraContrast ?? globalCam?.cameraContrast ?? 100,
      cameraZoom: script.lastUsedSettings?.cameraZoom ?? globalCam?.cameraZoom ?? 1,
      cameraMirrored: script.lastUsedSettings?.cameraMirrored ?? globalCam?.cameraMirrored ?? true,
      enablePiP: script.lastUsedSettings?.enablePiP ?? true,
      enableVoiceControl: script.lastUsedSettings?.enableVoiceControl ?? false,
      // Advanced Camera
      cameraFilters: script.lastUsedSettings?.cameraFilters ?? {
        saturation: 100,
        sepia: 0,
        blur: 0,
        grayscale: 0,
        hue: 0
      },
      enableBeautyMode: script.lastUsedSettings?.enableBeautyMode ?? false,
      enableAudioEnhancement: script.lastUsedSettings?.enableAudioEnhancement ?? true,
    };
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'visual' | 'text' | 'color' | 'camera' | 'pro'>('visual');
  const [showCamera, setShowCamera] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // Voice Control State
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Recording State
  type RecordingType = 'none' | 'camera' | 'audio' | 'screen';
  const [recordingType, setRecordingType] = useState<RecordingType>('none');
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For processing video
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const requestRef = useRef<number>();
  
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

      saveGlobalCameraSettings({
        cameraBrightness: settings.cameraBrightness,
        cameraContrast: settings.cameraContrast,
        cameraZoom: settings.cameraZoom,
        cameraMirrored: settings.cameraMirrored,
        cameraFilters: settings.cameraFilters
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [settings, script.id, script.title, script.content, script.createdAt, script.tags]);

  // Timer
  useEffect(() => {
    let interval: any;
    if (isPlaying || recordingType !== 'none') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, recordingType]);

  // --- CANVAS VIDEO PROCESSING LOOP ---
  const animateCanvas = useCallback(() => {
    if (webcamRef.current && webcamRef.current.video && canvasRef.current) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx && video.readyState === 4) {
            // Match canvas size to video size
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }
            
            // Apply Filters
            let filterString = `brightness(${settings.cameraBrightness}%) contrast(${settings.cameraContrast}%) saturate(${settings.cameraFilters?.saturation ?? 100}%) sepia(${settings.cameraFilters?.sepia ?? 0}%) grayscale(${settings.cameraFilters?.grayscale ?? 0}%) hue-rotate(${settings.cameraFilters?.hue ?? 0}deg) blur(${settings.cameraFilters?.blur ?? 0}px)`;
            
            // Beauty Mode Override
            if (settings.enableBeautyMode) {
               filterString = `brightness(${Math.max(105, (settings.cameraBrightness || 100))}%) contrast(95%) saturate(110%) sepia(5%) blur(0.5px)`; 
            }

            // Check if filter actually changed to avoid unnecessary state updates in engine (though ctx.filter is fast)
            if (ctx.filter !== filterString) ctx.filter = filterString;

            // Handle Mirroring Logic on Canvas
            ctx.save();
            if (settings.cameraMirrored) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }

            // Digital Zoom Logic (Cropping)
            const zoom = settings.cameraZoom || 1;
            if (zoom > 1) {
                const width = canvas.width;
                const height = canvas.height;
                const newWidth = width / zoom;
                const newHeight = height / zoom;
                const xOffset = (width - newWidth) / 2;
                const yOffset = (height - newHeight) / 2;
                
                ctx.drawImage(video, xOffset, yOffset, newWidth, newHeight, 0, 0, width, height);
            } else {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            
            ctx.restore();
        }
    }
    requestRef.current = requestAnimationFrame(animateCanvas);
  }, [settings.cameraBrightness, settings.cameraContrast, settings.cameraFilters, settings.enableBeautyMode, settings.cameraMirrored, settings.cameraZoom]);

  useEffect(() => {
    if (showCamera) {
        requestRef.current = requestAnimationFrame(animateCanvas);
    } else {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [showCamera, animateCanvas]);

  // --- VOICE CONTROL ---
  // Use a ref to track if voice control is effectively enabled for the callbacks
  // This prevents stale closures from restarting recognition during unmount/disable
  const isVoiceEnabledRef = useRef(settings.enableVoiceControl);
  useEffect(() => {
      isVoiceEnabledRef.current = settings.enableVoiceControl;
  }, [settings.enableVoiceControl]);

  useEffect(() => {
    // If disabled, stop any existing instance
    if (!settings.enableVoiceControl) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {} 
        recognitionRef.current = null;
        setIsVoiceListening(false);
      }
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language === 'fa' ? 'fa-IR' : 'en-US';

      recognition.onstart = () => setIsVoiceListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        processVoiceCommand(transcript);
      };
      
      recognition.onerror = (event: any) => {
          // 'aborted' is common when stopping/restarting, ignore it.
          // 'not-allowed' means permission denied, so we should disable the feature.
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
             setSettings(s => ({...s, enableVoiceControl: false}));
          }
          if (event.error !== 'aborted') {
            console.debug("Speech recognition error:", event.error);
          }
      };

      recognition.onend = () => {
        // Only restart if the feature is still enabled in the Ref
        if (isVoiceEnabledRef.current) {
            try { recognition.start(); } catch(e) {
                // Ignore start errors (e.g. already started)
            }
        } else {
            setIsVoiceListening(false);
        }
      };

      try { recognition.start(); } catch (e) {}
      recognitionRef.current = recognition;
      
      return () => { 
          // Vital: clear onend to prevent zombie restarts during cleanup
          recognition.onend = null; 
          try { recognition.abort(); } catch(e) {}
      };
    }
  }, [settings.enableVoiceControl, language]);

  const processVoiceCommand = (cmd: string) => {
    if (cmd.includes('play') || cmd.includes('start') || cmd.includes('شروع') || cmd.includes('پخش')) setIsPlaying(true);
    else if (cmd.includes('pause') || cmd.includes('stop') || cmd.includes('توقف') || cmd.includes('ایست')) setIsPlaying(false);
    else if (cmd.includes('faster') || cmd.includes('سریع')) setSettings(prev => ({ ...prev, scrollSpeed: Math.min(100, prev.scrollSpeed + 5) }));
    else if (cmd.includes('slower') || cmd.includes('کند')) setSettings(prev => ({ ...prev, scrollSpeed: Math.max(0, prev.scrollSpeed - 5) }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const bgColor = settings.customBackgroundColor || (settings.isDarkMode ? '#0f172a' : '#f8fafc');
  const textColor = settings.customTextColor || (settings.isDarkMode ? '#f1f5f9' : '#0f172a');

  // --- RECORDING LOGIC ---
  
  const getSupportedMimeType = () => {
    const types = ["video/webm;codecs=vp9", "video/webm", "video/mp4"];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
  };

  const handleStartRecording = React.useCallback(() => {
    if (canvasRef.current) {
        setRecordingType('camera');
        
        try {
            // Capture stream from canvas
            const canvasStream = canvasRef.current.captureStream(30); // 30 FPS
            
            // Add Audio Track from Webcam (if available)
            if (webcamRef.current && webcamRef.current.stream) {
                const audioTracks = webcamRef.current.stream.getAudioTracks();
                if (audioTracks.length > 0) {
                    canvasStream.addTrack(audioTracks[0]);
                }
            }
            
            const mimeType = getSupportedMimeType();
            const mediaRecorder = new MediaRecorder(canvasStream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = mediaRecorder;
            
            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: mimeType || "video/webm" });
                try {
                    await saveMediaToDB(blob, 'video', `ProCam - ${script.title} - ${new Date().toLocaleString()}`);
                    alert(t('teleprompter.rec_saved'));
                } catch (error) { console.error(error); }
            };
            
            mediaRecorder.start();
        } catch (e) {
            console.error("Recorder error", e);
            alert("Recording failed. Browser may not support canvas capture.");
            setRecordingType('none');
        }
    }
  }, [script.title, t]);

  // Audio & Screen recording logic remains similar
  const handleStartAudioRecording = async () => {
     try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        setRecordingType('audio');
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
            await saveMediaToDB(blob, 'audio', `Audio - ${script.title}`);
            alert(t('teleprompter.rec_saved'));
            stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
     } catch (e) { alert("Mic error"); }
  };

  const handleStartScreenRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setRecordingType('screen');
        stream.getVideoTracks()[0].onended = () => handleStopRecording();
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        mediaRecorder.onstop = async () => {
             const blob = new Blob(chunks, { type: "video/webm" });
             await saveMediaToDB(blob, 'video', `Screen - ${script.title}`);
             alert(t('teleprompter.rec_saved'));
             stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
      } catch (e) {}
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recordingType !== 'none') {
        if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setRecordingType('none');
    }
  };

  // Scroll Logic
  const animateScroll = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    if (scrollContainerRef.current && isPlaying) {
      const pixelMove = (settings.scrollSpeed / 10) * (delta / 16); 
      scrollContainerRef.current.scrollTop += pixelMove;
      if (scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >= scrollContainerRef.current.scrollHeight - 10) {
        setIsPlaying(false);
      }
    }
    lastTimeRef.current = time;
    if (isPlaying) animationFrameRef.current = requestAnimationFrame(animateScroll);
  }, [isPlaying, settings.scrollSpeed]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animateScroll);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isPlaying, animateScroll]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const resetScroll = () => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    setIsPlaying(false);
    setElapsedTime(0);
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => {
        const newMode = prev === 'user' ? 'environment' : 'user';
        setSettings(s => ({ ...s, cameraMirrored: newMode === 'user' }));
        return newMode;
    });
  };

  // Preset Logic
  const applyPreset = (type: 'natural' | 'cinematic' | 'bw' | 'reset') => {
      setSettings(prev => {
          const defaults = { saturation: 100, sepia: 0, blur: 0, grayscale: 0, hue: 0 };
          let newFilters = { ...defaults };
          let newContrast = 100;
          let newBrightness = 100;

          if (type === 'cinematic') {
              newFilters = { ...defaults, saturation: 90, sepia: 20 };
              newContrast = 120;
          } else if (type === 'bw') {
              newFilters = { ...defaults, grayscale: 100 };
              newContrast = 110;
          } else if (type === 'natural') {
             // Default
          }

          return {
              ...prev,
              cameraFilters: newFilters,
              cameraContrast: newContrast,
              cameraBrightness: newBrightness,
              enableBeautyMode: false 
          };
      });
  };

  return (
    <div 
      className={`w-full h-full relative flex flex-col transition-colors duration-500 ${recordingType !== 'none' ? 'ring-4 ring-inset ring-red-600' : (showCamera ? 'ring-4 ring-inset ring-red-500/20' : '')}`}
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
            <div className="flex items-center gap-2">
                 <span className="text-xs opacity-60 font-mono">{formatTime(elapsedTime)}</span>
                 {recordingType !== 'none' && <span className="text-xs text-red-500 font-bold animate-pulse">REC {recordingType === 'screen' ? 'SCREEN' : (recordingType === 'audio' ? 'AUDIO' : '')}</span>}
                 {isVoiceListening && <span className="text-xs text-blue-400 font-bold animate-pulse flex items-center gap-1"><Mic size={10}/> {t('teleprompter.voice_listening')}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showCamera && (
              <button 
                onClick={recordingType === 'camera' ? handleStopRecording : handleStartRecording}
                disabled={recordingType !== 'none' && recordingType !== 'camera'}
                className={`p-3 rounded-full transition-all shadow-lg ${recordingType === 'camera' ? 'bg-red-600 text-white animate-pulse' : (recordingType !== 'none' ? 'opacity-30 cursor-not-allowed bg-slate-500/10' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20')}`}
              >
                  {recordingType === 'camera' ? <Square size={20} fill="currentColor" /> : <Circle size={20} fill="currentColor" />}
              </button>
          )}

          <button 
             onClick={recordingType === 'audio' ? handleStopRecording : handleStartAudioRecording}
             disabled={recordingType !== 'none' && recordingType !== 'audio'}
             className={`p-3 rounded-full transition-all shadow-lg hidden md:block ${recordingType === 'audio' ? 'bg-pink-600 text-white animate-pulse' : (recordingType !== 'none' ? 'opacity-30 cursor-not-allowed bg-slate-500/10' : 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20')}`}
          >
             {recordingType === 'audio' ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>

          <button 
             onClick={recordingType === 'screen' ? handleStopRecording : handleStartScreenRecording}
             disabled={recordingType !== 'none' && recordingType !== 'screen'}
             className={`p-3 rounded-full transition-all shadow-lg hidden md:block ${recordingType === 'screen' ? 'bg-orange-600 text-white animate-pulse' : (recordingType !== 'none' ? 'opacity-30 cursor-not-allowed bg-slate-500/10' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20')}`}
          >
             {recordingType === 'screen' ? <StopCircle size={20} /> : <Monitor size={20} />}
          </button>

          {showCamera && (
             <button onClick={toggleCameraFacing} className={`p-3 rounded-full transition-colors ${settings.isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-slate-800'}`}>
                <SwitchCamera size={20} />
             </button>
          )}

          {showCamera && (
             <button 
               onClick={() => setSettings(s => ({ ...s, cameraMirrored: !s.cameraMirrored }))}
               className={`p-3 rounded-full transition-colors ${settings.cameraMirrored 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : (settings.isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-slate-800')}`}
             >
                <FlipHorizontal size={20} />
             </button>
          )}

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
          <div className="absolute inset-0 z-0 opacity-100 pointer-events-none overflow-hidden bg-black">
             {/* Hidden Webcam Component for Stream Source */}
             <Webcam 
                key={facingMode}
                audio={settings.enableAudioEnhancement}
                muted={true}
                ref={webcamRef}
                videoConstraints={{
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                }}
                className="opacity-0 absolute top-0 left-0 w-px h-px"
                mirrored={false} // Mirroring handled in canvas
             />
             
             {/* Visible Canvas for Filtered Output */}
             <canvas 
                ref={canvasRef}
                className="w-full h-full object-cover"
             />
          </div>
        )}

        {/* Recording Indicator */}
        {recordingType !== 'none' && (
            <div className={`absolute top-24 ${dir === 'rtl' ? 'left-6' : 'right-6'} z-40 pointer-events-auto animate-in fade-in zoom-in duration-300`}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/50 shadow-lg">
                        <div className={`w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-ping`} />
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                           {recordingType === 'audio' ? 'REC AUDIO' : (recordingType === 'screen' ? 'REC SCREEN' : 'RECORDING')}
                        </span>
                    </div>
                </div>
            </div>
        )}

        {/* Scroll Area */}
        <div 
          ref={scrollContainerRef}
          className={`w-full h-full overflow-y-auto no-scrollbar relative z-10 px-[10%] ${settings.isMirrored ? 'scale-x-[-1]' : ''}`}
          style={{ paddingTop: '40vh', paddingBottom: '40vh' }}
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

      {/* Floating Controls */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30 backdrop-blur-xl px-8 py-4 rounded-full border shadow-2xl ${settings.isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-slate-50/80 border-black/10'}`}>
        <button onClick={resetScroll} className={`p-3 transition-colors ${settings.isDarkMode ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
          <RotateCcw size={24} />
        </button>
        <button onClick={togglePlay} className={`w-16 h-16 flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${isPlaying ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}>
          {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>
        <button
          onClick={() => setSettings({...settings, enableVoiceControl: !settings.enableVoiceControl})}
          className={`p-3 rounded-full transition-colors relative ${settings.enableVoiceControl ? 'bg-blue-600 text-white' : (settings.isDarkMode ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900')}`}
        >
            {settings.enableVoiceControl ? <Mic size={24} /> : <MicOff size={24} />}
            {settings.enableVoiceControl && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
        </button>
        <div className="flex flex-col items-center gap-1 w-32">
            <input type="range" min="0" max="100" value={settings.scrollSpeed} onChange={(e) => setSettings({...settings, scrollSpeed: parseInt(e.target.value)})} className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500 transition-all ${settings.isDarkMode ? 'bg-white/20' : 'bg-black/20'}`}/>
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
             <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <Settings size={20} className="text-blue-400"/>
                   {t('teleprompter.settings_title')}
                </h3>
                <button onClick={() => setShowSettings(false)} className="p-2 text-white/50 hover:text-white transition-colors">
                   <X size={24} />
                </button>
             </div>

             <div className="flex border-b border-white/10 overflow-x-auto">
                {['visual', 'text', 'color', 'camera', 'pro'].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setSettingsTab(tab as any)}
                      className={`flex-1 py-4 px-2 text-sm font-bold transition-colors whitespace-nowrap ${settingsTab === tab ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        {tab === 'visual' && <Layout size={16} className="mx-auto mb-1"/>}
                        {tab === 'text' && <Type size={16} className="mx-auto mb-1"/>}
                        {tab === 'color' && <Palette size={16} className="mx-auto mb-1"/>}
                        {tab === 'camera' && <Camera size={16} className="mx-auto mb-1"/>}
                        {tab === 'pro' && <Wand2 size={16} className="mx-auto mb-1"/>}
                        {t(`teleprompter.tabs.${tab}`)}
                    </button>
                ))}
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* EXISTING TABS REMAIN UNCHANGED (Visual, Text, Color) */}
                {settingsTab === 'visual' && (
                  <div className="space-y-6">
                     <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex justify-between items-center">
                        <span className="flex items-center gap-2 font-bold text-sm text-blue-200"><Layers size={18}/> {t('teleprompter.pip_desc')}</span>
                        <button onClick={() => setSettings({...settings, enablePiP: !settings.enablePiP})} className={`w-12 h-6 rounded-full relative transition-colors ${settings.enablePiP ? 'bg-blue-500' : 'bg-slate-600'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enablePiP ? 'left-7' : 'left-1'}`} />
                        </button>
                     </div>
                     <div className="space-y-3">
                        <label className="text-blue-300 font-bold text-sm">Margin ({settings.padding}%)</label>
                        <input type="range" min="0" max="40" value={settings.padding} onChange={(e) => setSettings({...settings, padding: parseInt(e.target.value)})} className="w-full h-2 bg-slate-700 rounded-lg accent-purple-500"/>
                     </div>
                     <button onClick={() => setSettings({...settings, isMirrored: !settings.isMirrored})} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${settings.isMirrored ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                        <span className="flex items-center gap-2 font-bold text-sm"><FlipHorizontal size={18}/> {t('teleprompter.mirror')}</span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.isMirrored ? 'bg-blue-500' : 'bg-slate-600'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.isMirrored ? 'left-6' : 'left-1'}`} /></div>
                     </button>
                  </div>
                )}

                {settingsTab === 'text' && (
                   <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-blue-300 font-bold text-sm">{t('teleprompter.font_size')} ({settings.fontSize}px)</label>
                        <input type="range" min="20" max="150" value={settings.fontSize} onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500"/>
                      </div>
                      <div className="space-y-3">
                        <label className="text-blue-300 font-bold text-sm">{t('teleprompter.line_height')} ({settings.lineHeight})</label>
                        <input type="range" min="1" max="2.5" step="0.1" value={settings.lineHeight} onChange={(e) => setSettings({...settings, lineHeight: parseFloat(e.target.value)})} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500"/>
                      </div>
                      <div className="space-y-2">
                           {FONTS.map(font => (
                              <button key={font.id} onClick={() => setSettings({...settings, fontFamily: font.id})} className={`w-full text-right p-3 rounded-lg border text-sm transition-colors ${settings.fontFamily === font.id ? 'bg-blue-500/20 border-blue-500 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`} style={{ fontFamily: font.id === 'Vazirmatn' ? 'inherit' : font.id }}>{font.name}</button>
                           ))}
                      </div>
                   </div>
                )}

                {settingsTab === 'color' && (
                   <div className="space-y-6">
                      <button onClick={() => setSettings({...settings, isDarkMode: !settings.isDarkMode})} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${settings.isDarkMode ? 'bg-slate-800 border-white/20 text-white' : 'bg-slate-100 border-white/20 text-black'}`}>
                         <span className="flex items-center gap-2 font-bold text-sm">{settings.isDarkMode ? <Moon size={18}/> : <Sun size={18}/>} {t('teleprompter.dark_mode')}</span>
                         <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.isDarkMode ? 'bg-blue-500' : 'bg-slate-400'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.isDarkMode ? 'left-6' : 'left-1'}`} /></div>
                      </button>
                   </div>
                )}

                {/* Camera Tab (Standard) */}
                {settingsTab === 'camera' && (
                   <div className="space-y-8">
                      {!showCamera && <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">{t('teleprompter.camera_warning')}</div>}
                      <button onClick={toggleCameraFacing} className="w-full flex items-center justify-between p-4 rounded-xl border bg-white/5 border-white/10 text-slate-400">
                            <span className="flex items-center gap-2 font-bold text-sm"><SwitchCamera size={18}/> {t('teleprompter.camera_switch')}</span>
                      </button>
                      <div className="space-y-3">
                        <label className="text-blue-300 font-bold text-sm">{t('teleprompter.zoom')} ({settings.cameraZoom}x)</label>
                        <input type="range" min="1" max="3" step="0.1" value={settings.cameraZoom} onChange={(e) => setSettings({...settings, cameraZoom: parseFloat(e.target.value)})} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500"/>
                      </div>
                      <div className="space-y-3">
                        <label className="text-blue-300 font-bold text-sm">{t('teleprompter.brightness')} ({settings.cameraBrightness}%)</label>
                        <input type="range" min="50" max="200" value={settings.cameraBrightness} onChange={(e) => setSettings({...settings, cameraBrightness: parseInt(e.target.value)})} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500"/>
                      </div>
                      <div className="space-y-3">
                        <label className="text-blue-300 font-bold text-sm">{t('teleprompter.contrast')} ({settings.cameraContrast}%)</label>
                        <input type="range" min="50" max="200" value={settings.cameraContrast} onChange={(e) => setSettings({...settings, cameraContrast: parseInt(e.target.value)})} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500"/>
                      </div>
                   </div>
                )}

                {/* PRO Camera Tab (New Features) */}
                {settingsTab === 'pro' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 rounded-2xl">
                             <div className="flex items-center gap-2 text-white font-bold mb-4 border-b border-white/10 pb-2">
                                 <Sliders size={18} />
                                 {t('teleprompter.pro_title')}
                             </div>
                             
                             {/* Beauty Mode Toggle */}
                             <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-bold text-pink-300 flex items-center gap-2">
                                    <Wand2 size={16}/> {t('teleprompter.beauty_mode')}
                                </span>
                                <button onClick={() => setSettings({...settings, enableBeautyMode: !settings.enableBeautyMode})} className={`w-12 h-6 rounded-full relative transition-colors ${settings.enableBeautyMode ? 'bg-pink-500' : 'bg-slate-600'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enableBeautyMode ? 'left-7' : 'left-1'}`} />
                                </button>
                             </div>

                             {/* Audio Enhance Toggle */}
                             <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-bold text-blue-300 flex items-center gap-2">
                                    <Mic size={16}/> {t('teleprompter.audio_enhance')}
                                </span>
                                <button onClick={() => setSettings({...settings, enableAudioEnhancement: !settings.enableAudioEnhancement})} className={`w-12 h-6 rounded-full relative transition-colors ${settings.enableAudioEnhancement ? 'bg-blue-500' : 'bg-slate-600'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enableAudioEnhancement ? 'left-7' : 'left-1'}`} />
                                </button>
                             </div>

                             {/* Presets */}
                             <div className="grid grid-cols-3 gap-2 mb-6">
                                <button onClick={() => applyPreset('natural')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white">{t('teleprompter.preset_natural')}</button>
                                <button onClick={() => applyPreset('cinematic')} className="p-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 rounded-lg text-xs font-bold">{t('teleprompter.preset_cinematic')}</button>
                                <button onClick={() => applyPreset('bw')} className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold">{t('teleprompter.preset_bw')}</button>
                             </div>
                             
                             {/* Manual Sliders */}
                             <div className="space-y-4 pt-4 border-t border-white/10">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-bold">{t('teleprompter.saturation')}</label>
                                    <input type="range" min="0" max="200" value={settings.cameraFilters?.saturation ?? 100} onChange={(e) => setSettings({...settings, cameraFilters: {...settings.cameraFilters!, saturation: parseInt(e.target.value)}})} className="w-full h-1.5 bg-slate-700 rounded-lg accent-purple-500"/>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 font-bold">{t('teleprompter.warmth')}</label>
                                    <input type="range" min="0" max="100" value={settings.cameraFilters?.sepia ?? 0} onChange={(e) => setSettings({...settings, cameraFilters: {...settings.cameraFilters!, sepia: parseInt(e.target.value)}})} className="w-full h-1.5 bg-slate-700 rounded-lg accent-orange-500"/>
                                </div>
                             </div>
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
