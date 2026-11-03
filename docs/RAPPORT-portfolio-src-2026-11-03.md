# Rapport â€” reconstruction des sources du portfolio

- Date : 2026-11-03
- DÃ©pÃ´t : `C:\pos-system\repos\OscarMulume.github.io`
- Branche : `main`
- Site : https://oscarmulume.github.io

## Contexte

La branche `main` distante a avancÃ© depuis le constat initial : `origin/main` pointe dÃ©sormais sur `51fc0cf` (Â« deploy: mise en ligne de la refonte (portrait particules, projets, CV FR/EN) Ã  la racine Â»). Cette version contient dÃ©jÃ  des sources Astro, les thÃ¨mes clair / sombre / contraste Ã©levÃ©, le portrait en particules, les projets et les CV FR/EN.

La refonte compilÃ©e antÃ©rieure reste sauvegardÃ©e sur la branche `archive/compiled-2026-09-02` (`139ca82`). Aucun Ã©lÃ©ment de la refonte actuelle nâ€™a Ã©tÃ© Ã©crasÃ©.

## Ã‰tapes

| Ã‰tape | Fichiers | Tests | Commit | Tag | PoussÃ© |
|---|---|---|---|---|---|
| 1 â€” Filet de sÃ©curitÃ©, captures de rÃ©fÃ©rence et build reproductible | `AGENTS.md`, `astro.config.mjs`, `src/styles/global.css`, `package.json`, `package-lock.json`, `.npmrc`, `.gitignore`, `tests/visual/*`, ce rapport | `npm run build` OK ; 6 captures ; comparaison visuelle 6/6 Ã  0,000 % | `5d31013` | `portfolio-src-step-1` | oui |

## Ã‰tape 1 â€” dÃ©tails

- `AGENTS.md` copiÃ© depuis `C:\pos-system\AGENTS.md`.
- `archive/compiled-2026-09-02` crÃ©Ã©e et poussÃ©e sur `139ca82`.
- Captures de rÃ©fÃ©rence gÃ©nÃ©rÃ©es depuis la version compilÃ©e actuelle `51fc0cf` : `tests/visual/reference/home-{390,768,1440}-{light,dark}.png`.
- Serveur local et capture Playwright ajoutÃ©s : `tests/visual/serve.mjs`, `tests/visual/capture.mjs`.
- Comparaison pixel par pixel ajoutÃ©e : `tests/visual/compare.mjs` (seuil 1 %, seuil rÃ©el constatÃ© 0 %).
- Build passÃ© Ã  Astro 7.4.5, mÃªme majeure que le site M-SEC.
- Tailwind 4 conservÃ© via `@tailwindcss/vite`, sans Preflight : la version compilÃ©e de rÃ©fÃ©rence ne contient pas le reset Tailwind. Le Preflight ajoutait 26 px Ã  la section contact et cassait la paritÃ© visuelle.
- `esbuild` ajoutÃ© explicitement aux dÃ©pendances de dÃ©veloppement : Vite 8 ne le fournit plus directement alors que `cssMinify: 'esbuild'` lâ€™exige.
- `postcss.config.mjs` supprimÃ© : il rÃ©fÃ©renÃ§ait `@tailwindcss/postcss`, dÃ©sinstallÃ©.
- `esbuild@0.28.2` ajoutÃ© aux scripts autorisÃ©s dans `.npmrc`.

## VÃ©rifications

- `npm run build` : OK.
- Captures : 390, 768 et 1440 px, thÃ¨mes clair et sombre.
- Comparaison visuelle : 6/6 captures Ã  0,000 % de diffÃ©rence.
- Une capture mobile sombre a variÃ© une fois de 269 px avant stabilisation ; la capture attend dÃ©sormais une hauteur de page stable avant la prise de vue. Relance : 6/6 Ã  0,000 %.

## Reste Ã  faire

- Ã‰tape 2 : extraire tout le contenu dans `src/data/profile.json`, dÃ©couper la page en composants, conserver la paritÃ© visuelle, supprimer les artefacts compilÃ©s de la racine et ajouter le workflow GitHub Pages.
- Ã‰tape 3 : badges Cisco vÃ©rifiables, projets rÃ©els, lien M-SEC, JSON-LD `hasCredential`.
- Ã‰tape 4 : `html-validate`, vÃ©rification des liens, Lighthouse mobile â‰¥ 95, images WebP dimensionnÃ©es.
- VÃ©rifier le dÃ©ploiement GitHub Pages et lâ€™affichage des badges aprÃ¨s cache (~10 min).

## Questions pour Oscar

- Aucune question bloquante Ã  ce stade.

