# M-Sec POS — Point de vente local-first

Monorepo **Turborepo** de l'application de paiement : haute disponibilité,
opérations **offline-first** avec synchronisation automatique, auditabilité
absolue (modèle **append-only** + Idempotency-Key), intégration matérielle
(impression, NFC, lecteurs) et sécurité stricte (SSL Pinning, Keychain/Keystore).

## ══ Arborescence du Monorepo ══

```
pos/
├── apps/
│   ├── mobile-pos/                 # Expo (iOS / Android) — encaissement mobile
│   │   ├── app.json                #   EAS Build + EAS Update (OTA)
│   │   ├── eas.json                #   profils development / preview / production
│   │   ├── App.tsx                 #   composition des providers
│   │   ├── app/                    #   écrans
│   │   ├── src/
│   │   │   ├── db/                 #   PowerSync : schéma + base SQLite local-first
│   │   │   ├── features/sales/     #   FlashList (historique) + hooks React Query
│   │   │   └── store/              #   Zustand (panier / session)
│   │   └── plugins/                #   Expo Config Plugins (SSL Pinning)
│   └── desktop/                    # Tauri (Windows / macOS) — caisse fixe
│       ├── src/                    #   frontend React (vite)
│       └── src-tauri/
│           ├── tauri.conf.json     #   sécurité (isolation, CSP) + auto-updater
│           ├── capabilities/       #   permissions granuleuses
│           └── src/                #   Rust : keyring + handlers natifs
└── packages/                       # Logique partagée (100% réutilisée)
    ├── core/                       # Règles métier PURES (aucune dépendance UI)
    │   └── src/
    │       ├── transaction/        #   schéma Zod + ledger append-only + idempotence
    │       └── money/              #   montants en valeurs entières (pas de float)
    ├── api/                        # Client tRPC : retry backoff + Idempotency-Key
    ├── security/                   # SecureStorage (mobile/desktop) + SSL Pinning
    └── ui/                         # Tokens de marque & thème partagé
```

**Isolation stricte des responsabilités :**

| Package | Responsabilité | Interdit |
| ------- | -------------- | -------- |
| `core` | Règles métier, schémas, ledger — fonctions pures testables sans UI | Importer React / RN / Tauri |
| `api` | Transport tRPC, retry, idempotence côté client | Connaître l'UI, accéder au stockage |
| `security` | Stockage sécurisé des secrets, config pinning | Contenir des règles métier |
| `ui` | Présentation, tokens, thème | Accéder au réseau / au DB |

## ══ Commandes ══

```bash
npm install                  # installe tous les workspaces (hoisted)
npm run typecheck            # tsc strict sur tous les packages/apps
npm run build                # builds via Turborepo (cache incrémental)
npm test                     # tests (vitest) de packages/core

# Mobile
cd apps/mobile-pos
npm run start                # Expo Dev Server (Expo Go)
npm run build:android
npx eas build --profile preview --platform android

# Desktop
cd apps/desktop
npm run tauri dev
npm run tauri build          # binaire signé + auto-update
```

## ══ Points de configuration à alimenter avant mise en prod ══

1. **EAS Update** : remplacer `<PROJECT_ID>` dans `apps/mobile-pos/app.json`
   (`npx eas init` / `npx eas update:configure`).
2. **SSL Pinning** : mettre les empreintes SHA-256 réelles dans
   `packages/security/src/pinning.ts` (générées via `openssl s_client -showcerts`).
3. **Tauri updater** : générer la paire de clés
   (`npx @tauri-apps/cli signer generate`) et renseigner `pubkey` dans
   `apps/desktop/src-tauri/tauri.conf.json`.
4. **Icônes desktop** : `npm run tauri icon` avant le premier build.
5. **`pos.app.json → extra.pos.apiUrl`** : URL HTTPS de l'API backend.