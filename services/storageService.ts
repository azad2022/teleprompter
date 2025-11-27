import { Script, ApiConfig, User, ThemeId, Language } from '../types';

const STORAGE_KEY = 'teleprompter_scripts';
const ONBOARDING_KEY = 'blogger_onboarding_complete_v2'; // Updated key version
const TOUR_KEY = 'blogger_tour_complete';
const USER_KEY = 'teleprompter_user';
const API_CONFIGS_KEY = 'teleprompter_api_configs';
const SYSTEM_API_CONFIG_KEY = 'teleprompter_system_api_config';
const THEME_KEY = 'teleprompter_theme';
const LANG_KEY = 'blogger_language';

// --- Scripts ---
export const saveScript = (script: Script): void => {
  const scripts = getScripts();
  const index = scripts.findIndex(s => s.id === script.id);
  if (index >= 0) {
    scripts[index] = script;
  } else {
    scripts.unshift(script);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
};

export const getScripts = (): Script[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteScript = (id: string): void => {
  const scripts = getScripts().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
};

// --- Onboarding & Tour ---
export const setOnboardingComplete = (): void => {
  localStorage.setItem(ONBOARDING_KEY, 'true');
};

export const hasCompletedOnboarding = (): boolean => {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
};

export const setTourComplete = (): void => {
  localStorage.setItem(TOUR_KEY, 'true');
};

export const hasCompletedTour = (): boolean => {
  return localStorage.getItem(TOUR_KEY) === 'true';
};

// --- User / Auth ---
export const saveUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const logoutUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// --- API Configs ---
export const getApiConfigs = (): ApiConfig[] => {
  const data = localStorage.getItem(API_CONFIGS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveApiConfigs = (configs: ApiConfig[]): void => {
  localStorage.setItem(API_CONFIGS_KEY, JSON.stringify(configs));
};

export const getActiveApiConfig = (): ApiConfig | undefined => {
  const configs = getApiConfigs();
  return configs.find(c => c.isDefault);
};

// --- System API Config (Admin defined default) ---
export const saveSystemApiConfig = (config: ApiConfig | null): void => {
  if (config) {
    localStorage.setItem(SYSTEM_API_CONFIG_KEY, JSON.stringify(config));
  } else {
    localStorage.removeItem(SYSTEM_API_CONFIG_KEY);
  }
};

export const getSystemApiConfig = (): ApiConfig | null => {
  const data = localStorage.getItem(SYSTEM_API_CONFIG_KEY);
  return data ? JSON.parse(data) : null;
};

// --- Theme ---
export const saveTheme = (themeId: ThemeId): void => {
  localStorage.setItem(THEME_KEY, themeId);
};

export const getTheme = (): ThemeId => {
  return (localStorage.getItem(THEME_KEY) as ThemeId) || 'classic_blue';
};

// --- Language ---
export const saveLanguage = (lang: Language): void => {
  localStorage.setItem(LANG_KEY, lang);
};

export const getLanguage = (): Language => {
  return (localStorage.getItem(LANG_KEY) as Language) || 'fa';
}