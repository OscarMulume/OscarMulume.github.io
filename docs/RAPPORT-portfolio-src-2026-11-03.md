# Rapport — reconstruction des sources du portfolio

- Date : 2026-11-03 (reprise de l’étape 2 le 2026-11-04)
- Dépôt : `C:\pos-system\repos\OscarMulume.github.io`
- Branche : `main`
- Site : https://oscarmulume.github.io
- Rôle : lead engineer M-SEC

## Contexte

La branche `main` distante a avancé depuis le constat initial : `origin/main` pointait sur `51fc0cf` (« deploy: mise en ligne de la refonte (portrait particules, projets, CV FR/EN) à la racine »). Cette version contenait déjà des sources Astro, les thèmes clair / sombre / contraste élevé, le portrait en particules, les projets et les CV FR/EN.

La refonte compilée antérieure reste sauvegardée sur la branche `archive/compiled-2026-09-02` (`139ca82`). Aucun élément de la refonte actuelle n’a été écrasé.

## Étapes

| Étape | Fichiers | Tests | Commit | Tag | Poussé |
|---|---|---|---|---|---|
| 1 — Filet de sécurité, captures de référence et build reproductible | `AGENTS.md`, `astro.config.mjs`, `src/styles/global.css`, `package.json`, `package-lock.json`, `.npmrc`, `.gitignore`, `tests/visual/*`, ce rapport | `npm run build` OK ; 6 captures ; comparaison visuelle 6/6 à 0,000 % | `5d31013` | `portfolio-src-step-1` | oui |
| 2 — Reconstruction des sources Astro | 28 fichiers : `src/pages/index.astro`, `src/layouts/BaseLayout.astro`, `src/components/*.astro`, `src/data/profile.json`, `src/styles/*.css`, `public/*`, `.github/workflows/deploy.yml`, suppression des artefacts compilés de la racine, ce rapport | `npm run build` OK ; `npm run check` 0 erreur ; `npm run validate:html` OK ; comparaison visuelle 6/6 à 0,000 % | `36dbf77` | `portfolio-src-step-2` | oui |

## Étape 1 — détails

- `AGENTS.md` copié depuis `C:\pos-system\AGENTS.md`.
- `archive/compiled-2026-09-02` créée et poussée sur `139ca82`.
- Captures de référence générées depuis la version compilée actuelle : `tests/visual/reference/home-{390,768,1440}-{light,dark}.png`.
- Serveur local et capture Playwright : `tests/visual/serve.mjs`, `tests/visual/capture.mjs`.
- Comparaison pixel par pixel : `tests/visual/compare.mjs` (seuil 1 %, seuil réel constaté 0 %).
- Build passé à Astro 7.4.x, même majeure que le site M-SEC.
- Tailwind 4 conservé via `@tailwindcss/vite`, sans Preflight : la version compilée de référence ne contient pas le reset Tailwind. Le Preflight ajoutait 26 px à la section contact et cassait la parité visuelle.
- `esbuild` ajouté explicitement aux dépendances de développement : Vite 8 ne le fournit plus directement alors que `cssMinify: 'esbuild'` l’exige.
- `postcss.config.mjs` supprimé : il référençait `@tailwindcss/postcss`, désinstallé.
- `esbuild@0.28.2` ajouté aux scripts autorisés dans `.npmrc`.

## Étape 2 — détails

- Page découpée en composants par section : `Nav`, `Hero`, `About`, `Services`, `Process`, `Experience`, `Projects`, `Skills`, `Cv`, `Contact`, `Footer`, plus `Icon`, `PortraitFX` et `ThemeToggle`.
- Tout le contenu visible (identité, navigation, expériences, compétences, services, certifications, projets, CV, contact, pied de page) est dans `src/data/profile.json` ; aucun texte métier n’est écrit en dur dans les composants.
- CSS actuel repris et organisé dans `src/styles/global.css` et `src/styles/themes.css`, sans retour à l’ancien design de `17e3789`.
- BOM UTF-8 retiré de `src/components/Contact.astro`, `Cv.astro`, `Nav.astro` et `Process.astro` (vérifié octet par octet : les quatre fichiers commencent maintenant par `2D 2D 2D`, plus aucun BOM dans `src/`).
- Erreurs `astro check` corrigées dans `src/pages/index.astro` (types du canvas) et variable inutilisée retirée de `ThemeToggle.astro`.
- Artefacts compilés supprimés de la racine (`index.html`, ancien CSS `_astro/`, PDF, favicons, images) ; les fichiers publics utiles sont désormais dans `public/`. `dist/` est ignoré par Git et n’est plus committé.
- Workflow `.github/workflows/deploy.yml` ajouté : build Astro, `actions/upload-pages-artifact`, `actions/deploy-pages`, déclenché sur `main`.
- Réglage GitHub Pages vérifié puis corrigé avant le push : l’API renvoyait `build_type: "legacy"` (branche `main` / racine) ; elle renvoie maintenant `build_type: "workflow"`. Équivalent de Settings → Pages → Source = « GitHub Actions ».

## Vérifications

- `npm run build` : OK.
- `npm run check` : 0 erreur, 0 avertissement, 0 indication.
- `npm run validate:html` : OK.
- Captures : 390, 768 et 1440 px, thèmes clair et sombre.
- Comparaison visuelle : 6/6 captures à 0,000 % de différence (0 pixel différent), contre une référence issue du site compilé.
- `dist/` : 9 fichiers, 462 658 octets au total.
- Workflow « Déploiement GitHub Pages » vert après le push (run `41796678743`, build + deploy en 28 s).
- Page en ligne vérifiée après déploiement : `https://oscarmulume.github.io/` répond HTTP 200 et sert bien le portfolio reconstruit.
- Une capture mobile sombre avait varié une fois de 269 px avant stabilisation à l’étape 1 ; la capture attend désormais une hauteur de page stable avant la prise de vue. Relance : 6/6 à 0,000 %.

## Reste à faire

- Étape 3 : badges Cisco vérifiables, projets réels (POS Pro, Malaika Ranch, site M-SEC), lien visible vers M-SEC, JSON-LD `hasCredential`, images de badges.
- Étape 4 : `html-validate` (déjà OK à ce stade), vérification des liens (Credly doit répondre 200), Lighthouse mobile performance et accessibilité ≥ 95, images WebP avec `width`/`height`.
- Vérifier le déploiement GitHub Pages et l’affichage des badges après cache (~10 min).

## Questions pour Oscar

- Aucune question bloquante à ce stade.
