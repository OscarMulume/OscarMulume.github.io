# 🛡️ M-Sec Mobile — Configuration initiale

Application mobile multiplateforme **React Native + Expo** pour l'écosystème
**M-Sec / POS Pro** (iOS, Android, exécutable depuis Windows via Expo Go).

## Stack

| Brique            | Choix                                                  |
| ----------------- | ----------------------------------------------------- |
| Framework         | React Native + Expo SDK 54                            |
| Langage           | TypeScript **strict**                                  |
| Navigation        | Expo Router (file-based routing)                      |
| Styling           | NativeWind (Tailwind CSS pour React Native)           |
| État global       | Zustand                                               |
| Sécurité          | expo-secure-store (tokens & clés, AES-256 côté OS)    |
| Performance       | React.memo + useCallback sur les composants partagés  |

## ══ Commandes Terminal (init from scratch) ══

```bash
# 1. Créer le projet Expo (template TypeScript)
npx create-expo-app@latest mobile --template blank-typescript

# 2. Installer Expo Router (file-based routing) + dépendances
cd mobile
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# 3. Configurer le point d'entrée Expo Router dans package.json
#    (main: "expo-router/entry") et le plugin "expo-router" dans app.json

# 4. Installer NativeWind (Tailwind pour RN) + Tailwind v3
npm install nativewind@4.1.23
npm install --save-dev tailwindcss@3.4.17
npx tailwindcss init

# 5. Câbler NativeWind
#    - metro.config.js  → withNativeWind(config, { input: './global.css' })
#    - babel.config.js  → presets: ['babel-preset-expo' + jsxImportSource:'nativewind', 'nativewind/babel']
#    - global.css       → @tailwind base/components/utilities + import dans app/_layout
#    - nativewind-env.d.ts → /// <reference types="nativewind/types" />

# 6. État global & sécurité
npm install zustand@^5.0.3
npx expo install expo-secure-store

# 7. Lancer (tests via Expo Go sur téléphone ou émulateur)
npm run start          # Expo Dev Server (QR code)
npm run android        # Android
npm run ios            # iOS (natif) — compile aussi via Expo Go
npm run web            # Web (debug)

# 8. Typecheck strict
npm run typecheck
```

## ══ Arborescence ══

```
mobile/
├── app/                      # Expo Router (file-based routing)
│   ├── _layout.tsx           # Root layout : ThemeProvider + Stack
│   ├── index.tsx             # Écran d'accueil (démo)
│   └── settings.tsx          # Sélecteur de thème tri-mode
├── assets/                   # Icons / splash
├── components/
│   └── ThemeToggle.tsx       # Bouton cyclique light→dark→high-contrast (memo)
├── lib/
│   └── secureStorage.ts      # Wrapper expo-secure-store (clés, tokens)
├── store/
│   └── themeStore.ts         # Zustand : préférence + schéma système
├── theme/
│   ├── palettes.ts           # Les 3 palettes RGB
│   ├── tokens.ts             # Types ThemeMode / ThemePreference + clés
│   ├── ThemeProvider.tsx     # Hydration SecureStore + détection OS + StatusBar
│   ├── useTheme.ts           # Hook useTheme() → mode + palette + color()
│   └── index.ts              # Barrels
├── app.json
├── babel.config.js
├── eas.json                  # Build cloud (EAS Build)
├── global.css                # Entry NativeWind
├── metro.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json             # TypeScript strict
```

## ══ Mode d'affichage tri-mode ══

| Mode            | Détail                                                    |
| --------------- | --------------------------------------------------------- |
| `light`         | Thème clair équilibré (défaut)                            |
| `dark`          | "Lumière Basse" — sombre doux, reposant pour les yeux     |
| `high-contrast` | Fond `#000000`, texte `#FFFFFF`, accents haute lisibilité |

Persistance dans `expo-secure-store` (clé `msec.mobile.theme`) +
détection du schéma système via `useColorScheme()`.