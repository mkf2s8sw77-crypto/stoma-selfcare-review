import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.STOMA_BASE || 'http://127.0.0.1:10375/stoma-selfcare-review';
const OUT = path.join(process.cwd(), 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

async function shoot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
}

async function withTimeout(p, ms, label) {
  return await Promise.race([
    p,
    new Promise((_, r) => setTimeout(() => r(new Error(`timeout: ${label}`)), ms)),
  ]);
}

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.STOMA_CHROME || '/Users/zc-MAC/Library/Caches/ms-playwright/chromium-1232/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
  // PC context
  const pc = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const pcPage = await pc.newPage();

  // 1) Home landing
  await withTimeout(pcPage.goto(`${BASE}/`, { waitUntil: 'networkidle' }), 30000, 'home');
  await shoot(pcPage, 'home-landing');

  // 2) Admin dashboard
  await withTimeout(pcPage.goto(`${BASE}/admin`, { waitUntil: 'networkidle' }), 30000, 'admin');
  await shoot(pcPage, 'pc-01-dashboard');

  // 3) Admin patient detail
  await pcPage.goto(`${BASE}/admin/patients`, { waitUntil: 'networkidle' });
  await pcPage.waitForSelector('a:has-text("详情")', { timeout: 8000 });
  await pcPage.click('a:has-text("详情")');
  await pcPage.waitForLoadState('networkidle');
  await shoot(pcPage, 'pc-02-patient-detail');

  // 4) Admin reviews
  await pcPage.goto(`${BASE}/admin/reviews?status=待复核`, { waitUntil: 'networkidle' });
  await shoot(pcPage, 'pc-03-review-queue');

  // 5) Admin points (versions)
  await pcPage.goto(`${BASE}/admin/points`, { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(800);
  await shoot(pcPage, 'pc-04-points-versions');

  // 6) Admin analytics
  await pcPage.goto(`${BASE}/admin/analytics`, { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(1500);
  await shoot(pcPage, 'pc-05-analytics');

  // 7) Admin knowledge
  await pcPage.goto(`${BASE}/admin/knowledge`, { waitUntil: 'networkidle' });
  await shoot(pcPage, 'pc-06-knowledge');

  // 8) Admin patients list (also pc-07 reused)
  await pcPage.goto(`${BASE}/admin/patients`, { waitUntil: 'networkidle' });
  await shoot(pcPage, 'pc-07-patient-list');

  // 9) Create new point version in dialog
  await pcPage.goto(`${BASE}/admin/points`, { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(500);
  await pcPage.click('button:has-text("新建版本")');
  await pcPage.waitForSelector('input[placeholder="v2.1-草稿"]');
  await pcPage.fill('input[placeholder="v2.1-草稿"]', 'v2.1-草稿');
  await pcPage.fill('input[placeholder="肠造口居家自护要点 v2.1"]', '肠造口居家自护要点 v2.1');
  await pcPage.fill('textarea', '新增 1 项心理与社交支持要点，其余保持 v2.0。');
  await shoot(pcPage, 'pc-08-points-create');

  // 10) Close dialog by clicking cancel
  await pcPage.click('button:has-text("取消")');
  await pcPage.waitForTimeout(300);

  // === Mobile context ===
  const iphone = devices['iPhone 14'];
  const mobile = await browser.newContext({ ...iphone, deviceScaleFactor: 1, viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();

  // m-01 overview
  await mp.goto(`${BASE}/m`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(500);
  await shoot(mp, 'm-01-overview');

  // m-02 check step 1
  await mp.goto(`${BASE}/m/check`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(700);
  await shoot(mp, 'm-02-check-step1');

  // fill some text on step 1 and proceed
  await mp.fill('textarea', '操作前我用流动水洗了手，准备好了造口袋、温水和皮肤保护剂。');
  await mp.click('button:has-text("已按要点执行")');
  await mp.click('button:has-text("下一步")');
  await mp.waitForTimeout(400);
  // step 2
  await mp.fill('textarea', '用温水把造口和周围皮肤擦干净，没有用酒精和碘伏。');
  await mp.click('button:has-text("已按要点执行")');
  await mp.click('button:has-text("下一步")');
  await mp.waitForTimeout(300);
  // step 3
  await mp.fill('textarea', '造口颜色粉红，量了一下直径约 28 毫米，记下来了。');
  await mp.click('button:has-text("已按要点执行")');
  await mp.click('button:has-text("下一步")');
  await mp.waitForTimeout(300);
  // step 4
  await mp.fill('textarea', '轻轻揭掉旧底盘，贴上新底盘后按压了两分钟。');
  await mp.click('button:has-text("已按要点执行")');
  await mp.click('button:has-text("下一步")');
  await mp.waitForTimeout(300);
  // step 5
  await mp.fill('textarea', '今天造口排出黄色糊状物约 200 毫升，时间是上午 9 点。');
  await mp.click('button:has-text("已按要点执行")');
  await mp.click('button:has-text("下一步")');
  await mp.waitForTimeout(300);
  // step 6
  await mp.fill('textarea', '造口周围皮肤有点发红，没有破溃，没有渗漏。');
  await mp.click('button:has-text("已按要点执行")');
  await mp.click('button:has-text("下一步")');
  await mp.waitForTimeout(300);
  // step 7
  await mp.fill('textarea', '用过的底盘装进垃圾袋分类处理，备用品放回柜子。');
  await mp.click('button:has-text("已按要点执行")');
  await mp.click('button:has-text("下一步")');
  await mp.waitForTimeout(300);
  // step 8
  await mp.fill('textarea', '今天没有异常，已经记录下来等护士联系。');
  await mp.click('button:has-text("已按要点执行")');
  await mp.waitForTimeout(300);
  // scroll to bottom to show submit
  await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shoot(mp, 'm-02-check-step8');

  // submit
  await mp.click('button:has-text("提交本次自护记录")');
  await mp.waitForSelector('text=自护记录已提交', { timeout: 15000 });
  await mp.evaluate(() => window.scrollTo(0, 0));
  await mp.waitForTimeout(400);
  await shoot(mp, 'm-02b-submitted');

  // m-03 records list
  await mp.goto(`${BASE}/m/records`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(400);
  await shoot(mp, 'm-03-records');

  // m-04 record detail
  const firstRec = mp.locator('a[href*="/m/records/"]').first();
  await firstRec.waitFor({ timeout: 15000 });
  await firstRec.click();
  await mp.waitForLoadState('networkidle');
  await mp.waitForTimeout(600);
  await shoot(mp, 'm-04-record-detail');

  // m-05 points
  await mp.goto(`${BASE}/m/points`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(400);
  await shoot(mp, 'm-05-points');

  // m-06 profile
  await mp.goto(`${BASE}/m/profile`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(400);
  await shoot(mp, 'm-06-profile');

  await browser.close();
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
