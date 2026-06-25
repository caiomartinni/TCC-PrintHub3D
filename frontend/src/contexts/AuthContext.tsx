import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { User, AuthState } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ token: string; refreshToken: string; user: User }>;
  register: (data: { email: string; password: string; name: string; phone?: string; role?: string }) => Promise<{ token: string; refreshToken: string; user: User }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('printhub_token'),
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('printhub_token');
    if (!token) {
      setState((s) => ({ ...s, isLoading: false, isAuthenticated: false }));
      return;
    }
    try {
      const user = await authService.me();
      setState({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('printhub_token');
      localStorage.removeItem('printhub_refresh');
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // sincroniza estado de auth quando localStorage muda em outra aba (login/logout simultâneo)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'printhub_token') {
        if (!e.newValue) {
          setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
        } else if (e.newValue !== e.oldValue) {
          refreshUser();
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    localStorage.setItem('printhub_token', result.token);
    localStorage.setItem('printhub_refresh', result.refreshToken);
    setState({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false });
    return result;
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string; role?: string }) => {
    const result = await authService.register(data);
    localStorage.setItem('printhub_token', result.token);
    localStorage.setItem('printhub_refresh', result.refreshToken);
    setState({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false });
    return result;
  };

  const logout = () => {
    localStorage.removeItem('printhub_token');
    localStorage.removeItem('printhub_refresh');
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
