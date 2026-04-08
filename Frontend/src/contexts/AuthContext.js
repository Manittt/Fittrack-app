import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('fitness_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
          timeout: 8000, // don't hang forever
        });
        // Token is valid — restore session
        setUser(response.data);
        setToken(savedToken);
      } catch (error) {
        // Only clear token on actual auth failures (401/403), not network errors
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem('fitness_token');
        }
        // On network error / timeout, keep token so next refresh can retry
        // User stays logged out visually but token isn't nuked
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('fitness_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return response.data;
  };

  const register = async (name, email, password, invite_code = null) => {
    const payload = { name, email, password };
    if (invite_code) payload.invite_code = invite_code;
    // Register now just sends email back, no token — user must verify first
    const response = await axios.post(`${API}/auth/register`, payload);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('fitness_token');
    setToken(null);
    setUser(null);
  };

  const setUserFromResponse = ({ token: newToken, user: newUser }) => {
    if (newToken) {
      localStorage.setItem('fitness_token', newToken);
      setToken(newToken);
    }
    setUser(newUser);
  };

  const getAuthHeader = () => {
    const t = token || localStorage.getItem('fitness_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, getAuthHeader, setUserFromResponse }}>
      {children}
    </AuthContext.Provider>
  );
};