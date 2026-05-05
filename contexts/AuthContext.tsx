import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import app from '../firebase.config';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string; name: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;
    // D4: firebase/auth carregado lazy — não bloqueia o bundle principal
    import('firebase/auth').then(({ getAuth, onAuthStateChanged }) => {
      const auth = getAuth(app);
      unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        if (firebaseUser) {
          setIsAuthenticated(true);
          setUser({ email: firebaseUser.email ?? '', name: 'Fernanda Mangia' });
      } else {
        setIsAuthenticated(false);
          setUser(null);
        }
        setLoading(false);
      });
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(getAuth(app), email, password);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    const { getAuth, signOut } = await import('firebase/auth');
    await signOut(getAuth(app));
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
