import { memo, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PALETTES } from '../theme/palettes';
import { useThemeStore } from '../store/themeStore';
import { useTheme } from '../theme/useTheme';
import type { ThemePreference } from '../theme/tokens';

const OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  {
    value: 'system',
    label: 'Système',
    description: 'Suit automatiquement le schéma clair/sombre de l’appareil',
  },
  {
    value: 'light',
    label: 'Clair',
    description: 'Thème clair équilibré, fond lumineux discret',
  },
  {
    value: 'dark',
    label: 'Sombre doux — Lumière Basse',
    description: 'Mode sombre adouci, reposant pour les yeux',
  },
  {
    value: 'high-contrast',
    label: 'Contraste élevé',
    description: 'Fond noir #000000, texte blanc #FFFFFF, accents haute lisibilité',
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopBar onBack={router.back} />
      <ScrollView contentContainerStyle={styles.content}>
        <TitleBlock />
        <ThemeSelector />
        <PalettePreview />
      </ScrollView>
    </SafeAreaView>
  );
}

const TopBar = memo(function TopBar({ onBack }: { onBack: () => void }) {
  const { color } = useTheme();
  return (
    <View style={[styles.topbar, { borderBottomColor: color('border') }]}>
      <Pressable onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[styles.back, { color: color('primary') }]}>‹ Retour</Text>
      </Pressable>
      <Text style={[styles.topbarTitle, { color: color('text') }]}>Thème</Text>
    </View>
  );
});

const TitleBlock = memo(function TitleBlock() {
  const { color } = useTheme();
  return (
    <View style={styles.titleBlock}>
      <Text style={[styles.title, { color: color('text') }]}>Mode d'affichage</Text>
      <Text style={[styles.description, { color: color('text-muted') }]}>
        Trois états disponibles : Clair, Lumière Basse (sombre doux) et Contraste
        élevé pour l'accessibilité.
      </Text>
    </View>
  );
});

const ThemeSelector = memo(function ThemeSelector() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const { color, mode } = useTheme();

  const onSelect = useCallback(
    (value: ThemePreference) => {
      setPreference(value);
    },
    [setPreference],
  );

  return (
    <View style={styles.options}>
      {OPTIONS.map((opt) => {
        const selected = preference === opt.value;
        const isActiveMode = mode === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: color('card'), borderColor: color('border') },
              selected && { borderColor: color('primary'), borderWidth: 2 },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.optionRow}>
              <View
                style={[
                  styles.radio,
                  { borderColor: color('text-muted') },
                  selected && { borderColor: color('primary'), backgroundColor: color('primary') },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: color('text') }]}>{opt.label}</Text>
                <Text style={[styles.optionDesc, { color: color('text-muted') }]}>
                  {opt.description}
                </Text>
              </View>
              {isActiveMode && <Text style={{ color: color('primary-bright') }}>● actif</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
});

const PalettePreview = memo(function PalettePreview() {
  const { color, mode } = useTheme();
  const palette = PALETTES[mode];
  const swatches = Object.entries(palette) as [string, readonly number[]][];

  return (
    <View style={[styles.preview, { backgroundColor: color('card'), borderColor: color('border') }]}>
      <Text style={[styles.previewTitle, { color: color('text') }]}>
        Palette — {mode}
      </Text>
      <View style={styles.swatches}>
        {swatches.map(([name, trio]) => {
          const [r, g, b] = trio;
          const bg = `rgb(${r},${g},${b})`;
          return (
            <View key={name} style={styles.swatchWrap}>
              <View style={[styles.swatch, { backgroundColor: bg }]} />
              <Text style={[styles.swatchName, { color: color('text-faint') }]} numberOfLines={1}>
                {name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    fontSize: 16,
    fontWeight: '600',
  },
  topbarTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  titleBlock: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 440,
  },
  options: {
    gap: 10,
  },
  option: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optionDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 3,
  },
  pressed: {
    opacity: 0.85,
  },
  preview: {
    marginTop: 28,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchWrap: {
    alignItems: 'center',
    width: 56,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.4)',
  },
  swatchName: {
    fontSize: 9,
    marginTop: 6,
    maxWidth: 56,
  },
});