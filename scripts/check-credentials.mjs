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

const allCredentials = [...(credentials.items ?? []), ...(credentials.others ?? [])];
if (allCredentials.length !== 5) {
  failures.push(`5 badges attendus, ${allCredentials.length} trouvés.`);
}

for (const credential of allCredentials) {
  if (!credential.name || !credential.dateTime || !credential.url) {
    failures.push(`Badge incomplet : ${JSON.stringify(credential)}`);
  }
}

for (const badge of credentials.items ?? []) {
  if (!badge.image) {
    failures.push(`Image manquante pour le badge : ${badge.name}`);
    continue;
  }
  const file = path.join(BADGES_DIR, badge.image);
  if (!existsSync(file)) failures.push(`Image absente de dist/ : ${badge.image}`);
}

if (!existsSync(DIST_HTML)) {
  failures.push('dist/index.html introuvable : lancez `npm run build`.');
} else {
  const html = await readFile(DIST_HTML, 'utf8');
  if (!html.includes('hasCredential')) failures.push('JSON-LD `hasCredential` absent du HTML.');
  if (!html.includes('EducationalOccupationalCredential')) {
    failures.push('JSON-LD `EducationalOccupationalCredential` absent du HTML.');
  }
  for (const badge of credentials.items ?? []) {
    if (badge.image && !html.includes(`/media/badges/${badge.image}`)) {
      failures.push(`Image non référencée dans le HTML : ${badge.image}`);
    }
    if (!html.includes(`width="300"`) || !html.includes(`height="300"`)) {
      failures.push('Attributs `width`/`height` manquants sur les images de badges.');
    }
  }
}

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

const urls = [...new Set([credentials.profileUrl, ...allCredentials.map((item) => item.url)])];
for (const url of urls) {
  if (!url) continue;
  const result = await checkUrl(url);
  if (!result.ok) failures.push(`Lien Credly inaccessible (${result.status ?? result.error}) : ${url}`);
  else if (result.status !== 200) warnings.push(`Lien Credly ${result.status} : ${url}`);
}

if (credentials.issuer !== 'Cisco Networking Academy') {
  failures.push(`Émetteur inattendu : ${credentials.issuer}`);
}

if (!/badges de formation/i.test(credentials.description ?? '')) {
  failures.push('La description doit préciser qu’il s’agit de badges de formation.');
}

for (const warning of warnings) console.warn(`AVERTISSEMENT : ${warning}`);

if (failures.length) {
  for (const failure of failures) console.error(`ECHEC : ${failure}`);
  console.error(`${failures.length} problème(s) de badges.`);
  process.exit(1);
}

console.log(`Badges vérifiés : ${allCredentials.length}`);
console.log(`Liens Credly vérifiés : ${urls.length}`);
console.log('Badges Cisco, dates, images et JSON-LD cohérents.');
