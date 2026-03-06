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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCRvfGfgfM-F1cUzPB7naLUNmQGxgJ59jc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fernanda-psicologia.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fernanda-psicologia",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fernanda-psicologia.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "307579672694",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:307579672694:web:388a5353fa8d2f5d88a757",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D06JF85TCL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
