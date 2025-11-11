import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Platform-aware storage for tokens
const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem('userToken');
    } else {
      // Try SecureStore first on native
      const secureToken = await SecureStore.getItemAsync('userToken');
      if (secureToken) return secureToken;
      
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem('userToken');
    }
  } catch (error) {
    console.warn('Failed to get token:', error);
    return null;
  }
};

const saveToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem('userToken', token);
    } else {
      try {
        await SecureStore.setItemAsync('userToken', token);
      } catch (error) {
        console.warn('SecureStore failed, falling back to AsyncStorage:', error);
        await AsyncStorage.setItem('userToken', token);
      }
    }
  } catch (error) {
    console.error('Error saving token:', error);
    throw new Error('Failed to save token');
  }
};

const removeToken = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem('userToken');
    } else {
      try {
        await SecureStore.deleteItemAsync('userToken');
      } catch (error) {
        console.warn('SecureStore remove failed:', error);
      }
      try {
        await AsyncStorage.removeItem('userToken');
      } catch (error) {
        console.error('Error removing token from AsyncStorage:', error);
      }
    }
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Secure storage for sensitive data (tokens) with AsyncStorage fallback
export const secureStorage = {
  // Save JWT token securely
  saveToken,
  
  // Get JWT token
  getToken,
  
  // Remove JWT token
  removeToken,


  // Save user data securely
  saveUser: async (user: any): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
      } else {
        try {
          await SecureStore.setItemAsync('userData', JSON.stringify(user));
        } catch (error) {
          console.warn('SecureStore failed, falling back to AsyncStorage:', error);
          await AsyncStorage.setItem('userData', JSON.stringify(user));
        }
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      throw new Error('Failed to save user data');
    }
  },

  // Get user data
  getUser: async (): Promise<any | null> => {
    try {
      if (Platform.OS === 'web') {
        const asyncUserData = await AsyncStorage.getItem('userData');
        return asyncUserData ? JSON.parse(asyncUserData) : null;
      } else {
        // Try SecureStore first
        const secureUserData = await SecureStore.getItemAsync('userData');
        if (secureUserData) return JSON.parse(secureUserData);
        
        // Fallback to AsyncStorage
        const asyncUserData = await AsyncStorage.getItem('userData');
        return asyncUserData ? JSON.parse(asyncUserData) : null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Remove user data
  removeUser: async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem('userData');
      } else {
        try {
          await SecureStore.deleteItemAsync('userData');
        } catch (error) {
          console.warn('SecureStore remove failed:', error);
        }
        try {
          await AsyncStorage.removeItem('userData');
        } catch (error) {
          console.error('Error removing user from AsyncStorage:', error);
        }
      }
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  },
};

// AsyncStorage for non-sensitive data
export const asyncStorage = {
  // Save business data
  saveBusiness: async (business: any): Promise<void> => {
    try {
      await AsyncStorage.setItem('businessData', JSON.stringify(business));
    } catch (error) {
      console.error('Error saving business:', error);
    }
  },

  // Get business data
  getBusiness: async (): Promise<any | null> => {
    try {
      const businessData = await AsyncStorage.getItem('businessData');
      return businessData ? JSON.parse(businessData) : null;
    } catch (error) {
      console.error('Error getting business:', error);
      return null;
    }
  },

  // Save office data
  saveOffice: async (office: any): Promise<void> => {
    try {
      await AsyncStorage.setItem('officeData', JSON.stringify(office));
    } catch (error) {
      console.error('Error saving office:', error);
    }
  },

  // Get office data
  getOffice: async (): Promise<any | null> => {
    try {
      const officeData = await AsyncStorage.getItem('officeData');
      return officeData ? JSON.parse(officeData) : null;
    } catch (error) {
      console.error('Error getting office:', error);
      return null;
    }
  },

  // Clear all data
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
      await secureStorage.removeToken();
      await secureStorage.removeUser();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

// Combined storage operations
export const storage = {
  // Save authentication data
  saveAuthData: async (user: any, token: string): Promise<void> => {
    await Promise.all([
      secureStorage.saveUser(user),
      secureStorage.saveToken(token),
    ]);
  },

  // Get authentication data
  getAuthData: async (): Promise<{ user: any | null; token: string | null }> => {
    const [user, token] = await Promise.all([
      secureStorage.getUser(),
      secureStorage.getToken(),
    ]);
    return { user, token };
  },

  // Clear authentication data
  clearAuthData: async (): Promise<void> => {
    await Promise.all([
      secureStorage.removeUser(),
      secureStorage.removeToken(),
    ]);
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const token = await secureStorage.getToken();
    return !!token;
  },
};
