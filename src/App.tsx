import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { LandingPage } from './components/LandingPage';
import { MainApp } from './components/MainApp';
import { parseAuthTokenFromUrl, setStoredToken, getStoredToken } from './lib/auth';

function App() {
  const { auth, setAuth, theme } = useAppStore();

  // Theme application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.mode);
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme.mode]);

  // Auth Initialization
  useEffect(() => {
    // 1. Handle OAuth Redirect
    if (window.location.hash) {
      const token = parseAuthTokenFromUrl(window.location.hash);
      if (token) {
        setStoredToken(token);
        setAuth({
          isAuthenticated: true,
          accessToken: token.access_token,
          expiresAt: Date.now() + (parseInt(token.expires_in) * 1000)
        });
        window.history.replaceState(null, '', window.location.pathname); // Clean URL
      }
    }

    // 2. Check LocalStorage
    const stored = getStoredToken();
    if (stored) {
      setAuth({
        isAuthenticated: true,
        accessToken: stored.access_token,
        expiresAt: stored.expiresAt
      });
    }
  }, [setAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={auth.isAuthenticated ? <Navigate to="/drive" replace /> : <LandingPage />} />
        <Route path="/drive/*" element={auth.isAuthenticated ? <MainApp /> : <Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
