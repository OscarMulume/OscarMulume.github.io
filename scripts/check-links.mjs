import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const TIMEOUT_MS = 20000;
const MAX_CONCURRENCY = 6;
const BOT_BLOCK_STATUSES = new Set([999]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function isExternal(url) {
  return /^https?:\/\//i.test(url);
}

function isSkippable(url) {
  return !url || /^(#|mailto:|tel:|javascript:|data:|\/\/)/i.test(url);
}

function isOriginOnly(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname === '/' && !parsed.search && !parsed.hash;
  } catch {
    return false;
  }
}

function localTarget(rawUrl, htmlFile) {
  const withoutHash = rawUrl.split('#')[0].split('?')[0];
  if (!withoutHash) return null;
  if (withoutHash.startsWith('/')) {
    const target = path.join(DIST, decodeURIComponent(withoutHash));
    return withoutHash.endsWith('/') ? path.join(target, 'index.html') : target;
  }
  return path.resolve(path.dirname(htmlFile), decodeURIComponent(withoutHash));
}

function extractLinks(html) {
  const links = [];
  const anchorPattern = /<a\b[^>]*\bhref="([^"]+)"/gi;
  const assetPattern = /<(?:img|script|link)\b[^>]*\b(?:src|href)="([^"]+)"/gi;
  for (const pattern of [anchorPattern, assetPattern]) {
    let match;
    while ((match = pattern.exec(html)) !== null) links.push(match[1]);
  }
  return links;
}

async function checkExternal(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (response.status >= 200 && response.status < 400) return { ok: true, status: response.status };
    if (BOT_BLOCK_STATUSES.has(response.status)) return { ok: true, status: response.status, warning: true };
    return { ok: false, status: response.status };
  } catch (error) {
    return { ok: false, error: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool(items, worker) {
  const results = [];
  let index = 0;
  async function next() {
    while (index < items.length) {
      const current = items[index++];
      results.push(await worker(current));
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, items.length) }, next));
  return results;
}

if (!existsSync(DIST)) {
  console.error('dist/ introuvable : lancez `npm run build` avant `npm run check:links`.');
  process.exit(1);
}

const htmlFiles = await walk(DIST);
const external = new Set();
const internal = new Map();
const invalid = [];

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  for (const rawUrl of extractLinks(html)) {
    if (isSkippable(rawUrl)) continue;
    if (isExternal(rawUrl)) {
      if (!isOriginOnly(rawUrl)) external.add(rawUrl);
      continue;
    }
    const target = localTarget(rawUrl, htmlFile);
    if (target && !internal.has(target)) internal.set(target, rawUrl);
  }
}

for (const [target, rawUrl] of internal) {
  try {
    const info = await stat(target);
    if (!info.isFile()) invalid.push({ url: rawUrl, reason: 'pas un fichier' });
  } catch {
    invalid.push({ url: rawUrl, reason: 'introuvable dans dist/' });
  }
}

const externalList = [...external].sort();
const externalResults = await runPool(externalList, async (url) => ({ url, result: await checkExternal(url) }));
const broken = externalResults.filter(({ result }) => !result.ok);
const warnings = externalResults.filter(({ result }) => result.warning);

console.log(`Liens internes vérifiés : ${internal.size}`);
console.log(`Liens externes vérifiés : ${externalList.length}`);
for (const { url, result } of warnings) {
  console.log(`AVERTISSEMENT ${result.status} (anti-bot) : ${url}`);
}
for (const { url, reason } of invalid) {
  console.error(`CASSE ${reason} : ${url}`);
}
for (const { url, result } of broken) {
  console.error(`CASSE ${result.status ?? result.error} : ${url}`);
}

if (invalid.length || broken.length) {
  console.error(`${invalid.length + broken.length} lien(s) cassé(s).`);
  process.exit(1);
}

console.log('Tous les liens internes et externes répondent correctement.');
