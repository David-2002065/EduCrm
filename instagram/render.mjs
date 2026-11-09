// HTML animatsiyani kadrma-kadr PNG ga yozadi (keyin ffmpeg video qiladi).
// Ishlatish: node render.mjs video.html 1080 1920 24 frames/story   (post: 1080 1350)
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [html, w, h, seconds, outDir, fpsArg] = process.argv.slice(2);
const fps = Number(fpsArg || 30);
const total = Math.round(Number(seconds) * fps);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
await page.goto(pathToFileURL(resolve(html)).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.getAnimations().forEach(a => a.pause()));

for (let i = 0; i < total; i++) {
  const ms = (i / fps) * 1000;
  await page.evaluate(t => document.getAnimations().forEach(a => { a.currentTime = t; }), ms);
  await page.screenshot({ path: `${outDir}/${String(i).padStart(4, '0')}.png` });
  if (i % fps === 0) process.stdout.write(`${i / fps}s `);
}
console.log('\ntayyor:', total, 'kadr');
await browser.close();
