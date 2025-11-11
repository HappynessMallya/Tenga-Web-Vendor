import { Stack } from 'expo-router';

export default function BusinessLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="registration" />
      <Stack.Screen name="fileUpload" />
      <Stack.Screen name="success" />
      <Stack.Screen name="office-registration" />
      <Stack.Screen name="staff-registration" />
    </Stack>
  );
}
