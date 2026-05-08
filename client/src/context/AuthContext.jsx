import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/axiosInstance';

const AuthContext = createContext(null);
const TOKEN_KEY = 'qz_token';
const USER_KEY  = 'qz_user';

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}
function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  // Synchronous init — user is available immediately on mount, no flicker
  const [user,    setUser]    = useState(readStoredUser);
  const [loading, setLoading] = useState(false); // ← false always; we don't block on /auth/me
  const didVerify = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || didVerify.current) return;
    didVerify.current = true;

    let active = true;
    api.get('/auth/me')
      .then(({ data }) => {
        if (!active) return;
        // Refresh stored user with latest data from server
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        console.log('[Auth] Session verified ✅', data.user?.name);
      })
      .catch((err) => {
        if (!active) return;
        const status = err.response?.status;
        console.warn('[Auth] /auth/me status:', status ?? 'network error', err.message);

        // ── KEY CHANGE ──────────────────────────────────────────────────
        // We do NOT clear the session here, no matter what.
        // If /auth/me returns 401 it usually means:
        //   • JWT_SECRET not set correctly in server/.env
        //   • Server restarted with a different secret
        //   • CORS blocking the request in dev
        // The user is kept logged in using their stored data.
        // They will get a real 401 the moment they try a protected action
        // (submit a quiz, load quizzes, etc.) and THAT 401 triggers logout.
        // ────────────────────────────────────────────────────────────────
        if (status === 401) {
          console.warn('[Auth] /auth/me returned 401 — check JWT_SECRET in server/.env');
          console.warn('[Auth] Keeping stored session. Protected API calls will handle real expiry.');
        }
      });

    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data.token, data.user);
    didVerify.current = true; // fresh from server — no need to re-verify
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, adminCode) => {
    const { data } = await api.post('/auth/register', { name, email, password, adminCode });
    saveSession(data.token, data.user);
    didVerify.current = true;
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearSession();
    didVerify.current = false;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};