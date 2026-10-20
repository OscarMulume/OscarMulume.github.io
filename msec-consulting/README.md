# MSEC CONSULTING — Monorepo

Boilerplate d'infrastructure : vitrine SEO (SSG/ISR), portail client sécurisé
(devis, factures), application mobile Expo. Un seul contrat TypeScript entre
web, mobile et serveur : **tRPC + Zod**.

## Arborescence

```
msec-consulting/
├─ package.json            # workspaces npm (apps/*, packages/*)
├─ turbo.json              # orchestrateur (build/test/typecheck/lint)
├─ tsconfig.base.json      # strict + isolation de types communs
├─ .npmrc                  # allow-scripts (esbuild, sharp)
├─ packages/
│  ├─ core/                # contrat métier : schémas Zod, RBAC, AES-256-GCM
│  │  └─ src/
│  │     ├─ errors.ts           # MsecError (code + statut HTTP)
│  │     ├─ money/              # minor units (jamais de flottants)
│  │     ├─ documents/          # devis / factures (append-only, lecture seule)
│  │     ├─ rbac/               # matrice rôles→permissions (source de vérité)
│  │     └─ crypto/             # chiffrement documentaire at-rest (WebCrypto)
│  ├─ api/                 # router tRPC (RBAC) + client + retry avec jitter
│  ├─ security/            # sessions signées HMAC (web) + SecureStore (mobile)
│  └─ ui/                  # design tokens purs (web + mobile)
└─ apps/
   ├─ web/                 # Next.js App Router (RSC)
   │  ├─ src/middleware.ts      # protection /espace + /admin côté Edge
   │  ├─ src/lib/               # session httpOnly, gateways, caller tRPC
   │  └─ src/app/               # vitrine SSG, références ISR, portail SSR
   └─ mobile-consulting/   # Expo SDK 54 (EAS Build + EAS Update)
      ├─ app.json / eas.json   # builds + canaux OTA (dev/preview/prod)
      ├─ metro/babel           # monorepo
      └─ App.tsx               # FlashList (devis) + react-query + tRPC
```

## Stratégie de rendu (web)

| Surface              | Route                 | Rendu                       |
| -------------------- | --------------------- | --------------------------- |
| Vitrine SEO          | `/`, `/references`    | **SSG** (FCP < 1,5 s, zéro JS) |
| Références détail    | `/references/[slug]`  | **ISR** `revalidate: 3600`  |
| Portail client       | `/espace`             | **SSR** strict (force-dynamic) |
| Administration       | `/admin`              | SSR + middleware, rewrite 403 |

Sessions : cookie **httpOnly** signé HMAC-SHA-256 (jamais de JWT exposé au
navigateur). Chiffrement at-rest AES-256-GCM des documents, clés portées par
`keyId` (rotation authentifiée).

## Sécurité

- **RBAC** : la matrice est dans `@msec/core` et appliquée en 3 couches —
  Edge middleware (routes), router tRPC (données), masquage UI (mobile).
- **CSP / headers** : définis dans `apps/web/next.config.ts`.
- **Secrets (env)** : `MSEC_SESSION_SECRET`, `MSEC_DOCS_MASTER_KEY`,
  `MSEC_DATABASE_URL`, `NEXT_PUBLIC_MSEC_API_URL` (voir `turbo.json`
  `globalEnv` — jamais commités).

## Commandes

```bash
npm install                 # depuis apps/... ou racine (workspaces)
npx turbo run typecheck     # 10 projets (web, mobile, packages)
npx turbo run test          # tests unitaires @msec/core
npx turbo run build         # packages + Next build
```

Mobile :

```bash
cd apps/mobile-consulting
npx expo export --platform android   # vérification du bundle
npx eas build --profile production   # EAS Build (connexion EAS requise)
npx eas update --channel preview     # EAS Update (OTA)
```

## Prochaines étapes (hors boilerplate)

1. Brancher `MSEC_DATABASE_URL` (Prisma/PostgreSQL) sur les gateways.
2. Remplacer la connexion « démo » par un vrai flow d'authentification
   (login + mot de passe haché, ou SSO).
3. Générer/rotater les clés via `createDocumentKey` et sceller les documents.
4. Déclarer le `projectId` EAS réel dans `app.json` / `eas.json`.