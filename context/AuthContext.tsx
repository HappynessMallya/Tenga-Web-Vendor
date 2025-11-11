import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type User = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  country: string;
  profileImage?: string;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  signIn: (phoneNumber: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>('mock-token'); // Set to mock-token for demo
  const [user, setUser] = useState<User | null>({
    id: '1',
    fullName: 'Happy Mallya',
    email: 'happy@example.com',
    phoneNumber: '+255123456789',
    country: 'Tanzania',
    profileImage: undefined,
  });

  const signIn = useCallback(async (phoneNumber: string, password: string) => {
    try {
      // TODO: Replace with actual API call
      // For now, simulate successful login
      if (phoneNumber && password) {
        setToken('mock-token');
        setUser({
          id: '1',
          fullName: 'Business Owner',
          email: 'owner@business.com',
          phoneNumber: phoneNumber,
          country: 'Tanzania',
          profileImage: undefined,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);


  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (userData: Partial<User>) => {
    // TODO: real API call to update profile
    if (user) {
      setUser({ ...user, ...userData });
    }
  }, [user]);

  const value = useMemo(() => ({ 
    token, 
    user, 
    signIn, 
    signOut, 
    updateProfile 
  }), [token, user, signIn, signOut, updateProfile]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


