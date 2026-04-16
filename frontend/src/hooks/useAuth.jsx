import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vt');
    if (token) {
      getMe()
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('vt'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = (token, userData) => {
    localStorage.setItem('vt', token);
    setUser(userData);
  };

  const signOut = () => {
    localStorage.removeItem('vt');
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
