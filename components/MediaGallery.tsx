
import React, { useEffect, useState } from 'react';
import { MediaItem } from '../types';
import { getAllMediaFromDB, deleteMediaFromDB } from '../services/mediaDb';
import { ArrowRight, ArrowLeft, Video, Mic, Trash2, Download, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';

interface Props {
  onBack: () => void;
}

const MediaGallery: React.FC<Props> = ({ onBack }) => {
  const { t, dir } = useLocalization();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const items = await getAllMediaFromDB();
      setMediaItems(items);
    } catch (e) {
      console.error("Failed to load media", e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop event bubbling
    if (window.confirm(t('gallery.delete_confirm'))) {
      try {
        await deleteMediaFromDB(id);
        // Optimistic update: Remove locally immediately
        setMediaItems(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error("Error deleting file:", error);
        alert("Error deleting file.");
        loadMedia(); // Revert on error
      }
    }
  };

  const handleDownload = (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title}.${item.type === 'video' ? 'webm' : 'webm'}`; // WebM is standard for MediaRecorder
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredItems = mediaItems.filter(item => item.type === activeTab);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-white/10 bg-black/20 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white transition-colors">
          {dir === 'rtl' ? <ArrowRight /> : <ArrowLeft />}
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Lalezar, cursive' }}>
          {t('gallery.title')}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-4 justify-center">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 max-w-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'video' 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
            : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <Video size={20} />
          {t('gallery.videos')}
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 max-w-xs py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'audio' 
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
            : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <Mic size={20} />
          {t('gallery.audios')}
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4 opacity-50">
            {activeTab === 'video' ? <Video size={64} /> : <Mic size={64} />}
            <p className="text-lg font-bold">{t('gallery.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-xl group"
                >
                  <div className="aspect-video bg-black relative flex items-center justify-center">
                    {activeTab === 'video' ? (
                       <video 
                         controls 
                         src={URL.createObjectURL(item.blob)} 
                         className="w-full h-full object-contain"
                       />
                    ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-slate-900">
                          <Mic size={48} className="text-purple-400 mb-4" />
                          <audio controls src={URL.createObjectURL(item.blob)} className="w-4/5" />
                       </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg truncate mb-1" style={{ direction: 'ltr', textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                        {item.title}
                    </h3>
                    <div className="flex justify-between items-center text-xs text-white/50 mb-4">
                      <span>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}</span>
                      <span>{formatSize(item.size)}</span>
                    </div>
                    
                    <div className="flex gap-2">
                       <button 
                        onClick={(e) => handleDownload(e, item)}
                        className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-blue-300 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                       >
                         <Download size={14} />
                         {t('gallery.download')}
                       </button>
                       <button 
                        onClick={(e) => handleDelete(e, item.id)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-bold transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaGallery;
