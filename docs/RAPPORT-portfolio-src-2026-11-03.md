# Rapport — reconstruction des sources du portfolio

- Date : 2026-11-03
- Dépôt : `C:\pos-system\repos\OscarMulume.github.io`
- Branche : `main`
- Site : https://oscarmulume.github.io

## Contexte

La branche `main` distante a avancé depuis le constat initial : `origin/main` pointe désormais sur `51fc0cf` (« deploy: mise en ligne de la refonte (portrait particules, projets, CV FR/EN) à la racine »). Cette version contient déjà des sources Astro, les thèmes clair / sombre / contraste élevé, le portrait en particules, les projets et les CV FR/EN.

La refonte compilée antérieure reste sauvegardée sur la branche `archive/compiled-2026-09-02` (`139ca82`). Aucun élément de la refonte actuelle n’a été écrasé.

## Étapes

| Étape | Fichiers | Tests | Commit | Tag | Poussé |
|---|---|---|---|---|---|
| 1 — Filet de sécurité, captures de référence et build reproductible | `AGENTS.md`, `astro.config.mjs`, `src/styles/global.css`, `package.json`, `package-lock.json`, `.npmrc`, `.gitignore`, `tests/visual/*`, ce rapport | `npm run build` OK ; 6 captures ; comparaison visuelle 6/6 à 0,000 % | `a0515c8` | `portfolio-src-step-1` | oui |

## Étape 1 — détails

- `AGENTS.md` copié depuis `C:\pos-system\AGENTS.md`.
- `archive/compiled-2026-09-02` créée et poussée sur `139ca82`.
- Captures de référence générées depuis la version compilée actuelle `51fc0cf` : `tests/visual/reference/home-{390,768,1440}-{light,dark}.png`.
- Serveur local et capture Playwright ajoutés : `tests/visual/serve.mjs`, `tests/visual/capture.mjs`.
- Comparaison pixel par pixel ajoutée : `tests/visual/compare.mjs` (seuil 1 %, seuil réel constaté 0 %).
- Build passé à Astro 7.4.5, même majeure que le site M-SEC.
- Tailwind 4 conservé via `@tailwindcss/vite`, sans Preflight : la version compilée de référence ne contient pas le reset Tailwind. Le Preflight ajoutait 26 px à la section contact et cassait la parité visuelle.
- `esbuild` ajouté explicitement aux dépendances de développement : Vite 8 ne le fournit plus directement alors que `cssMinify: 'esbuild'` l’exige.
- `postcss.config.mjs` supprimé : il référençait `@tailwindcss/postcss`, désinstallé.
- `esbuild@0.28.2` ajouté aux scripts autorisés dans `.npmrc`.

## Vérifications

- `npm run build` : OK.
- Captures : 390, 768 et 1440 px, thèmes clair et sombre.
- Comparaison visuelle : 6/6 captures à 0,000 % de différence.
- Une capture mobile sombre a varié une fois de 269 px avant stabilisation ; la capture attend désormais une hauteur de page stable avant la prise de vue. Relance : 6/6 à 0,000 %.

## Reste à faire

- Étape 2 : extraire tout le contenu dans `src/data/profile.json`, découper la page en composants, conserver la parité visuelle, supprimer les artefacts compilés de la racine et ajouter le workflow GitHub Pages.
- Étape 3 : badges Cisco vérifiables, projets réels, lien M-SEC, JSON-LD `hasCredential`.
- Étape 4 : `html-validate`, vérification des liens, Lighthouse mobile ≥ 95, images WebP dimensionnées.
- Vérifier le déploiement GitHub Pages et l’affichage des badges après cache (~10 min).

## Questions pour Oscar

- Aucune question bloquante à ce stade.
