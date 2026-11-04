// Construit le portfolio AVEC l'assistant activé dans dist-assistant, puis lance le test d'intégration.
import { spawnSync } from 'node:child_process';

const env = { ...process.env, PUBLIC_ASSISTANT_ENABLED: 'true' };
const shell = process.platform === 'win32';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('npx', ['astro', 'build', '--outDir', 'dist-assistant']);
run('node', ['--test', 'tests/assistant-integration.test.mjs']);
