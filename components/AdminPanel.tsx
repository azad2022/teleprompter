import React, { useState } from 'react';
import { ArrowLeft, Send, ShieldAlert, Settings, Bell, Database } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onBack: () => void;
}

const AdminPanel: React.FC<Props> = ({ onBack }) => {
  const [notification, setNotification] = useState('');
  
  const handleSendNotification = () => {
    if (!notification) return;
    // Simulation of FCM broadcast
    alert(`پیام "${notification}" به تمام کاربران ارسال شد.`);
    setNotification('');
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
          
          {/* Push Notifications */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <Bell size={24} />
              <h2 className="text-xl font-bold">ارسال اعلان عمومی</h2>
            </div>
            <textarea
              value={notification}
              onChange={(e) => setNotification(e.target.value)}
              placeholder="متن پیام برای تمام کاربران..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white h-32 resize-none mb-4 focus:border-blue-500 outline-none"
            />
            <button 
              onClick={handleSendNotification}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Send size={18} />
              ارسال پوش نوتیفیکیشن
            </button>
          </motion.div>

          {/* System Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
            transition={{ delay: 0.2 }}
            className="col-span-1 md:col-span-2 bg-slate-900 border border-white/10 rounded-2xl p-6"
          >
             <div className="flex items-center gap-3 mb-4 text-purple-400">
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