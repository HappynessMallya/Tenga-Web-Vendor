import { Stack } from 'expo-router';

export default function RegularUserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Orders' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
    </Stack>
  );
}
