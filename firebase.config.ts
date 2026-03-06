import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
// INSTRUÇÕES: Substitua com suas próprias credenciais do Firebase Console
// 1. Acesse: https://console.firebase.google.com/
// 2. Crie um projeto ou use um existente
// 3. Vá em "Configurações do Projeto" > "Geral"
// 4. Role até "Seus apps" e clique em "Web" (ícone </>)
// 5. Copie as configurações e cole abaixo

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fernanda-psicologia.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fernanda-psicologia",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fernanda-psicologia.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
