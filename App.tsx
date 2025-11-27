
import React, { useState, useEffect } from 'react';
import { AppRoute, Script, ThemeId, User } from './types';
import { hasCompletedOnboarding, setOnboardingComplete, logoutUser, getTheme, saveTheme, getUser } from './services/storageService';
import Onboarding from './components/Onboarding';
import Library from './components/Library';
import ScriptGenerator from './components/ScriptGenerator';
import Teleprompter from './components/Teleprompter';
import LiveAssistant from './components/LiveAssistant';
import MediaGallery from './components/MediaGallery';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import GlobalAnnouncement from './components/GlobalAnnouncement';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';

const THEMES: Record<ThemeId, string> = {
  classic_blue: "bg-gradient-to-br from-[#1a2a6c] via-[#b21f1f] to-[#fdbb2d]",
  natural_green: "bg-gradient-to-br from-[#134E5E] to-[#71B280]",
  creative_purple: "bg-gradient-to-br from-[#2E3192] to-[#1BFFFF]",
  energy_orange: "bg-gradient-to-br from-[#FF416C] to-[#FF4B2B]",
  minimal_grey: "bg-gradient-to-br from-[#232526] to-[#414345]",
  true_dark: "bg-black"
};

const MainContent: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.LOGIN);
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('classic_blue');
  const [appInitialized, setAppInitialized] = useState(false);
  const { language } = useLocalization();

  // Initial Load
  useEffect(() => {
    setCurrentTheme(getTheme());
    
    // Check for existing session
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
      // Determine route
      if (savedUser.isAdmin) {
        setRoute(AppRoute.ADMIN_PANEL);
      } else if (!hasCompletedOnboarding()) {
        setRoute(AppRoute.ONBOARDING);
      } else {
        setRoute(AppRoute.LIBRARY);
      }
    } else {
      setRoute(AppRoute.LOGIN);
    }
    
    setAppInitialized(true);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    if (u.isAdmin) {
      setRoute(AppRoute.ADMIN_PANEL);
    } else if (!hasCompletedOnboarding()) {
      setRoute(AppRoute.ONBOARDING);
    } else {
      setRoute(AppRoute.LIBRARY);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setRoute(AppRoute.LOGIN);
  };

  const handleOnboardingComplete = () => {
    setOnboardingComplete();
    setRoute(AppRoute.LIBRARY);
  };

  const navigateToPrompter = (script: Script) => {
    setActiveScript(script);
    setRoute(AppRoute.TELEPROMPTER);
  };

  const changeTheme = (id: ThemeId) => {
    setCurrentTheme(id);
    saveTheme(id);
  };

  // Render logic
  const renderContent = () => {
    if (!appInitialized) {
      return (
        <div className="flex items-center justify-center h-full">
           <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      );
    }

    switch (route) {
      case AppRoute.LOGIN:
        return <Login onLogin={handleLogin} />;

      case AppRoute.ONBOARDING:
        return <Onboarding onComplete={handleOnboardingComplete} />;
      
      case AppRoute.LIBRARY:
        return (
          <Library 
            user={user}
            onSelect={navigateToPrompter} 
            onCreateNew={() => setRoute(AppRoute.GENERATOR)} 
            onLiveAssistant={() => setRoute(AppRoute.LIVE_ASSISTANT)}
            onGallery={() => setRoute(AppRoute.GALLERY)}
            onLogout={handleLogout}
            onAdminPanel={() => setRoute(AppRoute.ADMIN_PANEL)}
            currentTheme={currentTheme}
            onThemeChange={changeTheme}
          />
        );
      
      case AppRoute.ADMIN_PANEL:
        return <AdminPanel onBack={() => setRoute(AppRoute.LIBRARY)} />;

      case AppRoute.GENERATOR:
        return (
          <ScriptGenerator 
            onBack={() => setRoute(AppRoute.LIBRARY)}
            onScriptCreated={(script) => navigateToPrompter(script)}
          />
        );
      
      case AppRoute.TELEPROMPTER:
        if (!activeScript) return <Library user={user} onSelect={navigateToPrompter} onCreateNew={() => setRoute(AppRoute.GENERATOR)} onLiveAssistant={() => setRoute(AppRoute.LIVE_ASSISTANT)} onGallery={() => setRoute(AppRoute.GALLERY)} onLogout={handleLogout} onAdminPanel={() => setRoute(AppRoute.ADMIN_PANEL)} currentTheme={currentTheme} onThemeChange={changeTheme} />;
        return (
          <Teleprompter 
            script={activeScript} 
            onExit={() => setRoute(AppRoute.LIBRARY)} 
          />
        );

      case AppRoute.LIVE_ASSISTANT:
        return <LiveAssistant onExit={() => setRoute(AppRoute.LIBRARY)} />;

      case AppRoute.GALLERY:
        return <MediaGallery onBack={() => setRoute(AppRoute.LIBRARY)} />;
      
      default:
        return <div>Not found</div>;
    }
  };

  const isBlackBg = route === AppRoute.TELEPROMPTER || route === AppRoute.LIVE_ASSISTANT || route === AppRoute.ADMIN_PANEL || route === AppRoute.GALLERY || route === AppRoute.LOGIN;

  return (
    <div className={`w-full h-screen font-sans overflow-hidden transition-all duration-1000 ${isBlackBg ? 'bg-black text-white' : THEMES[currentTheme] + ' text-white'}`}>
      
      {/* Global Announcements Overlay */}
      <GlobalAnnouncement />

      <AnimatePresence mode='wait'>
        <motion.div 
          key={route}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Creator Attribution */}
      {route !== AppRoute.LOGIN && (
        <div className="fixed bottom-2 w-full text-center z-50 pointer-events-none opacity-50 text-[10px] font-mono tracking-widest flex items-center justify-center gap-1">
          <span>DESIGNED BY AZAD AZERAKHSH</span>
          <Heart size={10} className="fill-red-500 text-red-500 animate-pulse" />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LocalizationProvider>
      <MainContent />
    </LocalizationProvider>
  );
};

export default App;