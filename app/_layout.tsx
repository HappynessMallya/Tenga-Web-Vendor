// Import URL polyfill for web compatibility (must be first)
import 'react-native-url-polyfill/auto';

// Polyfill TextEncoder/TextDecoder for web
if (typeof global !== 'undefined') {
  // Check if we're in a web/Node environment that needs polyfills
  if (typeof (global as any).TextEncoder === 'undefined') {
    const textEncoding = require('text-encoding');
    (global as any).TextEncoder = textEncoding.TextEncoder;
    (global as any).TextDecoder = textEncoding.TextDecoder;
  }
}

// Also set it on window for browser environments
if (typeof window !== 'undefined') {
  if (typeof (window as any).TextEncoder === 'undefined') {
    const textEncoding = require('text-encoding');
    (window as any).TextEncoder = textEncoding.TextEncoder;
    (window as any).TextDecoder = textEncoding.TextDecoder;
  }
}


import { Inter_400Regular, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts as useExpoFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { MD3LightTheme as DefaultPaperTheme, Provider as PaperProvider } from 'react-native-paper';

import { useColorScheme } from '@/components/useColorScheme';
import { OrdersProvider } from '@/context/OrdersContext';
import { useBusinessStore } from '@/stores/businessStore';
import { initializeOrderStore } from '@/stores/orderStore';
import { initializeAuth, useUserStore } from '@/stores/userStore';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'auth',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loadedSystem, error] = useExpoFonts({
    ...FontAwesome.font,
  });
  const [loadedInter] = useFonts({ Inter_400Regular, Inter_600SemiBold });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loadedSystem && loadedInter) {
      SplashScreen.hideAsync();
    }
  }, [loadedSystem, loadedInter]);

  if (!loadedSystem || !loadedInter) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isInitialized, setIsInitialized] = useState(false);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const officesCount = useBusinessStore((state) => state.offices.length);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize stores
        await initializeAuth();
        initializeOrderStore();
        
        // Register PARTNER_ADMIN callback
        const businessStore = useBusinessStore.getState();
        businessStore.registerPartnerAdminCallback();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsInitialized(true); // Still show app even if initialization fails
      }
    };

    initializeApp();
  }, []);

  // Authentication guard - redirect based on auth status
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'auth';
    const inBusinessGroup = segments[0] === 'business';
    const inTabsGroup = segments[0] === '(tabs)';
    const isBusinessRegistration = segments[0] === 'business' && segments[1] === 'registration';
    const isBusinessFileUpload = segments[0] === 'business' && segments[1] === 'fileUpload';
    const isBusinessSuccess = segments[0] === 'business' && segments[1] === 'success';
    const isOfficeRegistration = segments[0] === 'business' && segments[1] === 'office-registration';
    const isStaffRegistration = segments[0] === 'business' && segments[1] === 'staff-registration';

    console.log('🔐 Auth Guard:', {
      isAuthenticated,
      userRole: user?.role,
      currentBusiness: !!currentBusiness,
      officesCount: officesCount,
      segments,
      inAuthGroup,
      inBusinessGroup,
      inTabsGroup,
      isBusinessRegistration,
      isBusinessFileUpload,
      isBusinessSuccess,
      isOfficeRegistration,
      isStaffRegistration,
    });

    // Allow unauthenticated access to business registration flow
    if (isBusinessRegistration || isBusinessFileUpload || isBusinessSuccess) {
      console.log('🔐 Allowing access to business registration flow');
      return;
    }

    // Allow authenticated users to access office registration and staff registration
    if ((isOfficeRegistration || isStaffRegistration) && isAuthenticated) {
      console.log('🔐 Allowing access to office/staff registration for authenticated user');
      console.log('🔐 Staff registration check:', { isStaffRegistration, isAuthenticated, segments });
      return;
    }

    if (!isAuthenticated) {
      // User not authenticated - redirect to auth
      if (!inAuthGroup) {
        console.log('🔐 Redirecting to auth - user not authenticated');
        router.replace('/auth/welcome');
      }
    } else if (user?.role === 'PARTNER_ADMIN') {
      // PARTNER_ADMIN users can access the app even without currentBusiness set
      if (!inTabsGroup) {
        console.log('🔐 Redirecting PARTNER_ADMIN to tabs - role-based access');
        router.replace('/(tabs)/home');
      }
    } else if (user?.role === 'STAFF') {
      // STAFF users have their own tab structure
      if (!inTabsGroup) {
        console.log('🔐 Redirecting STAFF to staff-home - role-based access');
        router.replace('/(tabs)/staff-home');
      }
    } else if (!currentBusiness) {
      // Non-PARTNER_ADMIN users need business registration
      if (!inBusinessGroup) {
        console.log('🔐 Redirecting to business - no business registered');
        router.replace('/business/registration');
      }
    } else if (officesCount === 0) {
      // User authenticated and has business but no offices - redirect to office registration
      if (!inBusinessGroup || segments[1] !== 'office-registration') {
        console.log('🔐 Redirecting to office registration - no offices registered');
        router.replace('/business/office-registration');
      }
    } else {
      // Regular users authenticated, has business and offices - redirect to regular user tabs
      if (!inTabsGroup) {
        console.log('🔐 Redirecting regular user to tabs - user authenticated with business and offices');
        router.replace('/(tabs)/home');
      }
    }
  }, [isInitialized, isAuthenticated, user?.role, currentBusiness, officesCount, segments]);

  if (!isInitialized) {
    return null; // Show splash screen while initializing
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="light" backgroundColor="#AF52DE" />
      <PaperProvider theme={{
        ...DefaultPaperTheme,
        colors: {
          ...DefaultPaperTheme.colors,
          primary: '#AF52DE', // Updated to match design specs
        },
      }}>
        <OrdersProvider>
          <Stack>
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="business" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
          </Stack>
          <Toast />
        </OrdersProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}
