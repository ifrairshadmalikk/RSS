import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

function normalizeUser(user) {
  return user ? { id: user.id || user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture } : null;
}

function storeSession(token, user) {
  const userData = normalizeUser(user);
  localStorage.setItem('trend_token', token);
  localStorage.setItem('trend_user', JSON.stringify(userData));
  return userData;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('trend_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('trend_token')));

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('trend_token');
    if (!token) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    api.get('/auth/me')
      .then(({ data }) => {
        if (!active) return;
        const userData = normalizeUser(data.user);
        localStorage.setItem('trend_user', JSON.stringify(userData));
        setUser(userData);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    const userData = storeSession(data.token, data.user);
    setUser(userData);
  }

  async function signup(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    const userData = storeSession(data.token, data.user);
    setUser(userData);
  }

  function updateUser(nextUser) {
    const userData = normalizeUser({ ...user, ...nextUser });
    localStorage.setItem('trend_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('trend_token');
    localStorage.removeItem('trend_user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, signup, logout, updateUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
