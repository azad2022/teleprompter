
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGlobalMessage, hasSeenMessage, markMessageAsSeen } from '../services/storageService';
import { GlobalMessage } from '../types';
import { X, ExternalLink } from 'lucide-react';

const GlobalAnnouncement: React.FC = () => {
  const [message, setMessage] = useState<GlobalMessage | null>(null);

  useEffect(() => {
    // 1. Initial Check
    checkForMessage();

    // 2. Poll for updates (Simulation of real-time socket)
    const interval = setInterval(checkForMessage, 5000);

    // 3. Listen for local storage changes (if admin is in same browser)
    const handleStorageChange = () => checkForMessage();
    window.addEventListener('storage', handleStorageChange);

    return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkForMessage = () => {
    const activeMsg = getGlobalMessage();
    if (activeMsg && activeMsg.isActive && !hasSeenMessage(activeMsg.id)) {
        setMessage(activeMsg);
    } else {
        setMessage(null);
    }
  };

  const handleDismiss = () => {
    if (message) {
        markMessageAsSeen(message.id);
        setMessage(null);
    }
  };

  if (!message) return null;

  return (
    <AnimatePresence>
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Image/Video */}
                {message.mediaType !== 'none' && message.mediaUrl && (
                    <div className="w-full max-h-60 bg-black overflow-hidden relative">
                        {message.mediaType === 'image' ? (
                             <img src={message.mediaUrl} alt={message.title} className="w-full h-full object-cover" />
                        ) : (
                             <video 
                                src={message.mediaUrl} 
                                controls 
                                autoPlay 
                                className="w-full h-full object-contain"
                             />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80 pointer-events-none" />
                    </div>
                )}

                {/* Close Button */}
                <button 
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10 backdrop-blur-md"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className={`p-8 ${message.mediaType !== 'none' ? '-mt-12 relative z-10' : ''}`}>
                    <h2 className="text-2xl font-black text-white mb-4 drop-shadow-lg" style={{ fontFamily: 'Lalezar, Poppins, cursive' }}>
                        {message.title}
                    </h2>
                    
                    <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        <p className="text-slate-300 leading-loose text-lg whitespace-pre-wrap">
                            {message.message}
                        </p>
                    </div>

                    {message.actionLink && (
                        <div className="mt-8">
                             <a 
                                href={message.actionLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-center shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                             >
                                مشاهده بیشتر
                                <ExternalLink size={18} />
                             </a>
                        </div>
                    )}
                    
                    {!message.actionLink && (
                        <button 
                            onClick={handleDismiss}
                            className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
                        >
                            متوجه شدم
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    </AnimatePresence>
  );
};

export default GlobalAnnouncement;