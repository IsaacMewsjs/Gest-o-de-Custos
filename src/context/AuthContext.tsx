import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseConfigurationError } from '../services/supabase';
import { usersService } from '../services/database';

interface AuthContextType {
  isAuthenticated: boolean;
  isPasswordRecovery: boolean;
  configurationError: string | null;
  userEmail: string | null;
  userId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isRecoveryRedirect = () => {
  if (typeof window === 'undefined') return false;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  return hashParams.get('type') === 'recovery' || searchParams.get('type') === 'recovery';
};

const clearRecoveryRedirect = () => {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(isRecoveryRedirect);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        if (supabaseConfigurationError) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuthenticated(true);
          setUserEmail(user.email || null);
          setUserId(user.id);
          if (isRecoveryRedirect()) setIsPasswordRecovery(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
        setUserId(session.user.id);
        if (event === 'PASSWORD_RECOVERY' || isRecoveryRedirect()) {
          setIsPasswordRecovery(true);
          clearRecoveryRedirect();
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserId(null);
        if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.user) {
        setIsAuthenticated(true);
        setUserEmail(data.user.email || null);
        setUserId(data.user.id);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        // Create user profile in database
        await usersService.createUserProfile(data.user.id, email, displayName);
        
        setIsAuthenticated(true);
        setUserEmail(data.user.email || null);
        setUserId(data.user.id);
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setIsAuthenticated(false);
      setIsPasswordRecovery(false);
      setUserEmail(null);
      setUserId(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isPasswordRecovery, configurationError: supabaseConfigurationError, userEmail, userId, loading, login, signup, resetPassword, updatePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
