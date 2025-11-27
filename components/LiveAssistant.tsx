
import React, { useState, useEffect, useRef } from 'react';
import { getLiveAssistantResponse } from '../services/geminiService';
import { ArrowRight, ArrowLeft, Mic, MicOff, Volume2, Sparkles, StopCircle, Radio, Trash2, MessageSquare, User, Bot, Settings, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';

interface Props {
  onExit: () => void;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

const LiveAssistant: React.FC<Props> = ({ onExit }) => {
  const { t, dir, language } = useLocalization();
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Settings & Audio
  const [showSettings, setShowSettings] = useState(false);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [audioLevels, setAudioLevels] = useState<number[]>([10, 10, 10, 10, 10]);

  // Refs
  const recognitionRef = useRef<any>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Audio Context Refs for Visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Sync ref with state
  useEffect(() => {
    messagesRef.current = messages;
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load Microphones
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const inputs = devices.filter(d => d.kind === 'audioinput');
      setMicrophones(inputs);
      if (inputs.length > 0) {
        // Try to select default or first available
        const defaultMic = inputs.find(d => d.deviceId === 'default');
        setSelectedMicId(defaultMic ? defaultMic.deviceId : inputs[0].deviceId);
      }
    });
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = language === 'fa' ? 'fa-IR' : 'en-US';
      recognition.interimResults = true;

      recognition.onstart = () => {
        setState('listening');
        startVisualizer();
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognition.onend = () => {
        stopVisualizer();
        if (state === 'listening') {
             if (transcript && transcript.trim().length > 0) {
                 handleProcessQuery(transcript);
             } else {
                 setState('idle');
             }
        }
      };

      recognition.onerror = (event: any) => {
        console.error(event.error);
        stopVisualizer();
        setState('idle');
      };

      recognitionRef.current = recognition;
    } else {
      alert("Browser doesn't support speech recognition.");
    }
  }, [transcript, state, language]);

  // Visualizer Logic
  const startVisualizer = async () => {
    try {
      if (audioContextRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
            deviceId: selectedMicId ? { exact: selectedMicId } : undefined 
        }
      });

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 32;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Extract 5 bars of data approx
        const step = Math.floor(bufferLength / 5);
        const newLevels = [];
        for(let i=0; i<5; i++) {
            const val = dataArray[i * step];
            // Normalize to height roughly 10-40
            const h = 10 + (val / 255) * 30;
            newLevels.push(h);
        }
        setAudioLevels(newLevels);
        
        rafRef.current = requestAnimationFrame(update);
      };
      
      update();

    } catch (e) {
      console.error("Visualizer Error:", e);
    }
  };

  const stopVisualizer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) {
        sourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
        sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    setAudioLevels([10, 10, 10, 10, 10]);
  };

  const toggleListening = () => {
    if (state === 'idle' || state === 'speaking') {
      setTranscript('');
      recognitionRef.current?.start();
    } else if (state === 'listening') {
      recognitionRef.current?.stop();
    }
  };

  const handleProcessQuery = async (query: string) => {
    setState('processing');
    
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: query };
    const updatedHistory = [...messagesRef.current, newUserMsg];
    setMessages(updatedHistory);
    
    const historyStrings = updatedHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`);
    
    try {
      const aiResponse = await getLiveAssistantResponse(query, historyStrings);
      setResponse(aiResponse);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: aiResponse }]);
      setState('speaking');
    } catch (e) {
      setResponse("Error processing request.");
      setState('idle');
    }
  };

  const handleClearHistory = () => {
      if (window.confirm("Are you sure?")) {
        setMessages([]);
        setResponse('');
        setTranscript('');
        setState('idle');
      }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 relative overflow-hidden font-sans">
      
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 animate-gradient-slow z-0" />
      <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />

      {/* Top Bar */}
      <div className="relative z-20 flex justify-between items-center p-4 md:p-6 bg-black/40 backdrop-blur-lg border-b border-white/5 shadow-lg">
        <div className="flex items-center gap-3">
            <button onClick={onExit} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all">
               {dir === 'rtl' ? <ArrowRight /> : <ArrowLeft />}
            </button>
            <button 
                onClick={() => setShowSettings(true)}
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all"
                title="Input Settings"
            >
              <Settings size={20} />
            </button>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <Radio size={16} className="text-red-500 animate-pulse" />
            <span className="text-red-200 text-sm font-bold tracking-wider hidden md:inline">LIVE ASSISTANT</span>
            <span className="text-red-200 text-sm font-bold tracking-wider md:hidden">LIVE</span>
        </div>

        <button 
            onClick={handleClearHistory}
            disabled={messages.length === 0}
            className={`p-3 rounded-full transition-all ${messages.length === 0 ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300'}`}
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Content Area - Split View */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          
          {/* Chat History Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
             {messages.length === 0 && state === 'idle' && (
                 <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                    <div className="p-6 bg-white/5 rounded-full border border-dashed border-white/10">
                        <MessageSquare size={48} />
                    </div>
                    <p className="text-lg font-medium">History is empty</p>
                 </div>
             )}
             
             {messages.map((msg) => (
                 <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                 >
                    <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-lg border border-white/5 ${
                        msg.role === 'user' 
                        ? 'bg-blue-600/40 text-blue-50 rounded-tr-sm ' + (dir === 'rtl' ? 'ml-2' : 'mr-2')
                        : 'bg-slate-800/60 text-slate-100 rounded-tl-sm ' + (dir === 'rtl' ? 'mr-2' : 'ml-2')
                    }`}>
                        <div className="flex items-center gap-2 mb-2 opacity-60 text-xs font-bold uppercase tracking-wider">
                            {msg.role === 'user' ? <User size={12}/> : <Bot size={12}/>}
                            <span>{msg.role === 'user' ? 'Host' : 'Assistant'}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap text-sm md:text-base">{msg.text}</p>
                    </div>
                 </motion.div>
             ))}
             <div ref={messagesEndRef} />
          </div>

          {/* Active Interaction Zone */}
          <div className="bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 min-h-[180px] flex flex-col justify-center relative">
             <AnimatePresence mode="wait">
                
                {state === 'idle' && (
                  <motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-center text-white/50 font-bold text-lg flex items-center justify-center gap-2"
                  >
                     <MicOff size={20} />
                     Tap microphone to speak
                  </motion.p>
                )}

                {state === 'listening' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="w-full text-center"
                    >
                        <div className="flex justify-center items-end gap-1 h-12 mb-2">
                             {audioLevels.map((level, i) => (
                                <motion.div 
                                    key={i}
                                    className="w-1.5 bg-pink-500 rounded-full"
                                    animate={{ height: level }}
                                    transition={{ type: "tween", ease: "linear", duration: 0.05 }}
                                />
                             ))}
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-white leading-relaxed" style={{ direction: dir }}>
                            {transcript || "..."}
                        </p>
                    </motion.div>
                )}

                {state === 'processing' && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-3"
                    >
                       <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                       <span className="text-purple-300 font-bold animate-pulse">Processing...</span>
                    </motion.div>
                )}

                {state === 'speaking' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="w-full text-center"
                    >
                         <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                            <Volume2 size={20} className="animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-widest">LIVE RESPONSE</span>
                         </div>
                         <p className="text-xl md:text-2xl font-bold text-white leading-relaxed line-clamp-3" style={{ direction: dir }}>
                            {response}
                        </p>
                    </motion.div>
                )}

             </AnimatePresence>
          </div>
      </div>

      {/* Controls */}
      <div className="relative z-30 p-6 flex justify-center items-center bg-black border-t border-white/10">
        <button
            onClick={toggleListening}
            className={`
                relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300
                ${state === 'listening' 
                    ? 'bg-red-600 scale-110 shadow-red-500/50' 
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:scale-105 shadow-blue-500/50'}
            `}
        >
            {state === 'listening' && (
                <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-50" />
            )}
            
            {state === 'listening' ? (
                <StopCircle size={32} className="text-white" />
            ) : (
                <Mic size={32} className="text-white" />
            )}
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                >
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Settings size={18} />
                            Microphone Settings
                        </h3>
                        <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Default Microphone</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {microphones.map((mic) => (
                                    <button
                                        key={mic.deviceId}
                                        onClick={() => setSelectedMicId(mic.deviceId)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            selectedMicId === mic.deviceId 
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-200' 
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Mic size={16} />
                                            <span className="text-sm truncate max-w-[200px]">{mic.label || `Microphone ${mic.deviceId.slice(0,4)}...`}</span>
                                        </div>
                                        {selectedMicId === mic.deviceId && <Check size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-black/20 text-center">
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-xl font-bold transition-colors"
                        >
                            Confirm
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LiveAssistant;
