// 截图脚本 - 验证前端增强
const puppeteer = require('puppeteer-core');
const path = require('path');

const SHOTS = [
  { url: 'http://localhost:4000/', name: 'home' },
  { url: 'http://localhost:4000/problems', name: 'problems' },
  { url: 'http://localhost:4000/leaderboard', name: 'leaderboard' },
  { url: 'http://localhost:4000/chain', name: 'chain' },
  { url: 'http://localhost:4000/auth', name: 'auth' },
  { url: 'http://localhost:4000/problems/millennium-pvsnp', name: 'problem-detail' },
  { url: 'http://localhost:4000/non-existent-page-xyz', name: '404' }
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  for (const s of SHOTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    try {
      await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(r => setTimeout(r, 3000));
      const out = path.join(__dirname, 'screenshots', `iter2_${s.name}.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log(`✓ ${s.name} -> ${out}`);
    } catch (e) {
      console.error(`✗ ${s.name}: ${e.message}`);
    }
    await page.close();
  }
  await browser.close();
})();
