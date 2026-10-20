import { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { THEME_CYCLE } from '../theme/palettes';
import { useThemeStore } from '../store/themeStore';
import { useTheme } from '../theme/useTheme';

const SYMBOLS = { light: '☀', dark: '☾', 'high-contrast': '◐' } as const;

/**
 * ThemeToggle — bouton ergonomique cyclant light → dark → high-contrast.
 * Rendu mémoïsé (React.memo) + handlers via useCallback.
 * Animation de rotation au changement de thème.
 */
interface ThemeToggleProps {
  size?: number;
}

export const ThemeToggle = memo(function ThemeToggle({ size = 44 }: ThemeToggleProps) {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const systemScheme = useThemeStore((s) => s.systemScheme);
  const effectiveMode: 'light' | 'dark' | 'high-contrast' =
    preference === 'system' ? (systemScheme ?? 'light') : preference;

  const { color } = useTheme();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    }).start();
  }, [effectiveMode, spin]);

  const handlePress = useCallback(() => {
    const currentIndex = THEME_CYCLE.indexOf(effectiveMode);
    const next = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length] ?? 'light';
    setPreference(next);
  }, [effectiveMode, setPreference]);

  const accessibilityLabel = `Thème actuel : ${SYMBOLS[effectiveMode]} — toucher pour changer`;

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.container,
            {
              width: size,
              height: size,
              transform: [{ rotate }],
              opacity: pressed ? 0.72 : 1,
            },
            {
              backgroundColor: color('card'),
              borderColor: color('border'),
            },
          ]}
        >
          <Text style={[styles.symbol, { color: color('text') }]}>{SYMBOLS[effectiveMode]}</Text>
          <View style={[styles.dot, { backgroundColor: color('primary') }]} />
        </Animated.View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  symbol: {
    fontSize: 18,
    lineHeight: 22,
  },
  dot: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});