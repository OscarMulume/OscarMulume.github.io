import { registerRootComponent } from 'expo';

import App from './App';

// Entrée explicite pour monorepo (ne dépend pas du point de montage Expo/Router).
registerRootComponent(App);