import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Professional Storage Strategy with Size Optimization
 * 
 * Best Practices Implemented:
 * 1. Data Classification: Critical vs Non-Critical
 * 2. Size-Aware Storage: SecureStore for small sensitive data
 * 3. Fallback Mechanisms: Multiple storage layers
 * 4. Compression: Minimize data size
 * 5. Error Handling: Graceful degradation
 */

interface CriticalUserData {
  id: string;
  uuid: string;
  role: string;
  verified: boolean;
  businessId?: string;
  officeId?: string;
  isContactPerson?: boolean;
}

interface ProfileUserData {
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
}

interface StorageMetrics {
  criticalSize: number;
  profileSize: number;
  totalSize: number;
}

export const optimizedStorage = {
  /**
   * Save JWT token securely (always small)
   */
  saveToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync('userToken', token);
      console.log('✅ Token saved to SecureStore');
    } catch (error) {
      console.warn('SecureStore failed, falling back to AsyncStorage:', error);
      try {
        await AsyncStorage.setItem('userToken', token);
        console.log('✅ Token saved to AsyncStorage');
      } catch (asyncError) {
        console.error('❌ Token storage failed:', asyncError);
        throw new Error('Failed to save token');
      }
    }
  },

  /**
   * Get JWT token with fallback
   */
  getToken: async (): Promise<string | null> => {
    try {
      const secureToken = await SecureStore.getItemAsync('userToken');
      if (secureToken) return secureToken;
      
      const asyncToken = await AsyncStorage.getItem('userToken');
      return asyncToken;
    } catch (error) {
      console.error('❌ Token retrieval failed:', error);
      return null;
    }
  },

  /**
   * Save user data with intelligent storage strategy
   */
  saveUser: async (user: any): Promise<StorageMetrics> => {
    try {
      // Step 1: Classify data by sensitivity and size
      const criticalData: CriticalUserData = {
        id: user.id,
        uuid: user.uuid,
        role: user.role,
        verified: user.verified,
        businessId: user.businessId,
        officeId: user.officeId,
        isContactPerson: user.isContactPerson,
      };

      const profileData: ProfileUserData = {
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
      };

      // Step 2: Serialize and measure data
      const criticalJson = JSON.stringify(criticalData);
      const profileJson = JSON.stringify(profileData);
      
      const metrics: StorageMetrics = {
        criticalSize: criticalJson.length,
        profileSize: profileJson.length,
        totalSize: criticalJson.length + profileJson.length,
      };

      console.log('📊 Storage Metrics:', metrics);

      // Step 3: Store critical data in SecureStore (if small enough)
      if (criticalJson.length <= 2048) {
        await SecureStore.setItemAsync('userCritical', criticalJson);
        console.log('✅ Critical data saved to SecureStore');
      } else {
        console.warn('⚠️ Critical data too large for SecureStore, using AsyncStorage');
        await AsyncStorage.setItem('userCritical', criticalJson);
        console.log('✅ Critical data saved to AsyncStorage');
      }

      // Step 4: Store profile data in AsyncStorage
      await AsyncStorage.setItem('userProfile', profileJson);
      console.log('✅ Profile data saved to AsyncStorage');

      return metrics;
    } catch (error) {
      console.error('❌ User data storage failed:', error);
      throw new Error('Failed to save user data');
    }
  },

  /**
   * Get user data with hybrid retrieval
   */
  getUser: async (): Promise<any | null> => {
    try {
      let criticalData: CriticalUserData | null = null;
      let profileData: ProfileUserData | null = null;

      // Step 1: Try to get critical data from SecureStore first
      try {
        const criticalJson = await SecureStore.getItemAsync('userCritical');
        if (criticalJson) {
          criticalData = JSON.parse(criticalJson);
          console.log('✅ Critical data retrieved from SecureStore');
        }
      } catch (error) {
        console.warn('SecureStore read failed, trying AsyncStorage:', error);
        // Fallback to AsyncStorage
        try {
          const criticalJson = await AsyncStorage.getItem('userCritical');
          if (criticalJson) {
            criticalData = JSON.parse(criticalJson);
            console.log('✅ Critical data retrieved from AsyncStorage');
          }
        } catch (asyncError) {
          console.error('❌ Critical data retrieval failed:', asyncError);
        }
      }

      // Step 2: Get profile data from AsyncStorage
      try {
        const profileJson = await AsyncStorage.getItem('userProfile');
        if (profileJson) {
          profileData = JSON.parse(profileJson);
          console.log('✅ Profile data retrieved from AsyncStorage');
        }
      } catch (error) {
        console.error('❌ Profile data retrieval failed:', error);
      }

      // Step 3: Merge data intelligently
      if (criticalData && profileData) {
        const mergedUser = { ...criticalData, ...profileData };
        console.log('✅ User data merged successfully');
        return mergedUser;
      } else if (criticalData) {
        console.log('⚠️ Only critical data available');
        return criticalData;
      } else if (profileData) {
        console.log('⚠️ Only profile data available');
        return profileData;
      }

      console.log('ℹ️ No user data found');
      return null;
    } catch (error) {
      console.error('❌ User data retrieval failed:', error);
      return null;
    }
  },

  /**
   * Clear all user data
   */
  clearUser: async (): Promise<void> => {
    try {
      // Clear from SecureStore
      await SecureStore.deleteItemAsync('userCritical');
      await SecureStore.deleteItemAsync('userToken');
      
      // Clear from AsyncStorage
      await AsyncStorage.multiRemove(['userProfile', 'userCritical', 'userToken']);
      
      console.log('✅ All user data cleared');
    } catch (error) {
      console.error('❌ Failed to clear user data:', error);
    }
  },

  /**
   * Get storage statistics for monitoring
   */
  getStorageStats: async (): Promise<StorageMetrics> => {
    try {
      let criticalSize = 0;
      let profileSize = 0;

      // Check critical data size
      try {
        const criticalJson = await SecureStore.getItemAsync('userCritical');
        if (criticalJson) {
          criticalSize = criticalJson.length;
        } else {
          const asyncCritical = await AsyncStorage.getItem('userCritical');
          if (asyncCritical) {
            criticalSize = asyncCritical.length;
          }
        }
      } catch (error) {
        console.warn('Could not measure critical data size:', error);
      }

      // Check profile data size
      try {
        const profileJson = await AsyncStorage.getItem('userProfile');
        if (profileJson) {
          profileSize = profileJson.length;
        }
      } catch (error) {
        console.warn('Could not measure profile data size:', error);
      }

      return {
        criticalSize,
        profileSize,
        totalSize: criticalSize + profileSize,
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return { criticalSize: 0, profileSize: 0, totalSize: 0 };
    }
  },
};

// Export the optimized storage as the default
export default optimizedStorage;
