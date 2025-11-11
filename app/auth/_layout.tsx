import { useIsAuthenticated } from '@/stores/userStore';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

export default function AuthLayout() {
  const isAuthenticated = useIsAuthenticated();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Small delay to ensure auth state is properly loaded
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isCheckingAuth) {
    return null; // Show loading while checking auth
  }

  // If user is authenticated, redirect to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signin" />
    </Stack>
  );
}
