import { chromium } from 'playwright-core';
const base = process.env.BASE || 'http://localhost:8080';
const shots = [['/', 'home.png', 1280], ['/c/tessie/', 'connector-tessie.png', 1280], ['/pick/tesla/', 'pick-tesla.png', 1280], ['/', 'home-mobile.png', 390]];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
for (const [path, file, w] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: w < 500 ? 2 : 1 });
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `screenshots/${file}`, fullPage: true });
  console.log('saved screenshots/' + file); await page.close();
}
await browser.close();
