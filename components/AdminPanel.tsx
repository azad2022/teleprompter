import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, ShieldAlert, Settings, Bell, Database, Cpu, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSystemApiConfig, saveSystemApiConfig } from '../services/storageService';
import { ApiConfig } from '../types';

interface Props {
  onBack: () => void;
}

const AdminPanel: React.FC<Props> = ({ onBack }) => {
  const [notification, setNotification] = useState('');
  
  // System API Config State
  const [sysApiProvider, setSysApiProvider] = useState<string>('deepseek');
  const [sysApiKey, setSysApiKey] = useState('');
  const [sysApiBase, setSysApiBase] = useState('');
  const [sysApiModel, setSysApiModel] = useState('');

  useEffect(() => {
    const existing = getSystemApiConfig();
    if (existing) {
        setSysApiProvider(existing.provider);
        setSysApiKey(existing.apiKey);
        setSysApiBase(existing.baseUrl || '');
        setSysApiModel(existing.modelName || '');
    } else {
        // Default preset
        setSysApiProvider('deepseek');
        setSysApiKey('sk-mwY8X2Ez1Vy01uT2EfuNqKMMTLMUz5qZuSo0Eql3wXsp2aP6');
        setSysApiBase('https://api.gapapi.com/v1');
        setSysApiModel('deepseek-chat');
    }
  }, []);

  const handleSendNotification = () => {
    if (!notification) return;
    // Simulation of FCM broadcast
    alert(`پیام "${notification}" به تمام کاربران ارسال شد.`);
    setNotification('');
  };

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

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* AI System Config (New Section) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 md:col-span-2 bg-slate-900 border border-white/10 rounded-2xl p-6"
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

          {/* Push Notifications */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-purple-400">
              <Bell size={24} />
              <h2 className="text-xl font-bold">ارسال اعلان عمومی</h2>
            </div>
            <textarea
              value={notification}
              onChange={(e) => setNotification(e.target.value)}
              placeholder="متن پیام برای تمام کاربران..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white h-32 resize-none mb-4 focus:border-purple-500 outline-none"
            />
            <button 
              onClick={handleSendNotification}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Send size={18} />
              ارسال پوش نوتیفیکیشن
            </button>
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
                <span className="text-slate-400">Active Users</span>
                <span className="text-white font-mono">1,248</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-slate-400">Database Load</span>
                <span className="text-yellow-400 font-mono">24%</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-1 md:col-span-2 bg-slate-900 border border-white/10 rounded-2xl p-6"
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