// E2E 测试脚本
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('[ERR]', err.message));
  await page.setViewport({ width: 1280, height: 2400 });
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (/fonts\.googleapis|fonts\.gstatic/.test(req.url())) req.abort();
    else req.continue();
  });
  await page.goto('http://localhost:4000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  console.log('--- 1. Register ---');
  const reg = await page.evaluate(async () => {
    const r = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'e2e_tester_' + Date.now(), password: 'test1234', bio: 'E2E test' })
    });
    return { status: r.status, body: await r.json() };
  });
  console.log('register:', JSON.stringify(reg, null, 2).slice(0, 500));

  const token = reg.body?.token;
  if (!token) { console.log('no token, abort'); await browser.close(); return; }

  console.log('\n--- 2. Submit Solution ---');
  const sub = await page.evaluate(async (tok) => {
    const r = await fetch('/api/solutions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
      body: JSON.stringify({
        problem_id: 'consciousness',
        title: '我对意识的理解',
        content: '## 我的看法\n\n意识是物理过程的涌现属性。David Chalmers 提出的难问题确实很难，但我认为可以分两个层面：\n\n1. 功能层面：信息处理、反馈、自我模型\n2. 现象层面：qualia 是真实的\n\n我的猜想：意识可能对应某种信息整合程度（Φ 值），但这需要新的物理定律。',
        ai_assisted: true,
        ai_model: 'human+heuristic'
      })
    });
    return { status: r.status, body: await r.json() };
  }, token);
  console.log('submit:', JSON.stringify(sub, null, 2).slice(0, 800));

  console.log('\n--- 3. Wait for block ---');
  await new Promise(r => setTimeout(r, 6000));

  console.log('\n--- 4. Check Leaderboard ---');
  const lb = await page.evaluate(async () => {
    const r = await fetch('/api/leaderboard?limit=5');
    return await r.json();
  });
  console.log('leaderboard:', JSON.stringify(lb, null, 2).slice(0, 800));

  console.log('\n--- 5. Check Chain Info ---');
  const chain = await page.evaluate(async () => {
    const r = await fetch('/api/chain/info');
    return await r.json();
  });
  console.log('chain:', JSON.stringify(chain, null, 2));

  await browser.close();
  console.log('\n--- DONE ---');
})().catch(e => { console.error(e); process.exit(1); });
