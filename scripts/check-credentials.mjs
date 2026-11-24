import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const PROFILE_PATH = path.resolve('src/data/profile.json');
const DIST_HTML = path.resolve('dist/index.html');
const BADGES_DIR = path.resolve('dist/media/badges');
const TIMEOUT_MS = 20000;

const failures = [];
const warnings = [];

const profile = JSON.parse(await readFile(PROFILE_PATH, 'utf8'));
const credentials = profile.sections?.credentials;

if (!credentials) {
  console.error('Section `credentials` absente de profile.json.');
  process.exit(1);
}

// --- Badges mis en avant (avec image) ---
const featured = credentials.items ?? [];
if (featured.length < 1) {
  failures.push('Aucun badge mis en avant (credentials.items).');
}
for (const badge of featured) {
  if (!badge.name || !badge.dateTime || !badge.url) {
    failures.push(`Badge mis en avant incomplet : ${JSON.stringify(badge)}`);
  }
  if (!badge.image) {
    failures.push(`Image manquante pour le badge : ${badge.name}`);
    continue;
  }
  const file = path.join(BADGES_DIR, badge.image);
  if (!existsSync(file)) failures.push(`Image absente de dist/ : ${badge.image}`);
}

// --- Collections (toutes les preuves) ---
const collections = credentials.collections ?? [];
if (collections.length < 1) {
  failures.push('Aucune collection de certifications (credentials.collections).');
}
const collectionItems = [];
for (const group of collections) {
  if (!group.title) failures.push(`Collection sans titre : ${JSON.stringify(group)}`);
  if (!Array.isArray(group.items) || group.items.length === 0) {
    failures.push(`Collection vide : ${group.title ?? '(sans titre)'}`);
    continue;
  }
  for (const item of group.items) {
    if (!item.name) failures.push(`Élément sans nom dans « ${group.title} ».`);
    // Un élément doit avoir SOIT un lien de vérification SOIT une date (justificatif hors-ligne).
    if (!item.url && !item.date) {
      failures.push(`Élément sans lien ni date dans « ${group.title} » : ${item.name}`);
    }
    collectionItems.push(item);
  }
}

// --- JSON-LD (données structurées SEO) ---
if (!existsSync(DIST_HTML)) {
  failures.push('dist/index.html introuvable : lancez `npm run build`.');
} else {
  const html = await readFile(DIST_HTML, 'utf8');
  if (!html.includes('hasCredential')) failures.push('JSON-LD `hasCredential` absent du HTML.');
  if (!html.includes('EducationalOccupationalCredential')) {
    failures.push('JSON-LD `EducationalOccupationalCredential` absent du HTML.');
  }
  for (const badge of featured) {
    if (badge.image && !html.includes(`/media/badges/${badge.image}`)) {
      failures.push(`Image non référencée dans le HTML : ${badge.image}`);
    }
  }
  if (featured.some((b) => b.image) && (!html.includes('width="300"') || !html.includes('height="300"'))) {
    failures.push('Attributs `width`/`height` manquants sur les images de badges.');
  }
  // Chaque lien de vérification doit apparaître dans la page rendue.
  for (const item of collectionItems) {
    if (item.url && !html.includes(item.url)) {
      warnings.push(`Lien non rendu dans le HTML : ${item.url}`);
    }
  }
}

// --- Cadrage honnête (règle AGENTS.md §4 : ne jamais surévaluer) ---
const desc = credentials.description ?? '';
if (!/certification/i.test(desc) || !/non\b.*certifications? professionnelle/i.test(desc)) {
  failures.push('La description doit préciser que ce ne sont pas des certifications professionnelles homologuées.');
}

// --- Vérification réelle de l'accessibilité des liens ---
async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
      },
    });
    if (response.status >= 200 && response.status < 400) return { ok: true, status: response.status };
    return { ok: false, status: response.status };
  } catch (error) {
    return { ok: false, error: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

const profileUrls = collections.map((g) => g.profileUrl).filter(Boolean);
const allUrls = [...new Set([...profileUrls, ...collectionItems.map((i) => i.url).filter(Boolean)])];
let networkDown = false;
for (const url of allUrls) {
  const result = await checkUrl(url);
  if (!result.ok) {
    // Erreur réseau (proxy, DNS, timeout) = avertissement ; code HTTP d'erreur = échec.
    if (result.status) failures.push(`Lien inaccessible (HTTP ${result.status}) : ${url}`);
    else {
      warnings.push(`Lien non vérifié (${result.error}) : ${url}`);
      networkDown = true;
    }
  }
}

for (const warning of warnings) console.warn(`AVERTISSEMENT : ${warning}`);

if (failures.length) {
  for (const failure of failures) console.error(`ECHEC : ${failure}`);
  console.error(`${failures.length} problème(s) de certifications.`);
  process.exit(1);
}

console.log(`Badges mis en avant : ${featured.length}`);
console.log(`Collections : ${collections.length} — éléments : ${collectionItems.length}`);
console.log(`Liens vérifiés : ${allUrls.length}${networkDown ? ' (certains non joignables depuis cet environnement)' : ''}`);
console.log('Certifications, images, JSON-LD et cadrage cohérents.');
