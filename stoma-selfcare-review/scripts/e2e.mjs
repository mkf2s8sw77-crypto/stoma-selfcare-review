import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.STOMA_BASE || 'http://127.0.0.1:10375/stoma-selfcare-review';
const OUT = path.join(process.cwd(), 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const execPath = process.env.STOMA_CHROME ||
  '/Users/zc-MAC/Library/Caches/ms-playwright/chromium-1232/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const errors = [];
const consoleLogs = [];
const requestFailures = [];

function track(label) {
  return { label, errors: [], warnings: [], failures: [] };
}

async function main() {
  const browser = await chromium.launch({ executablePath: execPath });

  // ====== PC 端 ======
  const pc = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const pcPage = await pc.newPage();
  const pcTrack = track('pc');
  pcPage.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    if (msg.type() === 'error') pcTrack.errors.push(text);
    else if (msg.type() === 'warning') pcTrack.warnings.push(text);
    else consoleLogs.push(text);
  });
  pcPage.on('pageerror', (err) => pcTrack.errors.push('pageerror: ' + err.message));
  pcPage.on('requestfailed', (req) => {
    pcTrack.failures.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText || ''}`);
  });

  // 1) 首页
  console.log('PC step 1: home');
  await pcPage.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
  await pcPage.waitForTimeout(400);
  await pcPage.screenshot({ path: path.join(OUT, 'home-landing.png') });

  // 2) 进入护士端
  console.log('PC step 2: admin');
  await pcPage.click('a:has-text("我是造口专科护士")');
  await pcPage.waitForURL('**/admin', { timeout: 15000 });
  await pcPage.waitForLoadState('networkidle');
  await pcPage.screenshot({ path: path.join(OUT, 'pc-01-dashboard.png') });

  // 3) 患者列表
  console.log('PC step 3: patients');
  await pcPage.goto(`${BASE}/admin/patients`, { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(300);
  await pcPage.screenshot({ path: path.join(OUT, 'pc-07-patient-list.png') });

  // 4) 患者详情
  console.log('PC step 4: patient detail');
  const detailLink = await pcPage.locator('a:has-text("详情")').first();
  await detailLink.scrollIntoViewIfNeeded();
  await detailLink.click();
  await pcPage.waitForURL(/\/admin\/patients\/\d+/, { timeout: 15000 });
  await pcPage.waitForLoadState('networkidle');
  await pcPage.waitForSelector('text=基本信息', { timeout: 10000 });
  await pcPage.waitForTimeout(800);
  await pcPage.screenshot({ path: path.join(OUT, 'pc-02-patient-detail.png') });

  // 4b) 对第一项执行复核（标记"已确认"）
  console.log('PC step 4b: review confirm');
  // 找到第一个 复核按钮组
  const firstConfirm = pcPage.locator('button:has-text("已确认")').first();
  if (await firstConfirm.isVisible().catch(() => false)) {
    await firstConfirm.click();
    await pcPage.waitForTimeout(1500);
    await pcPage.screenshot({ path: path.join(OUT, 'pc-02b-patient-reviewed.png') });
  }

  // 5) 复核队列
  console.log('PC step 5: review queue');
  await pcPage.goto(`${BASE}/admin/reviews?status=待复核`, { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(300);
  await pcPage.screenshot({ path: path.join(OUT, 'pc-03-review-queue.png') });

  // 5b) 切换"需随访"
  await pcPage.goto(`${BASE}/admin/reviews?status=需随访`, { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(300);

  // 6) 要点版本
  console.log('PC step 6: points');
  await pcPage.goto(`${BASE}/admin/points`, { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(500);
  await pcPage.screenshot({ path: path.join(OUT, 'pc-04-points-versions.png') });

  // 6b) 新建版本弹窗
  await pcPage.click('button:has-text("新建版本")');
  await pcPage.waitForSelector('input[placeholder*="v2.1"]');
  await pcPage.screenshot({ path: path.join(OUT, 'pc-08-points-create.png') });
  await pcPage.click('button:has-text("取消")');
  await pcPage.waitForTimeout(300);

  // 7) 趋势分析
  console.log('PC step 7: analytics');
  await pcPage.goto(`${BASE}/admin/analytics`, { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(1500);
  await pcPage.screenshot({ path: path.join(OUT, 'pc-05-analytics.png') });

  // 7b) 切到 7 天
  await pcPage.click('button:has-text("最近 7 天")');
  await pcPage.waitForTimeout(1200);

  // 8) 求助知识
  console.log('PC step 8: knowledge');
  await pcPage.goto(`${BASE}/admin/knowledge`, { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(300);
  await pcPage.screenshot({ path: path.join(OUT, 'pc-06-knowledge.png') });

  // 9) CSV 导出 - 单独 context 避免与之前的 listener 冲突
  console.log('PC step 9: CSV export');
  await pcPage.goto(`${BASE}/admin/analytics`, { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(800);
  try {
    const [dl] = await Promise.all([
      pcPage.waitForEvent('download', { timeout: 60000 }),
      pcPage.click('a:has-text("导出脱敏 CSV")'),
    ]);
    const dlPath = path.join(OUT, '_export.csv');
    await dl.saveAs(dlPath);
    const dlSize = fs.statSync(dlPath).size;
    console.log('CSV downloaded size', dlSize, 'suggestedFilename', dl.suggestedFilename());
    pcTrack.download = { size: dlSize, filename: dl.suggestedFilename() };
  } catch (e) {
    console.log('CSV download error', e.message);
    pcTrack.errors.push('csv download: ' + e.message);
  }

  await pc.close();
  errors.push({ label: 'pc', ...pcTrack });

  // ====== Mobile 端 ======
  const mobile = await browser.newContext({ ...devices['iPhone 14'], deviceScaleFactor: 1, viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();
  const mTrack = track('mobile');
  mp.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    if (msg.type() === 'error') mTrack.errors.push(text);
    else if (msg.type() === 'warning') mTrack.warnings.push(text);
    else consoleLogs.push(text);
  });
  mp.on('pageerror', (err) => mTrack.errors.push('pageerror: ' + err.message));
  mp.on('requestfailed', (req) => {
    mTrack.failures.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText || ''}`);
  });

  console.log('Mobile step 1: home');
  await mp.goto(`${BASE}/m`, { waitUntil: 'networkidle', timeout: 30000 });
  await mp.waitForTimeout(500);
  await mp.screenshot({ path: path.join(OUT, 'm-01-overview.png') });

  console.log('Mobile step 2: check step 1');
  await mp.goto(`${BASE}/m/check`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(500);
  await mp.screenshot({ path: path.join(OUT, 'm-02-check-step1.png') });

  // 提交一条
  const texts = [
    '用流动水洗手，准备好造口袋皮肤保护剂',
    '用温水轻拭造口和周围皮肤没有用酒精碘伏',
    '测了大小并记录造口颜色粉红',
    '轻轻揭掉旧底盘贴上新底盘按压两分钟',
    '记录了颜色性状量时间',
    '看了皮肤无红肿破溃过敏异味渗漏',
    '垃圾袋分类投放收好备用',
    '已记录等护士联系',
  ];
  for (let i = 0; i < 8; i++) {
    await mp.fill('textarea', texts[i]);
    await mp.click('button:has-text("已按要点执行")');
    await mp.waitForTimeout(150);
    if (i < 7) {
      await mp.click('button:has-text("下一步")');
      await mp.waitForTimeout(200);
    }
  }
  await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await mp.waitForTimeout(300);
  await mp.screenshot({ path: path.join(OUT, 'm-02-check-step8.png') });
  await mp.click('button:has-text("提交本次自护记录")');
  await mp.waitForSelector('text=自护记录已提交', { timeout: 15000 });
  await mp.evaluate(() => window.scrollTo(0, 0));
  await mp.waitForTimeout(400);
  await mp.screenshot({ path: path.join(OUT, 'm-02b-submitted.png') });

  console.log('Mobile step 3: records');
  await mp.goto(`${BASE}/m/records`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(400);
  await mp.screenshot({ path: path.join(OUT, 'm-03-records.png') });

  console.log('Mobile step 4: record detail');
  // 点击列表中第一条真正的记录链接（href 含 basePath，链接为 /stoma-selfcare-review/m/records/<id>）
  const links = await mp.locator('main ul li a[href*="/m/records/"]').all();
  console.log('  found record links:', links.length);
  if (links.length > 0) {
    await links[0].scrollIntoViewIfNeeded();
    await links[0].click();
    await mp.waitForURL(/\/m\/records\/\d+/, { timeout: 15000 });
    await mp.waitForLoadState('networkidle');
    await mp.waitForTimeout(500);
    await mp.screenshot({ path: path.join(OUT, 'm-04-record-detail.png') });
  } else {
    console.log('  no record links found, fallback navigation');
    await mp.goto(`${BASE}/m/records`, { waitUntil: 'networkidle' });
  }

  console.log('Mobile step 5: points');
  await mp.goto(`${BASE}/m/points`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(300);
  await mp.screenshot({ path: path.join(OUT, 'm-05-points.png') });

  console.log('Mobile step 6: profile');
  await mp.goto(`${BASE}/m/profile`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(300);
  await mp.screenshot({ path: path.join(OUT, 'm-06-profile.png') });

  await mp.close();
  errors.push({ label: 'mobile', ...mTrack });

  await browser.close();

  // 输出报告
  console.log('\n===== 错误报告 =====');
  for (const t of errors) {
    console.log(`\n[${t.label}] errors: ${t.errors.length}  warnings: ${t.warnings.length}  requestFailed: ${t.failures.length}`);
    for (const e of t.errors) console.log('  ERR:', e);
    for (const w of t.warnings.slice(0, 5)) console.log('  warn:', w);
    for (const f of t.failures) console.log('  failed:', f);
  }
  console.log('\n===== 完成 =====');
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
