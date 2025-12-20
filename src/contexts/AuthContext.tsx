import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import { getUserByUsername, updateUser, simulateDelay } from '@/lib/storage';
import { initializeSeedData } from '@/lib/seedData';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; requiresPasswordChange?: boolean }>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const hashPassword = (password: string): string => {
  return btoa(password);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize seed data if needed
        await initializeSeedData();
        
        // Check for existing session
        const sessionData = sessionStorage.getItem('sudind_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const userData = await getUserByUsername(session.username);
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    await simulateDelay(800);

    try {
      // Normalize username to lowercase for lookup
      const normalizedUsername = username.trim().toLowerCase();
      const userData = await getUserByUsername(normalizedUsername);
      
      // Debug logging
      console.log('Login attempt:', {
        providedUsername: username,
        normalizedUsername,
        userFound: !!userData,
        userId: userData?.id,
        userRole: userData?.role,
        passwordChanged: userData?.passwordChanged,
        storedPasswordLength: userData?.password?.length,
        storedPasswordPreview: userData?.password?.substring(0, 20) + '...',
      });
      
      if (!userData) {
        console.error('Login failed: User not found', { normalizedUsername });
        setIsLoading(false);
        return { success: false, error: 'Invalid username or password' };
      }

      // Hash the provided password for comparison
      const hashedPassword = hashPassword(password.trim());
      const inputPassword = password.trim();
      
      // Debug password comparison
      console.log('Password comparison:', {
        inputPassword,
        inputPasswordLength: inputPassword.length,
        hashedInputPassword: hashedPassword,
        hashedInputPasswordLength: hashedPassword.length,
        storedPassword: userData.password,
        storedPasswordLength: userData.password.length,
        passwordsMatch: userData.password === hashedPassword,
        storedPasswordDecoded: atob(userData.password),
        inputPasswordMatchesDecoded: atob(userData.password) === inputPassword,
      });
      
      // Compare passwords
      if (userData.password !== hashedPassword) {
        console.error('Login failed: Password mismatch', {
          storedPassword: userData.password,
          hashedInputPassword: hashedPassword,
          storedPasswordDecoded: atob(userData.password),
          inputPassword,
        });
        setIsLoading(false);
        return { success: false, error: 'Invalid username or password' };
      }

      // Check if password change is required (first-time login)
      if (!userData.passwordChanged) {
        setUser(userData);
        sessionStorage.setItem('sudind_session', JSON.stringify({ username: userData.username }));
        setIsLoading(false);
        return { success: true, requiresPasswordChange: true };
      }

      // Update last login for returning users
      const updatedUser = { ...userData, lastLogin: new Date().toISOString() };
      await updateUser(updatedUser);
      
      setUser(updatedUser);
      sessionStorage.setItem('sudind_session', JSON.stringify({ username: userData.username }));
      setIsLoading(false);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('sudind_session');
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Simulate real-time password update with delay
      await simulateDelay(800);
      
      const updatedUser = {
        ...user,
        password: hashPassword(newPassword),
        passwordChanged: true,
        lastLogin: new Date().toISOString(),
      };
      
      await updateUser(updatedUser);
      setUser(updatedUser);
      
      console.log('Password updated successfully:', {
        userId: updatedUser.id,
        username: updatedUser.username,
        passwordChanged: updatedUser.passwordChanged,
      });
      
      return true;
    } catch (error) {
      console.error('Password update error:', error);
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const sessionData = sessionStorage.getItem('medcoord_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const userData = await getUserByUsername(session.username);
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updatePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
