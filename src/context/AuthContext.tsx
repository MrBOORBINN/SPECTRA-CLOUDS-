// AuthContext Provider for INFHOST
// Integrates Firebase Authentication (Google popup) and email credentials

import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { User } from '../types';
import { api, setSessionToken, clearSessionToken, getSessionToken } from '../lib/api';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  credits: number;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  switchAccount: (role: 'USER' | 'ADMIN') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
      setCredits(res.credits);
    } catch {
      clearSessionToken();
      setUser(null);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getSessionToken();
      if (token) {
        await refreshUser();
      } else {
        // Auto sign-in as default user (infbuisness01@gmail.com)
        try {
          const res = await api.login({ email: 'infbuisness01@gmail.com', password: 'password123' });
          if (res.token) {
            setSessionToken(res.token);
            setUser(res.user);
            const userDetails = await api.getCurrentUser();
            setCredits(userDetails.credits);
          }
        } catch (e) {
          console.error('Initial login error:', e);
        } finally {
          setLoading(false);
        }
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setSessionToken(res.token);
      setUser(res.user);
      const userDetails = await api.getCurrentUser();
      setCredits(userDetails.credits);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.register({ email, username, password });
      setSessionToken(res.token);
      setUser(res.user);
      const userDetails = await api.getCurrentUser();
      setCredits(userDetails.credits);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbEmail = cred.user.email || 'infbuisness01@gmail.com';
      const fbName = cred.user.displayName || fbEmail.split('@')[0];

      // Authenticate with backend
      let res;
      try {
        res = await api.login({ email: fbEmail, password: 'password123' });
      } catch {
        res = await api.register({ email: fbEmail, username: fbName, password: 'password123' });
      }

      if (res.token) {
        setSessionToken(res.token);
        setUser(res.user);
        const userDetails = await api.getCurrentUser();
        setCredits(userDetails.credits);
      }
    } catch (err: any) {
      console.error('Firebase Google Auth error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      await fbSignOut(auth).catch(() => {});
    } catch {
      // ignore
    }
    clearSessionToken();
    setUser(null);
    setCredits(0);
  };

  const switchAccount = async (targetRole: 'USER' | 'ADMIN') => {
    setLoading(true);
    try {
      if (targetRole === 'ADMIN') {
        await login('admin@infhost.net', 'admin123');
      } else {
        await login('infbuisness01@gmail.com', 'password123');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        credits,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        switchAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
