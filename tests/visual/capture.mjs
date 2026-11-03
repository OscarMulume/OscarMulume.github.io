import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.VISUAL_URL ?? 'http://127.0.0.1:4173/';
const outDir = path.resolve(process.env.VISUAL_OUT ?? 'tests/visual/reference');
const widths = [390, 768, 1440];
const schemes = ['light', 'dark'];

const freeze = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  .reveal { opacity: 1 !important; transform: none !important; }
  html { scroll-behavior: auto !important; }
  .cursor-dot, .cursor-ring, .pfx-hint { display: none !important; }
`;

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const scheme of schemes) {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: scheme,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const response = await page.goto(baseUrl, { waitUntil: 'load', timeout: 60000 });
    if (!response || !response.ok()) throw new Error(`HTTP ${response?.status()} for ${baseUrl}`);
    await page.addStyleTag({ content: freeze });
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      page.waitForTimeout(8000),
    ]);
    await page.evaluate(async () => {
      const step = Math.max(300, Math.round(window.innerHeight * 0.75));
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.evaluate(async () => {
      await Promise.all([...document.images].map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          const done = () => resolve();
          image.addEventListener('load', done, { once: true });
          image.addEventListener('error', done, { once: true });
          setTimeout(done, 5000);
        });
      }));
    });
    await page.waitForTimeout(500);
    await page.evaluate(async () => {
      let last = -1;
      let stable = 0;
      for (let i = 0; i < 40; i += 1) {
        const height = document.documentElement.scrollHeight;
        stable = height === last ? stable + 1 : 0;
        last = height;
        if (stable >= 4) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    });
    const file = path.join(outDir, `home-${width}-${scheme}.png`);
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    const size = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      theme: document.documentElement.getAttribute('data-theme'),
    }));
    console.log(`${file} ${size.width}x${size.height} theme=${size.theme}`);
    await context.close();
  }
}

await browser.close();

