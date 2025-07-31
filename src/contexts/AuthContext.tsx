// Authentication context for WordPress user integration
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { authAPI } from '../utils/api';

interface WordPressUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  roles: string[];
}

interface AuthContextType {
  user: WordPressUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: WordPressUser) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useLocalStorage<string | null>('emuskin-auth-token', null);
  const [user, setUser] = useLocalStorage<WordPressUser | null>('emuskin-user', null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!(token && user);

  // Validate token on app startup
  useEffect(() => {
    const validateToken = async () => {
      if (token && user) {
        try {
          // Try to validate with the real API
          const { valid, user: validatedUser } = await authAPI.validateToken();
          if (valid && validatedUser) {
            setUser(validatedUser);
          } else {
            setToken(null);
            setUser(null);
          }
          setIsLoading(false);
        } catch (error) {
          // In development, assume token is valid if API is not available
          if (import.meta.env.DEV) {
            console.warn('Token validation failed, assuming valid in development mode');
            setIsLoading(false);
          } else {
            console.error('Token validation failed:', error);
            setToken(null);
            setUser(null);
            setIsLoading(false);
          }
        }
      } else {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []); // Remove token and user from dependencies to prevent loops

  const login = (newToken: string, newUser: WordPressUser) => {
    setToken(newToken);
    setUser(newUser);
    setIsLoading(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // Clear any cached project data
    // TODO: Implement proper cleanup when switching from cloud to local storage
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const { token: newToken, user: updatedUser } = await authAPI.refreshToken();
      setToken(newToken);
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // In development mode, don't logout on refresh failure
      if (!import.meta.env.DEV) {
        logout();
      }
      return false;
    }
  };


  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};