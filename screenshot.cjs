// 用 puppeteer-core 批量截图
const puppeteer = require('puppeteer-core');
const path = require('path');

const URLS = [
  { url: 'http://localhost:4000/', file: 'home.png', w: 1280, h: 2400 },
  { url: 'http://localhost:4000/problems', file: 'problems.png', w: 1280, h: 2400 },
  { url: 'http://localhost:4000/problems/consciousness', file: 'problem.png', w: 1280, h: 2800 },
  { url: 'http://localhost:4000/leaderboard', file: 'leaderboard.png', w: 1280, h: 2400 },
  { url: 'http://localhost:4000/chain', file: 'chain.png', w: 1280, h: 2400 },
  { url: 'http://localhost:4000/auth', file: 'auth.png', w: 1280, h: 1200 },
  { url: 'http://localhost:4000/u/bob', file: 'profile.png', w: 1280, h: 2000 }
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox']
  });
  for (const u of URLS) {
    const page = await browser.newPage();
    page.on('pageerror', err => console.log('[pageerror]', u.url, err.message));
    await page.setViewport({ width: u.w, height: u.h, deviceScaleFactor: 1 });
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (/fonts\.googleapis|fonts\.gstatic/.test(req.url())) req.abort();
      else req.continue();
    });
    try {
      await page.goto(u.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    } catch (e) { console.log('warn:', u.url, e.message); }
    await new Promise(r => setTimeout(r, 3000));
    const out = path.join('C:\\Users\\P1\\Desktop\\hardproblems\\screenshots', u.file);
    await page.screenshot({ path: out, fullPage: false });
    console.log('saved:', u.file);
    await page.close();
  }
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
