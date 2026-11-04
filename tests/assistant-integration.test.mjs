// Vérifie l'intégration de l'assistant M-SEC dans le portfolio, dans le HTML réellement construit.
// - dist/ : build par défaut (assistant désactivé) -> aucune trace du composant.
// - dist-assistant/ : build avec PUBLIC_ASSISTANT_ENABLED=true (voir scripts/test-assistant.mjs).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const SCRIPT_URL = 'https://oscarmulume.github.io/msec-technology-consulting/assistant/msec-assistant.js';

test('build par défaut : l\'assistant n\'est pas affiché tant que le drapeau est absent', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  assert.doesNotMatch(html, /msec-assistant/);
});

test('build avec le drapeau : composant français et fichier unique du site M-SEC', async () => {
  const html = await readFile('dist-assistant/index.html', 'utf8');

  assert.equal((html.match(/<msec-assistant\b/g) ?? []).length, 1);
  assert.match(html, /<msec-assistant lang="fr"><\/msec-assistant>/);

  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]*msec-assistant[^"]*)"[^>]*>/g)];
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0][1], SCRIPT_URL);
  assert.match(scripts[0][0], /\bdefer\b/);
});

test('aucune clé ni secret n\'est présent dans le HTML de l\'assistant', async () => {
  const html = await readFile('dist-assistant/index.html', 'utf8');
  assert.doesNotMatch(html, /nvapi-|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|service_role/i);
});
