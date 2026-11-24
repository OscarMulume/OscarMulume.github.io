# Rapport — Mise à jour des certifications (portfolio)

**Date :** 2026-11-24
**Mission :** Étendre la section « Certifications » du portfolio à tout le portefeuille vérifié d'Oscar.

## Contexte

La section ne montrait que 5 badges Cisco. Oscar a demandé d'y intégrer toutes ses
certifications/badges vérifiés (source : inventaire extrait de ses mails lors d'une session précédente).
Le PC d'Oscar n'étant pas connecté à ce chat, le dossier Téléchargements n'a pas pu être lu ;
l'inventaire mails a servi de source. Une passe Gmail a confirmé l'inventaire (CTF Nu Jang, Liquid, HTB) sans
élément nouveau.

## Ce qui a été fait

| Étape | Fichiers | Tests | Commit | Tag | Poussé |
|---|---|---|---|---|---|
| Restructuration données certifs (4 collections, 26 éléments) | `src/data/profile.json` | build + typecheck + check:credentials verts | (voir git) | `certifs-2026-11-24` | oui |
| Nouveau composant (stats, badges mis en avant, collections à liens) | `src/components/Credentials.astro` | idem | — | — | — |
| JSON-LD SEO branché sur tout le portefeuille | `src/layouts/BaseLayout.astro` | typecheck OK | — | — | — |
| Script de validation réécrit (nouvelle structure + vérif liens) | `scripts/check-credentials.mjs` | exit 0 | — | — | — |
| Stat hero + libellé footer actualisés | `src/data/profile.json` | — | — | — | — |

## Contenu intégré (vérifié)

- **Cisco Networking Academy (5)** — badges Credly : Ethical Hacker, Junior Cybersecurity Analyst Career Path,
  Networking Devices & Initial Configuration, Networking Basics, Introduction to Cybersecurity.
- **Internet Society — Certificats (10)** — pages publiques Accredible (`certificates.isoc.org`).
- **Internet Society — Badges (5)** — Internet Way of Networking.
- **Formations professionnelles & terrain (6)** — Liquid ×3, UNHCR RETS (SCS), CTF « AAR Cyber » (Nu Jang),
  DisasterReady ×2. Justificatifs PDF (pas de page publique) → affichés avec date, sans lien mort.

## Cadrage honnête (AGENTS.md §4 et §6)

- La description précise explicitement qu'il s'agit de badges/certificats de **formation**, et **non** de
  certifications professionnelles homologuées (type CISSP/CCNA). Aucun titre inventé.
- Les éléments sans page publique n'ont **aucun lien** (pas de lien mort), seulement une date.

## Non fait / à vérifier

- Les liens ISOC/Credly n'ont pas pu être re-testés en direct depuis l'environnement cloud (proxy : domaines hors
  allowlist). Ils proviennent de l'inventaire mails déjà vérifié ; la **CI GitHub** (et le script `check:credentials`)
  les testeront en direct au prochain déploiement.
- Nom d'utilisateur Credly conservé tel quel (`/users/oscar-mulume`) — à confirmer par Oscar si différent.

## Question pour Oscar

- Veux-tu aussi afficher les profils labos (TryHackMe, Hack The Box) dans cette section, ou les laisser en « Projets » ?
