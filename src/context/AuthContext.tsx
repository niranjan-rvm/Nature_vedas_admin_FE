import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; mobileNo?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('nature_vedas_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('nature_vedas_admin_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if token exists and is valid
    if (token) {
      api.getProfile('me')
        .then((fetchedUser) => {
          if (fetchedUser.role !== 'admin') {
            logout();
          } else {
            setUser(fetchedUser);
            localStorage.setItem('nature_vedas_admin_user', JSON.stringify(fetchedUser));
          }
        })
        .catch(() => {
          // If profile check fails, keep existing state or logout if expired
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    if (!res.token) {
      throw new Error('No authorization token received');
    }

    if (res.user.role !== 'admin') {
      throw new Error('Access denied: Only administrators can access this portal.');
    }

    localStorage.setItem('nature_vedas_admin_token', res.token);
    localStorage.setItem('nature_vedas_admin_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: { username: string; email: string; password: string; mobileNo?: string }) => {
    const res = await api.register({ ...data, role: 'admin' });
    if (!res.token) {
      throw new Error('No authorization token received');
    }

    if (res.user.role !== 'admin') {
      throw new Error('Access denied: Only administrators can access this portal.');
    }

    localStorage.setItem('nature_vedas_admin_token', res.token);
    localStorage.setItem('nature_vedas_admin_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('nature_vedas_admin_token');
    localStorage.removeItem('nature_vedas_admin_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
