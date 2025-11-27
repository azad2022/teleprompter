import { initializeApp, FirebaseApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";

// Default placeholder config - User needs to update this via UI or Code
const defaultFirebaseConfig = {
  apiKey: "AIzaSyD-PLACEHOLDER-KEY-FOR-DEMO", 
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

export const initializeFirebase = (configStr?: string) => {
  try {
    const config = configStr ? JSON.parse(configStr) : defaultFirebaseConfig;
    
    // Check if already initialized to avoid errors
    if (!app) {
      // Robust check: if firebase runtime already has an app (from a previous attempt that partly failed or HMR), use it.
      if (getApps().length > 0) {
        app = getApp();
      } else {
        app = initializeApp(config);
      }
      
      // Initialize auth immediately to catch "auth not registered" errors early
      const newAuth = getAuth(app); 
      
      // If successful, assign to module-level variables
      auth = newAuth;
      googleProvider = new GoogleAuthProvider();
      
      // Force language to Persian
      auth.languageCode = 'fa';
    }
    
    return { app, auth, googleProvider, isConfigured: !!configStr };
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
    // Reset state if initialization failed to allow retry
    app = undefined;
    auth = undefined;
    googleProvider = undefined;
    throw error;
  }
};

export const getFirebaseAuth = () => {
  if (!auth) {
    // Try to load from localStorage if available
    const savedConfig = localStorage.getItem('firebase_config');
    initializeFirebase(savedConfig || undefined);
  }
  
  if (!auth || !googleProvider) {
    throw new Error("Firebase Auth not initialized correctly");
  }

  return { auth, googleProvider };
};

export const saveFirebaseConfig = (config: string) => {
  localStorage.setItem('firebase_config', config);
  // Reload page to apply changes cleanly
  window.location.reload();
};

export const resetFirebaseConfig = () => {
  localStorage.removeItem('firebase_config');
  window.location.reload();
};