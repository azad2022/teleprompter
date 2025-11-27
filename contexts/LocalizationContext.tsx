import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { getLanguage, saveLanguage } from '../services/storageService';
import { dictionary } from '../locales/dictionary';

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getLanguage());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    saveLanguage(lang);
    
    // Update HTML dir and lang attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    
    // Toggle font class on body
    if (lang === 'en') {
      document.body.classList.add('lang-en');
    } else {
      document.body.classList.remove('lang-en');
    }
  };

  useEffect(() => {
    // Initial setup
    setLanguage(language);
  }, []);

  const t = (path: string) => {
    const keys = path.split('.');
    let current: any = dictionary[language];
    for (const key of keys) {
      if (current[key] === undefined) return path;
      current = current[key];
    }
    return current as string;
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t, dir: language === 'fa' ? 'rtl' : 'ltr' }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};