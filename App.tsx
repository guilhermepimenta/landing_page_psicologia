import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// C1: React.lazy — Dashboard, BlogPost e Login não bloqueiam o bundle da landing page
const BlogPost                  = lazy(() => import('./components/BlogPost').then(m => ({ default: m.BlogPost ?? m.default })));
const Login                     = lazy(() => import('./components/Login'));
const Dashboard                 = lazy(() => import('./components/Dashboard'));
const ProtectedRoute            = lazy(() => import('./components/ProtectedRoute'));
const AvaliacaoNeuropsicologica = lazy(() => import('./components/AvaliacaoNeuropsicologica'));

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
    <div className="w-8 h-8 border-4 border-[#4A5D4A]/30 border-t-[#4A5D4A] rounded-full animate-spin" />
  </div>
);

const AppRoutes: React.FC = () => {
  const { login } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/avaliacao-neuropsicologica" element={<AvaliacaoNeuropsicologica />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/login" element={<Login onLogin={login} />} />
        
        {/* Rotas Protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
