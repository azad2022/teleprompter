
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Megaphone, ShieldAlert, Settings, Database, Cpu, Save, Image as ImageIcon, Video, X, Eye, Trash2, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSystemApiConfig, saveSystemApiConfig, publishGlobalMessage, getGlobalMessage } from '../services/storageService';
import { ApiConfig, GlobalMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onBack: () => void;
}

const AdminPanel: React.FC<Props> = ({ onBack }) => {
  // System API Config State
  const [sysApiProvider, setSysApiProvider] = useState<string>('deepseek');
  const [sysApiKey, setSysApiKey] = useState('');
  const [sysApiBase, setSysApiBase] = useState('');
  const [sysApiModel, setSysApiModel] = useState('');

  // Global Announcement State
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgMediaType, setMsgMediaType] = useState<'none' | 'image' | 'video'>('none');
  const [msgMediaUrl, setMsgMediaUrl] = useState('');
  const [msgActionLink, setMsgActionLink] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<GlobalMessage | null>(null);

  useEffect(() => {
    // Load System API Config
    const existing = getSystemApiConfig();
    if (existing) {
        setSysApiProvider(existing.provider);
        setSysApiKey(existing.apiKey);
        setSysApiBase(existing.baseUrl || '');
        setSysApiModel(existing.modelName || '');
    } else {
        setSysApiProvider('deepseek');
        setSysApiKey('sk-mwY8X2Ez1Vy01uT2EfuNqKMMTLMUz5qZuSo0Eql3wXsp2aP6');
        setSysApiBase('https://api.gapapi.com/v1');
        setSysApiModel('deepseek-chat');
    }

    // Load Active Announcement
    setActiveAnnouncement(getGlobalMessage());
  }, []);

  const handleSaveSystemApi = () => {
    const cleanApiKey = sysApiKey.trim();
    if (!cleanApiKey) {
        alert('لطفا API Key را وارد کنید');
        return;
    }
    const config: ApiConfig = {
        id: 'system_default',
        provider: sysApiProvider as any,
        name: 'System Default',
        apiKey: cleanApiKey,
        baseUrl: sysApiBase.trim(),
        modelName: sysApiModel.trim(),
        isDefault: true
    };
    saveSystemApiConfig(config);
    alert('تنظیمات پیش‌فرض هوش مصنوعی با موفقیت ذخیره شد.');
  };

  const handlePublishAnnouncement = () => {
    if (!msgTitle || !msgBody) {
        alert('عنوان و متن پیام الزامی است.');
        return;
    }

    const newMessage: GlobalMessage = {
        id: uuidv4(),
        title: msgTitle,
        message: msgBody,
        mediaType: msgMediaType,
        mediaUrl: msgMediaUrl,
        actionLink: msgActionLink,
        createdAt: Date.now(),
        isActive: true
    };

    publishGlobalMessage(newMessage);
    setActiveAnnouncement(newMessage);
    alert('پیام با موفقیت به تمام کاربران ارسال شد.');
  };

  const handleDeleteAnnouncement = () => {
    if (window.confirm('آیا مطمئن هستید؟ پیام از صفحه کاربران حذف خواهد شد.')) {
        publishGlobalMessage(null);
        setActiveAnnouncement(null);
        setMsgTitle('');
        setMsgBody('');
        setMsgMediaUrl('');
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white transition-colors">
              <ArrowLeft />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-red-500" style={{ fontFamily: 'Lalezar, cursive' }}>پنل مدیریت ارشد</h1>
              <p className="text-slate-400 text-sm">مدیریت متمرکز سیستم تله‌پرامپتر</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest">
            Admin Access
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* AI System Config */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 lg:col-span-2 bg-slate-900 border border-white/10 rounded-2xl p-6"
          >
             <div className="flex items-center gap-3 mb-6 text-blue-400 border-b border-white/5 pb-4">
              <Cpu size={24} />
              <h2 className="text-xl font-bold">تنظیمات پیش‌فرض هوش مصنوعی</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className="text-slate-400 text-sm mb-1 block">Provider</label>
                    <select 
                        value={sysApiProvider}
                        onChange={(e) => setSysApiProvider(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                    >
                        <option value="openai">OpenAI</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="gemini">Gemini</option>
                        <option value="custom">Custom</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-slate-400 text-sm mb-1 block">Model Name</label>
                    <input 
                        type="text" 
                        value={sysApiModel}
                        onChange={(e) => setSysApiModel(e.target.value)}
                        placeholder="e.g. gpt-4 or deepseek-chat"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none dir-ltr font-mono"
                    />
                 </div>
            </div>

            <div className="mb-4">
                <label className="text-slate-400 text-sm mb-1 block">Base URL</label>
                <input 
                    type="text" 
                    value={sysApiBase}
                    onChange={(e) => setSysApiBase(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none dir-ltr font-mono"
                />
            </div>

             <div className="mb-6">
                <label className="text-slate-400 text-sm mb-1 block">API Key</label>
                <input 
                    type="password" 
                    value={sysApiKey}
                    onChange={(e) => setSysApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none dir-ltr font-mono"
                />
            </div>

            <button 
              onClick={handleSaveSystemApi}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Save size={18} />
              ذخیره تنظیمات پیش‌فرض
            </button>
          </motion.div>

          {/* Global Announcement Manager */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-1 lg:col-span-2 bg-slate-900 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                 <div className="flex items-center gap-3 text-purple-400">
                    <Megaphone size={24} />
                    <h2 className="text-xl font-bold">مدیریت پیام‌های سراسری</h2>
                </div>
                {activeAnnouncement && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Globe size={12}/> فعال
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor */}
                <div className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-sm mb-1 block">عنوان پیام</label>
                        <input 
                            type="text" 
                            value={msgTitle}
                            onChange={(e) => setMsgTitle(e.target.value)}
                            placeholder="مثلا: بروزرسانی بزرگ نسخه ۲"
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none font-bold"
                        />
                    </div>
                    
                    <div>
                        <label className="text-slate-400 text-sm mb-1 block">متن کامل پیام</label>
                        <textarea 
                            value={msgBody}
                            onChange={(e) => setMsgBody(e.target.value)}
                            placeholder="متن کامل خبر، اطلاعیه یا پیام خود را اینجا بنویسید..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none h-40 resize-none leading-relaxed custom-scrollbar"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-slate-400 text-sm mb-1 block">نوع رسانه</label>
                             <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                                <button 
                                    onClick={() => setMsgMediaType('none')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${msgMediaType === 'none' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                                >
                                    متن خالی
                                </button>
                                <button 
                                    onClick={() => setMsgMediaType('image')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${msgMediaType === 'image' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <ImageIcon size={14} /> تصویر
                                </button>
                                <button 
                                    onClick={() => setMsgMediaType('video')}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${msgMediaType === 'video' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <Video size={14} /> ویدئو
                                </button>
                             </div>
                        </div>
                        <div>
                             <label className="text-slate-400 text-sm mb-1 block">لینک دکمه (اختیاری)</label>
                             <input 
                                type="text" 
                                value={msgActionLink}
                                onChange={(e) => setMsgActionLink(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none dir-ltr text-xs"
                             />
                        </div>
                    </div>

                    {msgMediaType !== 'none' && (
                        <div>
                            <label className="text-slate-400 text-sm mb-1 block">
                                {msgMediaType === 'image' ? 'آدرس تصویر (URL)' : 'آدرس ویدئو MP4 (URL)'}
                            </label>
                            <input 
                                type="text" 
                                value={msgMediaUrl}
                                onChange={(e) => setMsgMediaUrl(e.target.value)}
                                placeholder="https://example.com/media.jpg"
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none dir-ltr"
                            />
                             <p className="text-[10px] text-slate-500 mt-1">
                                * لینک مستقیم فایل را وارد کنید.
                             </p>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                         {activeAnnouncement && (
                            <button 
                                onClick={handleDeleteAnnouncement}
                                className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} />
                                حذف پیام فعلی
                            </button>
                         )}
                         <button 
                            onClick={handlePublishAnnouncement}
                            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/40"
                         >
                            <Megaphone size={18} />
                            {activeAnnouncement ? 'بروزرسانی پیام' : 'انتشار سراسری'}
                         </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="border border-white/10 bg-black/20 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[400px]">
                    <h3 className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-4">Live Preview</h3>
                    
                    <div className="w-[320px] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col relative">
                        {/* Mock Phone Status Bar */}
                        <div className="h-6 bg-black flex items-center justify-between px-4 text-[10px] text-white/50">
                            <span>9:41</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 bg-white/50 rounded-full"></div>
                                <div className="w-3 h-3 bg-white/50 rounded-full"></div>
                            </div>
                        </div>

                        {/* Modal Simulation */}
                        <div className="flex-1 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
                            <div className="w-full bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                                <button className="absolute top-2 right-2 p-1 bg-black/40 rounded-full text-white/70">
                                    <X size={14} />
                                </button>
                                
                                {msgMediaType === 'image' && msgMediaUrl && (
                                    <div className="h-40 w-full bg-black">
                                        <img src={msgMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {msgMediaType === 'video' && msgMediaUrl && (
                                    <div className="h-40 w-full bg-black flex items-center justify-center relative">
                                         <video src={msgMediaUrl} className="w-full h-full object-cover opacity-50" />
                                         <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-md">
                                                <Video size={20} className="text-white"/>
                                            </div>
                                         </div>
                                    </div>
                                )}

                                <div className="p-4">
                                    <h4 className="text-white font-bold text-lg mb-2 text-right">{msgTitle || 'عنوان پیام...'}</h4>
                                    <p className="text-slate-300 text-xs leading-relaxed text-right">{msgBody || 'متن پیام شما در اینجا نمایش داده میشود...'}</p>
                                    
                                    {msgActionLink && (
                                        <button className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">
                                            مشاهده لینک
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-emerald-400">
              <Database size={24} />
              <h2 className="text-xl font-bold">وضعیت سرور</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-slate-400">API Status</span>
                <span className="text-emerald-400 font-mono">Operational</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-slate-400">Global Msg</span>
                <span className={`font-mono ${activeAnnouncement ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {activeAnnouncement ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-1 lg:col-span-1 bg-slate-900 border border-white/10 rounded-2xl p-6"
          >
             <div className="flex items-center gap-3 mb-4 text-orange-400">
              <Settings size={24} />
              <h2 className="text-xl font-bold">تنظیمات اضطراری</h2>
            </div>
            <div className="flex gap-4">
               <button className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl font-medium transition-colors flex flex-col items-center gap-2">
                 <ShieldAlert size={24} />
                 حالت تعمیرات
               </button>
               <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-colors flex flex-col items-center gap-2">
                 <Database size={24} />
                 پاکسازی کش
               </button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;