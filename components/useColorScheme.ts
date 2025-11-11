// Force light mode across the app by returning a constant value.
// This overrides the platform color scheme and ensures consistent light theme.
export function useColorScheme() {
  return 'light';
}
