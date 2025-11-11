import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AuthResponse, authService, User } from '../services/api';
import { optimizedStorage } from '../utils/optimizedStorage';
import { logStorageMetrics } from '../utils/storageMonitor';
import { useBusinessStore } from './businessStore';

// User State Interface
interface UserState {
  // Authentication State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => Promise<void>;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Authentication Actions
  login: (phoneNumber: string, password: string, countryCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
  
  // Profile Actions
  updateProfile: (userData: Partial<User>) => Promise<void>;
  
  // Callbacks
  onPartnerAdminLogin?: (user: User) => Promise<void>;
  setPartnerAdminCallback: (callback: (user: User) => Promise<void>) => void;
  
  // Clear state
  clearState: () => void;
}

// Create optimized storage adapter
const optimizedStorageAdapter = createJSONStorage(() => ({
  setItem: async (name: string, value: any) => {
    if (name === 'userToken') {
      await optimizedStorage.saveToken(value);
    } else if (name === 'userData') {
      await optimizedStorage.saveUser(value);
    }
  },
  getItem: async (name: string) => {
    if (name === 'userToken') {
      return await optimizedStorage.getToken();
    } else if (name === 'userData') {
      return await optimizedStorage.getUser();
    }
    return null;
  },
  removeItem: async (name: string) => {
    if (name === 'userToken' || name === 'userData') {
      await optimizedStorage.clearUser();
    }
  },
}));

// Create user store with Zustand
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      onPartnerAdminLogin: undefined,

      // Basic Setters
      setUser: async (user: User | null) => {
        set({ user });
        if (user) {
          try {
            // Use optimized storage strategy
            const metrics = await optimizedStorage.saveUser(user);
            console.log('💾 User Store: User data saved with metrics:', metrics);
            
            // Log storage metrics for monitoring
            await logStorageMetrics('User Data Save');
            
            // Log warning if approaching limits
            if (metrics.totalSize > 1500) {
              console.warn('⚠️ User Store: Approaching storage limits, consider data optimization');
            }
          } catch (error) {
            console.error('❌ User Store: Failed to save user data:', error);
          }
        } else {
          // Clear user data when setting to null
          try {
            await optimizedStorage.clearUser();
            console.log('💾 User Store: User data cleared');
          } catch (error) {
            console.error('❌ User Store: Failed to clear user data:', error);
          }
        }
      },
      setToken: async (token: string | null) => {
        set({ token, isAuthenticated: !!token });
        if (token) {
          try {
            await optimizedStorage.saveToken(token);
            console.log('💾 User Store: Token saved securely');
          } catch (error) {
            console.error('❌ User Store: Failed to save token:', error);
          }
        }
      },
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      setPartnerAdminCallback: (callback: (user: User) => Promise<void>) => set({ onPartnerAdminLogin: callback }),

      // Authentication Actions
      login: async (phoneNumber: string, password: string, countryCode?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response: AuthResponse = await authService.loginUser({
            phoneNumber,
            password,
            countryCode,
          });

          if (response.success && response.token && response.user) {
            try {
              // Use optimized storage strategy
              await optimizedStorage.saveToken(response.token);
              const metrics = await optimizedStorage.saveUser(response.user);
              console.log('💾 User Store: Login data saved with metrics:', metrics);
            } catch (storageError) {
              console.warn('Storage error during login, but continuing:', storageError);
              // Continue with login even if storage fails
            }

            // Update Zustand state
            console.log('Setting user data in store:', response.user);
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // For PARTNER_ADMIN and STAFF users, handle business setup
            if (response.user.role === 'PARTNER_ADMIN' || response.user.role === 'STAFF') {
              try {
                console.log('🔍 Business user login detected:', {
                  userId: response.user.id,
                  role: response.user.role,
                  businessIdFromResponse: response.user.businessId,
                  businessName: response.user.business?.name || response.user.primaryBusiness?.name || 'None'
                });
                
                // Import business store to handle business setup
                const { useBusinessStore } = require('./businessStore');
                const businessStore = useBusinessStore.getState();
                
                if (response.user.role === 'PARTNER_ADMIN') {
                  await businessStore.handlePartnerAdminLogin(response.user);
                  console.log('✅ PARTNER_ADMIN business setup completed');
                } else if (response.user.role === 'STAFF') {
                  await businessStore.handleStaffLogin(response.user);
                  console.log('✅ STAFF business setup completed');
                }
              } catch (businessError) {
                console.warn('Failed to setup business for', response.user.role, ':', businessError);
                // Don't fail login if business setup fails
              }
            }
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: error.message || 'Login failed. Please try again.',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          // Call logout API
          await authService.logoutUser();
        } catch (error) {
          console.error('Logout API error:', error);
          // Don't throw error - always clear local data
        }

        // Clear optimized storage
        await optimizedStorage.clearUser();

        // Clear business store data
        useBusinessStore.getState().clearState();

        // Clear Zustand state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        
        console.log('✅ User Store: Logout completed - all data cleared');
      },

      verifyToken: async () => {
        const { token } = get();
        if (!token) return false;

        // Return true to allow auto-login with stored token
        console.log('ℹ️ Skipping token verification - endpoint not available');
        return true;
      },

      updateProfile: async (userData: Partial<User>) => {
        const { user, token } = get();
        if (!user || !token) {
          throw new Error('User not authenticated');
        }

        set({ isLoading: true, error: null });

        try {
          // Update user data
          const updatedUser = { ...user, ...userData };
          
          // Save to secure storage
          await optimizedStorage.saveUser(updatedUser);

          // Update Zustand state
          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Profile update error:', error);
          set({
            isLoading: false,
            error: error.message || 'Profile update failed',
          });
          throw error;
        }
      },

      clearState: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'user-store',
      storage: optimizedStorageAdapter,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for better performance
export const useUser = () => useUserStore((state) => state.user);
export const useToken = () => useUserStore((state) => state.token);
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated);
export const useIsLoading = () => useUserStore((state) => state.isLoading);
export const useError = () => useUserStore((state) => state.error);

// Action selectors
export const useAuthActions = () => useUserStore((state) => ({
  login: state.login,
  logout: state.logout,
  verifyToken: state.verifyToken,
  updateProfile: state.updateProfile,
  setError: state.setError,
}));

// Initialize authentication state on app start
export const initializeAuth = async () => {
  const { verifyToken, setLoading } = useUserStore.getState();
  
  setLoading(true);
  try {
    const isValid = await verifyToken();
    return isValid;
  } catch (error) {
    console.error('Auth initialization error:', error);
    return false;
  } finally {
    setLoading(false);
  }
};
