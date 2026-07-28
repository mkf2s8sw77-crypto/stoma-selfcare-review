"""患者端（/m）回归测试：首页、打卡、记录、要点、我的、切换患者、恢复演示。"""
import json
import os
import re
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:10375/stoma-selfcare-review'
SHOTS = '/tmp/stoma_shots'
os.makedirs(SHOTS, exist_ok=True)

issues = []
console_errors = []


def note(msg):
    issues.append(msg)
    print(f'[ISSUE] {msg}')


def ok(msg):
    print(f'[OK] {msg}')


def check(cond, ok_msg, issue_msg):
    if cond:
        ok(ok_msg)
    else:
        note(issue_msg)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 390, 'height': 844})
    page = ctx.new_page()
    page.on('console', lambda m: (m.type == 'error' and console_errors.append(f'{page.url}: {m.text}')))
    page.on('pageerror', lambda e: console_errors.append(f'PAGEERROR {page.url}: {e}'))
    page.on('dialog', lambda d: d.accept())

    # ---------- 1. Landing ----------
    page.goto(BASE + '/', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/01_landing.png', full_page=True)
    h1 = page.locator('h1').first.inner_text()
    check('肠造口居家自护' in h1, '首页标题正常', f'首页标题异常: {h1!r}')
    stats = page.locator('.stat-value').all_inner_texts()
    ok(f'首页统计卡: {stats}')
    check(stats and stats[0].strip() == '6', '首页在册患者 6 名', f'首页在册患者数异常: {stats}')

    # ---------- 2. 患者端首页（干净浏览器 → 默认首位患者） ----------
    page.goto(BASE + '/m', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/02_m_home.png', full_page=True)
    title = page.locator('header h1').inner_text()
    check('你好，马志远' in title, f'默认身份首页: {title}', f'首页默认身份异常: {title!r}')
    tabs = [t.strip() for t in page.locator('nav a').all_inner_texts()]
    check(tabs == ['首页', '自护打卡', '执行记录', '要点', '我的'], f'底部 5 Tab: {tabs}', f'底部 Tab 异常: {tabs}')
    # 首页应展示最近一次记录卡片
    check(page.locator('text=最近一次自护记录').count() > 0, '首页含最近记录卡', '[BUG] 首页缺少最近记录卡')

    # ---------- 3. 切换患者 → 各页面身份应同步 ----------
    page.locator('header button:has-text("马志远")').click()
    page.locator('header button:has-text("高淑芬")').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    page.screenshot(path=f'{SHOTS}/03_m_home_after_switch.png', full_page=True)
    title2 = page.locator('header h1').inner_text()
    check('你好，高淑芬' in title2, f'切换后首页身份更新: {title2}',
          f'[BUG] 切换患者后首页身份未更新: {title2!r}')

    # 记录列表应为高淑芬的记录
    page.goto(BASE + '/m/records', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/04_m_records.png', full_page=True)
    sub = page.locator('header p').inner_text()
    m_count = re.search(r'已收集 (\d+) 次', sub)
    n_recs = int(m_count.group(1)) if m_count else -1
    ok(f'高淑芬记录页: {sub}')

    # 我的页面应为高淑芬
    page.goto(BASE + '/m/profile', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/05_m_profile.png', full_page=True)
    profile_txt = page.locator('main').inner_text()
    check('高淑芬' in profile_txt and 'SXBH-OS-2025-002' in profile_txt,
          '我的页面已切换为高淑芬', f'[BUG] 我的页面未随切换更新: {profile_txt[:60]!r}')

    # ---------- 4. 要点页 ----------
    page.goto(BASE + '/m/points', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/06_m_points.png', full_page=True)
    points_txt = page.locator('main').inner_text()
    check('准备与洗手' in points_txt and '求助与随访安排' in points_txt,
          '要点页含 v2.0 首尾要点', '[BUG] 要点页内容缺失')
    check('历史版本' in points_txt, '要点页含历史版本区', '[可疑] 要点页缺少历史版本区')

    # ---------- 5. 打卡提交流程 ----------
    page.goto(BASE + '/m/check', wait_until='networkidle')
    page.wait_for_selector('text=第 1 / 8 步', timeout=10000)
    sub_check = page.locator('header p').first.inner_text()
    check('按 8 项要点' in sub_check, f'打卡页副标题动态正确: {sub_check}', f'[可疑] 打卡页副标题: {sub_check!r}')
    texts = [
        '用流动水按七步洗手法洗了手，造口袋、温水、皮肤保护剂、垃圾袋都备齐了。',
        '用温水清洁了造口和周围皮肤，没有用酒精和碘伏。',
        '测量了造口大小约 28 毫米，颜色粉红，记录在本子上。',
        '轻轻揭掉旧底盘，贴上新底盘后按压了两分钟。',
        '排出黄色糊状物约 200 毫升，时间上午 9 点，性状量都记录了。',
        '造口周围皮肤无红肿破溃，无异味无渗漏。',
        '用过的底盘按生活垃圾分类处理，备用品保存好。',
        '今天没有异常，已记录提交，等护士随访前联系。',
    ]
    for i in range(8):
        page.locator('button:has-text("已按要点执行")').first.click()
        page.locator('textarea').first.fill(texts[i])
        if i < 7:
            page.locator('button:has-text("下一步")').click()
    page.wait_for_selector('text=记录信息')
    submit_btn = page.locator('button:has-text("提交本次自护记录")')
    check(not submit_btn.is_disabled(), '8 步全部选择后提交按钮启用', '[BUG] 提交按钮仍禁用')
    submit_btn.click()
    page.wait_for_selector('text=自护记录已提交', timeout=15000)
    page.screenshot(path=f'{SHOTS}/08_check_done.png', full_page=True)
    done_text = page.locator('main').inner_text()
    m = re.search(r'平均匹配度\s*(\d+)%', done_text)
    avg = int(m.group(1)) if m else -1
    check(avg >= 60, f'提交平均匹配度 {avg}%', f'[可疑] 高相关文本平均匹配度过低: {avg}%')
    statuses = re.findall(r'(与要点一致|表达模糊，需再次确认|未明确提及|未提及|依据不足)', done_text)
    ok(f'AI 状态分布: {statuses}')

    # 查看完整复核 → 详情页应为高淑芬的记录
    page.locator('button:has-text("查看完整复核")').click()
    try:
        page.wait_for_url('**/m/records/*', timeout=20000)
    except Exception:
        note('[可疑] 点击「查看完整复核」后 URL 未跳转到记录详情')
    page.wait_for_load_state('networkidle')
    page.screenshot(path=f'{SHOTS}/09_record_detail.png', full_page=True)
    detail_sub = page.locator('header p').first.inner_text()
    check('高淑芬' in detail_sub, f'详情页患者为高淑芬: {detail_sub}',
          f'[BUG] 以高淑芬打卡，详情页患者却是: {detail_sub!r}')
    detail_txt = page.locator('main').inner_text()
    check('待复核' in detail_txt, '新记录整体状态为待复核', f'[可疑] 新记录状态异常')
    check(detail_txt.count('AI 匹配') >= 8, '详情页含 8 个条目比对', '[可疑] 详情页条目数不足 8')

    # ---------- 6. 记录列表首条应为刚提交记录 ----------
    page.goto(BASE + '/m/records', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/10_m_records_after.png', full_page=True)
    sub2 = page.locator('header p').inner_text()
    m2 = re.search(r'已收集 (\d+) 次', sub2)
    n_recs2 = int(m2.group(1)) if m2 else -1
    check(n_recs2 == n_recs + 1, f'记录数 +1（{n_recs} → {n_recs2}）',
          f'[BUG] 提交后记录数未增加: {n_recs} → {n_recs2}')
    first_txt = page.locator('main ul li').first.inner_text()
    check('待复核' in first_txt, f'最新记录为刚提交项: {first_txt[:50].strip()!r}',
          f'[可疑] 记录列表首条不是新提交记录: {first_txt!r}')

    # ---------- 7. 恢复演示数据 → 身份自愈 ----------
    page.locator('button:has-text("恢复演示")').click()
    page.wait_for_timeout(3000)
    page.wait_for_load_state('networkidle')
    page.goto(BASE + '/m', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/11_m_home_after_reset.png', full_page=True)
    check(page.locator('header button:has-text("选择患者")').count() == 0,
          '恢复演示后切换器未卡在「选择患者」',
          '[BUG] 恢复演示数据后切换器显示「选择患者」且未自动回落默认患者')
    switcher_txt = page.locator('header button:has-text("先生"), header button:has-text("女士")').first.inner_text()
    ok(f'恢复演示后切换器: {switcher_txt}')
    title3 = page.locator('header h1').inner_text()
    check('你好，' in title3, f'恢复演示后首页标题: {title3}', f'[BUG] 恢复后首页标题异常: {title3!r}')

    # ---------- 8. API 冒烟 ----------
    for path in ['/api/landing', '/api/patients', '/api/points/active', '/api/reviews/queue',
                 '/api/analytics?range=30', '/api/knowledge', '/api/point-versions']:
        r = page.request.get(BASE + path)
        check(r.status == 200, f'API GET {path} → 200', f'[BUG] API {path} → {r.status}')
    # 单个患者聚合（用真实首个患者 id）
    plist = page.request.get(BASE + '/api/patients').json()['patients']
    pid0 = plist[0]['id']
    r = page.request.get(BASE + f'/api/patients/{pid0}')
    check(r.status == 200 and 'patient' in r.json(), f'API /api/patients/{pid0} 含 patient',
          f'[BUG] /api/patients/{pid0} → {r.status}')
    r = page.request.get(BASE + '/api/patients/99999')
    check(r.status == 404, 'API 不存在患者 → 404', f'[可疑] 不存在患者返回 {r.status}')
    # 记录 GET / 参数校验（用该患者真实记录 id）
    recs = page.request.get(BASE + f'/api/records?patientId={pid0}').json()['records']
    check(len(recs) > 0, f'API 患者 {pid0} 有 {len(recs)} 条记录', '[BUG] 患者无记录')
    rid0 = recs[0]['id']
    r = page.request.get(BASE + f'/api/records/{rid0}')
    check(r.status == 200 and 'items' in r.json(), f'API /api/records/{rid0} 含 items',
          f'[BUG] /api/records/{rid0} → {r.status}')
    r = page.request.get(BASE + '/api/records')
    check(r.status == 400, 'API /api/records 缺 patientId → 400', f'[可疑] 缺参返回 {r.status}')
    # recompute API
    r = page.request.post(BASE + f'/api/records/{rid0}/recompute')
    check(r.status == 200 and r.json().get('ok'), 'API recompute → ok', f'[BUG] recompute → {r.status}')
    # 护士复核 API：对一条待复核记录的一个条目做「需随访」复核
    queue = page.request.get(BASE + '/api/reviews/queue?status=待复核').json()['records']
    if queue:
        item0 = queue[0]['items'][0]
        r = page.request.post(BASE + f"/api/records/{item0['id']}/review",
                              data=json.dumps({'status': '需随访', 'note': 'API 回归', 'reviewer': '李文静'}),
                              headers={'content-type': 'application/json'})
        check(r.status == 200 and r.json().get('ok'), 'API 条目复核 → ok', f'[BUG] 复核 API → {r.status} {r.text()[:120]}')
        r2 = page.request.post(BASE + f"/api/records/{item0['id']}/review",
                               data=json.dumps({'status': '非法状态', 'reviewer': '李文静'}),
                               headers={'content-type': 'application/json'})
        check(r2.status == 400, 'API 非法复核状态 → 400', f'[可疑] 非法状态返回 {r2.status}')
    else:
        note('[可疑] 无待复核记录可供 API 复核测试')
    # 恢复干净状态，供管理端测试使用
    page.request.post(BASE + '/api/reset-demo')
    # CSV 导出
    r = page.request.get(BASE + '/api/export.csv?range=30')
    ct = r.headers.get('content-type') or ''
    if r.status == 200 and 'csv' in ct:
        lines = r.text().strip().split('\n')
        check(len(lines) > 10, f'CSV 导出 {len(lines)-1} 行数据', f'[BUG] CSV 行数过少: {len(lines)}')
        check(lines[0].startswith('﻿记录编号'), 'CSV 表头正确（含 BOM）', f'[可疑] CSV 表头: {lines[0][:30]!r}')
    else:
        note(f'[BUG] CSV 导出失败: {r.status} {ct}')
    # 非法 range 应回落 30
    r = page.request.get(BASE + '/api/analytics?range=99999')
    check(r.status == 200 and r.json().get('rangeDays') == 30, 'analytics 非法 range 回落 30',
          f'[可疑] 非法 range 未回落: {r.json().get("rangeDays") if r.status==200 else r.status}')

    browser.close()

print('\n===== 患者端测试汇总 =====')
print(f'问题数: {len(issues)}')
for i in issues:
    print(' -', i)
print(f'控制台错误数: {len(console_errors)}')
for c in console_errors[:20]:
    print(' -', c[:300])
with open('/tmp/stoma_patient_report.json', 'w') as f:
    json.dump({'issues': issues, 'console_errors': console_errors}, f, ensure_ascii=False, indent=2)
