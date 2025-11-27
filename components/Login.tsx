import React, { useState } from 'react';
import { User } from '../types';
import { saveUser } from '../services/storageService';
import { Shield, User as UserIcon, ArrowRight, ArrowLeft, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';

interface Props {
  onLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const { t, dir } = useLocalization();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = () => {
    if (email.toLowerCase() === 'azadazerakhsh@gmail.com' && password === 'aa3724585') {
      const adminUser: User = {
        email: email,
        name: 'Azad Azerakhsh',
        isAdmin: true,
        photoUrl: undefined
      };
      saveUser(adminUser);
      onLogin(adminUser);
    } else {
      setError(t('login.error_auth'));
    }
  };

  const handleGuestAccess = () => {
    const guestUser: User = {
      email: 'guest@teleprompter.app',
      name: 'Guest User',
      isAdmin: false
    };
    saveUser(guestUser);
    onLogin(guestUser);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
      
      {/* Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 mx-4"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2" style={{ fontFamily: 'Lalezar, Poppins, cursive' }}>
            {t('app_name')}
          </h1>
          <p className="text-slate-400 text-sm tracking-widest font-medium">CONTENT CREATOR STUDIO</p>
        </div>

        <AnimatePresence mode="wait">
          {!isAdminMode ? (
            <motion.div 
              key="guest"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button
                onClick={handleGuestAccess}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-3 group"
              >
                <UserIcon size={20} />
                <span>{t('login.guest_btn')}</span>
                {dir === 'rtl' ? <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> : <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900/50 px-2 text-slate-500">{t('login.admin_access')}</span>
                </div>
              </div>

              <button
                onClick={() => setIsAdminMode(true)}
                className="w-full bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-3 rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2"
              >
                <Shield size={18} />
                {t('login.admin_btn')}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 mr-1">{t('login.email')}</label>
                  <div className="relative">
                    <Mail className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-500`} size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-black/40 border border-white/10 rounded-xl py-3 ${dir === 'rtl' ? 'pr-10 pl-4 text-left' : 'pl-10 pr-4 text-left'} text-white placeholder-slate-600 focus:border-blue-500 outline-none transition-colors dir-ltr`}
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 mr-1">{t('login.password')}</label>
                  <div className="relative">
                    <Lock className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-500`} size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full bg-black/40 border border-white/10 rounded-xl py-3 ${dir === 'rtl' ? 'pr-10 pl-10 text-left' : 'pl-10 pr-10 text-left'} text-white placeholder-slate-600 focus:border-blue-500 outline-none transition-colors dir-ltr`}
                      placeholder="••••••••"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300`}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="pt-2 gap-3 flex">
                <button
                  onClick={() => {
                    setIsAdminMode(false);
                    setError('');
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-3 rounded-xl transition-all"
                >
                  {t('login.back')}
                </button>
                <button
                  onClick={handleAdminLogin}
                  className="flex-[2] bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2"
                >
                  <Shield size={18} />
                  {t('login.enter')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <div className="absolute bottom-6 text-slate-600 text-xs font-mono">
        Designed by Azad Azerakhsh
      </div>
    </div>
  );
};

export default Login;