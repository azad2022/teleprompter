
import React, { useEffect, useState } from 'react';
import { Script, User, ThemeId, ApiConfig } from '../types';
import { getScripts, deleteScript, getApiConfigs, saveApiConfigs, hasCompletedTour, setTourComplete } from '../services/storageService';
import { Trash2, Play, FileText, Calendar, Search, Plus, Mic, LogOut, Settings, Palette, Key, Check, Shield, Globe, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useLocalization } from '../contexts/LocalizationContext';
import ProductTour from './ProductTour';

interface Props {
  user: User | null;
  onSelect: (script: Script) => void;
  onCreateNew: () => void;
  onLiveAssistant: () => void;
  onGallery: () => void;
  onLogout: () => void;
  onAdminPanel: () => void;
  currentTheme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
}

const Library: React.FC<Props> = ({ user, onSelect, onCreateNew, onLiveAssistant, onGallery, onLogout, onAdminPanel, currentTheme, onThemeChange }) => {
  const { t, language, setLanguage } = useLocalization();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [search, setSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  // Settings State
  const [activeTab, setActiveTab] = useState<'theme' | 'api' | 'lang'>('theme');
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);

  // New API Form
  const [newApiProvider, setNewApiProvider] = useState<string>('openai');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiBase, setNewApiBase] = useState('');

  useEffect(() => {
    setScripts(getScripts());
    setApiConfigs(getApiConfigs());
    
    // Check Tour State
    if (!hasCompletedTour()) {
       setTimeout(() => setShowTour(true), 1000);
    }
  }, []);

  const handleTourComplete = () => {
    setTourComplete();
    setShowTour(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(t('library.delete_confirm'))) {
      deleteScript(id);
      setScripts(getScripts());
    }
  };

  const handleAddApi = () => {
    if (!newApiKey) return;
    const newConfig: ApiConfig = {
      id: uuidv4(),
      provider: newApiProvider as any,
      name: `${newApiProvider.toUpperCase()} - ${newApiBase ? 'Custom' : 'Standard'}`,
      apiKey: newApiKey,
      baseUrl: newApiBase,
      isDefault: true 
    };
    const updated = apiConfigs.map(c => ({...c, isDefault: false}));
    updated.push(newConfig);
    setApiConfigs(updated);
    saveApiConfigs(updated);
    setNewApiKey('');
    setNewApiBase('');
  };

  const handleSetDefaultApi = (id: string) => {
    const updated = apiConfigs.map(c => ({
      ...c,
      isDefault: c.id === id
    }));
    setApiConfigs(updated);
    saveApiConfigs(updated);
  };

  const handleDeleteApi = (id: string) => {
    const updated = apiConfigs.filter(c => c.id !== id);
    setApiConfigs(updated);
    saveApiConfigs(updated);
  };

  const filteredScripts = scripts.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full p-6 overflow-y-auto relative" id="tour-dashboard">
      
      {/* Product Tour Overlay */}
      {showTour && <ProductTour onComplete={handleTourComplete} />}

      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4" id="tour-profile">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
               <img src={user?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"} alt="User" className="w-full h-full bg-slate-800" />
            </div>
            <div>
               <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-blue-200 mb-1 drop-shadow-lg" style={{ fontFamily: 'Lalezar, Poppins, cursive' }}>
                {t('library.hello')} {user?.name || 'User'}
              </h1>
              <p className="text-white/60 text-sm font-medium flex gap-2">
                 {user?.isAdmin && <span className="text-red-400 font-bold flex items-center gap-1"><Shield size={12}/> {t('library.admin')}</span>}
                 <span>|</span>
                 <span>{t('library.user_role')}</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {user?.isAdmin && (
               <button 
               onClick={onAdminPanel}
               className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 border border-red-500/30 px-4 py-3 rounded-xl font-bold transition-all"
             >
               <Shield size={20} />
               <span className="hidden md:inline">{t('library.admin_btn')}</span>
             </button>
            )}

            <button 
              id="tour-settings"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-bold transition-all backdrop-blur-md"
            >
              <Settings size={20} />
              <span className="hidden md:inline">{t('library.settings_btn')}</span>
            </button>

             <button 
              onClick={onGallery}
              className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 px-4 py-3 rounded-xl font-bold transition-all"
            >
              <ImageIcon size={20} />
              <span className="hidden md:inline">{t('library.gallery_btn')}</span>
            </button>

             <button 
              id="tour-live"
              onClick={onLiveAssistant}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-700 to-rose-700 hover:from-pink-600 hover:to-rose-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-pink-500/30 border border-white/10"
            >
              <Mic size={20} />
              <span className="hidden md:inline">{t('library.live_btn')}</span>
            </button>
            <button 
              id="tour-create"
              onClick={onCreateNew}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30 border border-white/10"
            >
              <Plus size={20} />
              <span className="hidden md:inline">{t('library.new_btn')}</span>
            </button>
             <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 px-4 py-3 rounded-xl font-bold transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative group max-w-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl flex items-center overflow-hidden focus-within:border-white/30 transition-colors">
            <input 
              type="text" 
              placeholder={t('library.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent py-4 pr-6 pl-4 text-white placeholder-white/40 outline-none font-medium"
            />
            <div className="px-4 text-white/50">
              <Search size={22} />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
          {filteredScripts.length > 0 ? (
            filteredScripts.map((script, index) => (
              <motion.div 
                key={script.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(script)}
                className="group relative bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/5 rounded-2xl text-blue-300 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                      <FileText size={24} />
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, script.id)}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 line-clamp-1 text-white group-hover:text-blue-200 transition-colors tracking-wide" style={{ fontFamily: 'Lalezar, Poppins, cursive' }}>{script.title}</h3>
                  <p className="text-white/70 text-sm line-clamp-3 mb-6 h-[4.5em] leading-relaxed font-medium">
                    {script.content}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs font-medium border-t border-white/10 pt-4">
                    <div className="flex items-center gap-1.5 text-white/50 bg-white/5 px-2 py-1 rounded-lg">
                      <Calendar size={12} />
                      {new Date(script.createdAt).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-300 group-hover:translate-x-[-4px] transition-transform font-bold">
                      {t('library.run')}
                      <Play size={12} fill="currentColor" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-white/30">
              <div className="bg-white/5 p-6 rounded-full mb-4">
                <FileText size={48} className="opacity-50" />
              </div>
              <p className="text-lg font-medium">{t('library.empty_state')}</p>
              <button onClick={onCreateNew} className="mt-4 text-blue-400 hover:text-blue-300 font-bold hover:underline">
                {t('library.create_first')}
              </button>
            </div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex border-b border-white/10 bg-black/20">
                <h3 className="absolute top-4 right-4 text-white/20 hidden">Settings</h3>
                <button 
                  onClick={() => setActiveTab('theme')}
                  className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'theme' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                  <Palette size={18} /> {t('settings.tabs.theme')}
                </button>
                <button 
                   onClick={() => setActiveTab('api')}
                  className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'api' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                  <Key size={18} /> {t('settings.tabs.api')}
                </button>
                <button 
                   onClick={() => setActiveTab('lang')}
                  className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'lang' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                  <Globe size={18} /> {t('settings.tabs.language')}
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {activeTab === 'theme' && (
                  <div className="grid grid-cols-2 gap-4">
                     {[
                        { id: 'classic_blue', name: 'Classic Blue', bg: 'bg-gradient-to-br from-[#1a2a6c] to-[#b21f1f]' },
                        { id: 'natural_green', name: 'Nature Green', bg: 'bg-gradient-to-br from-[#134E5E] to-[#71B280]' },
                        { id: 'creative_purple', name: 'Creative Purple', bg: 'bg-gradient-to-br from-[#2E3192] to-[#1BFFFF]' },
                        { id: 'energy_orange', name: 'Energy Orange', bg: 'bg-gradient-to-br from-[#FF416C] to-[#FF4B2B]' },
                        { id: 'minimal_grey', name: 'Minimal Grey', bg: 'bg-gradient-to-br from-[#232526] to-[#414345]' },
                        { id: 'true_dark', name: 'True Dark / تاریک مطلق', bg: 'bg-black' },
                     ].map((t) => (
                       <button
                        key={t.id}
                        onClick={() => onThemeChange(t.id as ThemeId)}
                        className={`relative h-24 rounded-2xl overflow-hidden transition-all border border-white/10 ${currentTheme === t.id ? 'ring-4 ring-white shadow-xl scale-105' : 'opacity-70 hover:opacity-100'}`}
                       >
                         <div className={`absolute inset-0 ${t.bg}`} />
                         <span className="absolute bottom-2 right-2 text-white font-bold text-sm drop-shadow-md">{t.name}</span>
                         {currentTheme === t.id && <div className="absolute top-2 left-2 bg-white text-black rounded-full p-1"><Check size={12}/></div>}
                       </button>
                     ))}
                  </div>
                )}

                {activeTab === 'lang' && (
                    <div className="space-y-4">
                        <label className="text-white font-bold">{t('settings.language_select')}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setLanguage('fa')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${language === 'fa' ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                            >
                                <span className="text-2xl">🇮🇷</span>
                                <span className="font-bold">فارسی</span>
                            </button>
                            <button
                                onClick={() => setLanguage('en')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${language === 'en' ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                            >
                                <span className="text-2xl">🇺🇸</span>
                                <span className="font-bold">English</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'api' && (
                  <div className="space-y-6">
                    {/* Add New API */}
                    <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                      <h3 className="font-bold mb-3 text-blue-300">Add New API</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                         <select 
                            value={newApiProvider}
                            onChange={(e) => setNewApiProvider(e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm"
                         >
                           <option value="openai">OpenAI / ChatGPT</option>
                           <option value="deepseek">DeepSeek</option>
                           <option value="gemini">Gemini</option>
                           <option value="custom">Custom</option>
                         </select>
                         <input 
                            type="text" 
                            placeholder="Base URL (Optional)" 
                            value={newApiBase}
                            onChange={(e) => setNewApiBase(e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm dir-ltr"
                         />
                      </div>
                      <input 
                          type="password" 
                          placeholder="API Key" 
                          value={newApiKey}
                          onChange={(e) => setNewApiKey(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm mb-3 dir-ltr"
                      />
                      <button 
                        onClick={handleAddApi}
                        disabled={!newApiKey}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 font-bold text-sm disabled:opacity-50"
                      >
                        Save & Test
                      </button>
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                       {apiConfigs.map(api => (
                         <div key={api.id} className={`flex items-center justify-between p-3 rounded-xl border ${api.isDefault ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/10'}`}>
                           <div>
                             <div className="font-bold text-white text-sm">{api.name}</div>
                             <div className="text-xs text-white/50">{api.provider}</div>
                           </div>
                           <div className="flex gap-2">
                             {!api.isDefault && (
                               <button onClick={() => handleSetDefaultApi(api.id)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white">Select</button>
                             )}
                             <button onClick={() => handleDeleteApi(api.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16}/></button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end">
                <button onClick={() => setShowSettings(false)} className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">{t('settings.close')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Library;