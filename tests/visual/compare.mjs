import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const referenceDir = path.resolve('tests/visual/reference');
const currentDir = path.resolve(process.env.VISUAL_OUT ?? 'tests/visual/output');
const diffDir = path.resolve('tests/visual/__diff__');
const tolerance = Number(process.env.VISUAL_TOLERANCE ?? '0.01');
const widths = [390, 768, 1440];
const schemes = ['light', 'dark'];

await mkdir(diffDir, { recursive: true });
let failures = 0;

for (const scheme of schemes) {
  for (const width of widths) {
    const name = `home-${width}-${scheme}.png`;
    const referencePath = path.join(referenceDir, name);
    const currentPath = path.join(currentDir, name);
    const reference = PNG.sync.read(await readFile(referencePath));
    const current = PNG.sync.read(await readFile(currentPath));

    if (reference.width !== current.width || reference.height !== current.height) {
      console.error(`ECHEC ${name} : dimensions ${reference.width}x${reference.height} != ${current.width}x${current.height}`);
      failures += 1;
      continue;
    }

    const diff = new PNG({ width: reference.width, height: reference.height });
    const diffPixels = pixelmatch(
      reference.data,
      current.data,
      diff.data,
      reference.width,
      reference.height,
      { threshold: 0.1, includeAA: false },
    );
    const ratio = diffPixels / (reference.width * reference.height);
    const percent = (ratio * 100).toFixed(3);
    const verdict = ratio <= tolerance ? 'OK' : 'ECHEC';
    if (ratio > tolerance) failures += 1;
    console.log(`${verdict} ${name} : ${percent} % (${diffPixels} px différents)`);
    if (ratio > tolerance) {
      await writeFile(path.join(diffDir, name), PNG.sync.write(diff));
    }
  }
}

if (failures > 0) {
  console.error(`Comparaison visuelle en échec : ${failures} capture(s) au-delà de ${(tolerance * 100).toFixed(1)} %.`);
  process.exit(1);
}

console.log(`Comparaison visuelle valide : ${widths.length * schemes.length} captures sous ${(tolerance * 100).toFixed(1)} %.`);
