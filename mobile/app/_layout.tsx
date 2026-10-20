import { Stack } from 'expo-router';
import { ThemeProvider } from '../theme/ThemeProvider';
import '../global.css';

/**
 * Layout racine — Expo Router (file-based routing).
 * Enveloppe toute l'app dans le ThemeProvider tri-mode.
 */
export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" />
      </Stack>
    </ThemeProvider>
  );
}