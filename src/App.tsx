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
    // 1. Apply Mode (Light/Dark)
    document.documentElement.setAttribute('data-theme', theme.mode);
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Apply Accent Color
    if (theme.accentColor) {
      document.documentElement.style.setProperty('--accent', theme.accentColor);
      // For now, setting hover to same or could create variation if we had utils
      document.documentElement.style.setProperty('--accent-hover', theme.accentColor);
    } else {
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-hover');
    }
  }, [theme]);

  // Auth Initialization
  useEffect(() => {
    // 2. Check LocalStorage
    const stored = getStoredToken();
    if (stored) {
      setAuth({
        isAuthenticated: true,
        accessToken: stored.access_token,
        expiresAt: stored.expiresAt
      });
      // Fetch fresh user info
      import('./lib/drive').then(({ getUserInfo }) => {
        getUserInfo().then(user => {
          setAuth({ user });
        }).catch(console.error);
      });
    }

    // 1. Handle OAuth Redirect (run after checking storage logic to handle hash param priority)
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

        // Fetch user info immediately for new login
        import('./lib/drive').then(({ getUserInfo }) => {
          getUserInfo().then(user => {
            setAuth({ user });
          }).catch(console.error);
        });
      }
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
