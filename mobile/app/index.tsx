import { memo, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../theme/useTheme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={flex1}>
      <ScrollView contentContainerStyle={flexGrow}>
        <Header />
        <Hero />
        <FeatureList />
      </ScrollView>
    </SafeAreaView>
  );
}

const Header = memo(function Header() {
  const { color } = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: color('border') }]}>
      <Text style={[styles.brand, { color: color('text') }]}>
        M-Sec<Text style={{ color: color('primary') }}> Mobile</Text>
      </Text>
      <ThemeToggle />
    </View>
  );
});

const Hero = memo(function Hero() {
  const { color } = useTheme();
  return (
    <View style={styles.hero}>
      <Text style={[styles.title, { color: color('text') }]}>
        Écosystème POS Pro
      </Text>
      <Text style={[styles.subtitle, { color: color('text-muted') }]}>
        Architecture multiplateforme — iOS, Android, Windows. 60/120 fps, stockage
        sécurisé AES-256, thème tri-mode.
      </Text>
      <Link href="/settings" asChild>
        <Pressable style={({ pressed }) => [styles.cta, { backgroundColor: color('primary') }, pressed && styles.pressed]}>
          <Text style={styles.ctaLabel}>Ouvrir les réglages de thème</Text>
        </Pressable>
      </Link>
    </View>
  );
});

const FEATURES = [
  { icon: '✨', label: 'React Native + Expo' },
  { icon: '🧭', label: 'Expo Router (file-based)' },
  { icon: '🎨', label: 'NativeWind (Tailwind RN)' },
  { icon: '🛡️', label: 'SecureStore pour tokens' },
  { icon: '⚡', label: 'Zustand — état performant' },
] as const;

const FeatureList = memo(function FeatureList() {
  const { color } = useTheme();
  const renderItem = useCallback(
    (f: (typeof FEATURES)[number], i: number) => (
      <View key={f.label} style={[styles.feature, { backgroundColor: color('card'), borderColor: color('border') }]}>
        <Text style={styles.featureIcon}>{f.icon}</Text>
        <Text style={[styles.featureLabel, { color: color('text') }]}>{f.label}</Text>
        <Text style={[styles.featureBadge, { color: color('primary-bright') }]}>
          {String(i + 1).padStart(2, '0')}
        </Text>
      </View>
    ),
    [color],
  );

  return <View style={styles.list}>{FEATURES.map(renderItem)}</View>;
});

const flex1 = { flex: 1 } as const;
const flexGrow = { flexGrow: 1 } as const;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 420,
  },
  cta: {
    marginTop: 24,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  ctaLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.82,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  featureBadge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export { HomeScreen };