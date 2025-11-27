
export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  tags?: string[];
  lastUsedSettings?: TeleprompterSettings;
}

export interface MediaItem {
  id: string;
  type: 'video' | 'audio';
  title: string;
  blob: Blob; // Stored in IndexedDB
  createdAt: number;
  duration?: string;
  size: number;
}

export interface TeleprompterSettings {
  scrollSpeed: number; // 0-100
  fontSize: number; // px
  isMirrored: boolean;
  isDarkMode: boolean; // High contrast toggle
  padding: number; // %
  presenterMode?: boolean;
  // New Advanced Settings
  lineHeight: number;
  fontFamily: string;
  customBackgroundColor?: string;
  customTextColor?: string;
  // Camera Settings
  cameraBrightness?: number; // 100 default
  cameraContrast?: number; // 100 default
  cameraZoom?: number; // 1 default
  cameraMirrored?: boolean; // true default
  
  // Advanced Camera Processing
  cameraFilters?: {
    saturation: number; // 100 default
    sepia: number; // 0 default
    blur: number; // 0 default
    grayscale: number; // 0 default
    hue: number; // 0 default
  };
  enableBeautyMode?: boolean; // Preset wrapper
  enableAudioEnhancement?: boolean; // Noise suppression
  
  // System
  enablePiP?: boolean; // Floating View Toggle
  enableVoiceControl?: boolean; // Voice Commands Toggle
}

export interface GlobalMessage {
  id: string;
  title: string;
  message: string;
  mediaType: 'none' | 'image' | 'video';
  mediaUrl?: string;
  createdAt: number;
  isActive: boolean;
  actionLink?: string; // Optional link button
}

export enum AppRoute {
  LOGIN = 'login',
  ONBOARDING = 'onboarding',
  HOME = 'home',
  GENERATOR = 'generator',
  TELEPROMPTER = 'teleprompter',
  LIBRARY = 'library',
  LIVE_ASSISTANT = 'live_assistant',
  ADMIN_PANEL = 'admin_panel',
  USER_SETTINGS = 'user_settings',
  GALLERY = 'gallery'
}

export interface AIRequestParams {
  topic: string;
  tone: string;
  duration: string; 
  additionalInfo?: string;
}

export type ApiProvider = 'gemini' | 'deepseek' | 'openai' | 'chatgpt' | 'custom';

export interface ApiConfig {
  id: string;
  provider: ApiProvider;
  name: string;
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
  isDefault: boolean;
}

export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
  photoUrl?: string;
}

export type ThemeId = 'classic_blue' | 'natural_green' | 'creative_purple' | 'energy_orange' | 'minimal_grey' | 'true_dark';

export interface Theme {
  id: ThemeId;
  name: string;
  gradient: string;
  primaryColor: string;
  accentColor: string;
}

export type Language = 'fa' | 'en';