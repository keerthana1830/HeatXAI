import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/api';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';


export const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Failed to restore auth session:', err);
          authService.logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wider text-slate-400">Loading Platform Context...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Landing theme={theme} toggleTheme={toggleTheme} />
          }
        />
        <Route
          path="/landing"
          element={
            <Navigate to="/" replace />
          }
        />
        <Route
          path="/project-dashboard/*"
          element={
            <Dashboard user={{ role: 'guest', full_name: 'Guest User' }} isGuest={true} setUser={setUser} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
          }
        />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/user-dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} theme={theme} toggleTheme={toggleTheme} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to="/user-dashboard" replace />
            ) : (
              <Signup theme={theme} toggleTheme={toggleTheme} />
            )
          }
        />
        <Route
          path="/user-dashboard/*"
          element={
            user ? (
              <Dashboard user={user} setUser={setUser} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <Navigate to="/user-dashboard" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

