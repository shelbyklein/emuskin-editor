// Authentication context for WordPress user integration
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { authAPI } from '../utils/api';
import { userDatabase } from '../utils/userDatabase';

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
  logout: (onLogoutComplete?: () => void) => void;
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
          // Validate token locally (no API call to avoid 400 error)
          const { valid, user: validatedUser } = await authAPI.validateToken();
          if (valid && validatedUser) {
            // Update user data if needed
            if (validatedUser.email !== user.email) {
              setUser(validatedUser);
            }
            
            // Run migration for existing user on app startup
            const projectsJson = localStorage.getItem('emuskin-projects-v2');
            if (projectsJson) {
              try {
                const allProjects = JSON.parse(projectsJson);
                const userProjectIds = allProjects
                  .filter((p: any) => p.userId === validatedUser.id)
                  .map((p: any) => p.id);
                
                if (userProjectIds.length > 0) {
                  userDatabase.migrateUserProjects(validatedUser.email, userProjectIds);
                  console.log(`Migrated ${userProjectIds.length} existing projects on startup for ${validatedUser.email}`);
                }
              } catch (error) {
                console.error('Failed to migrate projects on startup:', error);
              }
            }
          } else {
            // Token is invalid or expired
            console.log('Token validation failed - clearing auth state');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Token validation error:', error);
          // Clear auth state on error
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    validateToken();
  }, []); // Remove token and user from dependencies to prevent loops

  const login = (newToken: string, newUser: WordPressUser) => {
    setToken(newToken);
    setUser(newUser);
    setIsLoading(false);
    
    // Record login in user database
    userDatabase.recordLogin(newUser.email);
    console.log('User login recorded in database for:', newUser.email);
    
    // Migrate existing projects to user database
    setTimeout(() => {
      // Get all projects from localStorage
      const projectsJson = localStorage.getItem('emuskin-projects-v2');
      if (projectsJson) {
        try {
          const allProjects = JSON.parse(projectsJson);
          // Filter projects that belong to this user
          const userProjectIds = allProjects
            .filter((p: any) => p.userId === newUser.id)
            .map((p: any) => p.id);
          
          if (userProjectIds.length > 0) {
            userDatabase.migrateUserProjects(newUser.email, userProjectIds);
            console.log(`Migrated ${userProjectIds.length} existing projects for user ${newUser.email}`);
          }
        } catch (error) {
          console.error('Failed to migrate projects:', error);
        }
      }
    }, 100); // Small delay to ensure database is ready
  };

  const logout = (onLogoutComplete?: () => void) => {
    setToken(null);
    setUser(null);
    // Clear any cached project data
    // TODO: Implement proper cleanup when switching from cloud to local storage
    
    // Call the optional callback after logout
    if (onLogoutComplete) {
      onLogoutComplete();
    }
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