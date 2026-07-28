"""管理端（/admin）回归测试：工作台、患者档案、复核队列、复核动作、要点版本、趋势分析、求助知识、切换护士、恢复演示。"""
import json
import os
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
    ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
    page = ctx.new_page()
    page.on('console', lambda m: (m.type == 'error' and console_errors.append(f'{page.url}: {m.text}')))
    page.on('pageerror', lambda e: console_errors.append(f'PAGEERROR {page.url}: {e}'))
    page.on('dialog', lambda d: d.accept())

    # ---------- 1. 工作台 ----------
    page.goto(BASE + '/admin', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/a01_dashboard.png', full_page=True)
    header_txt = page.locator('header').first.inner_text()
    check('工作台' in header_txt, '工作台打开', f'[BUG] 工作台标题缺失: {header_txt[:40]!r}')
    stats = page.locator('.stat-value').all_inner_texts()
    ok(f'工作台统计: {stats}')
    check(len(stats) == 4 and int(stats[0]) > 0, '工作台 4 卡且待复核 > 0', f'[BUG] 工作台统计异常: {stats}')
    queue_links = page.locator('a[href*="/admin/patients/"]').count()
    check(queue_links > 0, f'工作台队列链接 {queue_links} 条', '[BUG] 工作台队列为空')

    # ---------- 2. 患者档案 ----------
    page.goto(BASE + '/admin/patients', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/a02_patients.png', full_page=True)
    rows = page.locator('tbody tr').count()
    check(rows == 6, f'患者列表 {rows} 行', f'[BUG] 患者列表行数异常: {rows}（期望 6）')
    body = page.locator('main').inner_text()
    for name in ['马志远', '高淑芬', '张建国', '李素云', '赵海明', '周桂兰']:
        if name not in body:
            note(f'[BUG] 患者列表缺少 {name}')
    check('暂停' in body, '含暂停随访患者', '[可疑] 未见暂停状态患者')

    # ---------- 3. 复核队列 + 筛选 ----------
    real_rows = 'tbody tr:not(:has(td[colspan]))'  # 排除空状态占位行
    page.goto(BASE + '/admin/reviews', wait_until='networkidle')
    total = page.locator(real_rows).count()
    ok(f'复核队列全部: {total} 行')
    page.goto(BASE + '/admin/reviews?status=待复核', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/a03_reviews_pending.png', full_page=True)
    pending = page.locator(real_rows).count()
    check(pending >= 1, f'待复核 {pending} 行', '[BUG] 待复核队列为空')
    page.goto(BASE + '/admin/reviews?status=需随访', wait_until='networkidle')
    follow = page.locator(real_rows).count()
    ok(f'需随访: {follow} 行')
    page.goto(BASE + '/admin/reviews?status=已确认', wait_until='networkidle')
    confirmed = page.locator(real_rows).count()
    ok(f'已确认: {confirmed} 行')
    page.goto(BASE + '/admin/reviews?status=暂不适用', wait_until='networkidle')
    na = page.locator(real_rows).count()
    ok(f'暂不适用: {na} 行')
    check(total == pending + follow + confirmed + na,
          '各状态筛选行数合计 == 全部', f'[可疑] 筛选合计 {pending}+{follow}+{confirmed}+{na} 不等于全部 {total}')

    # ---------- 4. 切换护士为李文静 → 完整复核一条记录 ----------
    page.goto(BASE + '/admin/reviews?status=待复核', wait_until='networkidle')
    page.locator('aside button:has-text("李文静")').click()
    page.wait_for_timeout(800)
    # 记录第一行患者名与记录号
    first_row_txt = page.locator('tbody tr').first.inner_text()
    ok(f'准备复核: {first_row_txt[:50].strip()!r}')
    page.locator('tbody tr').first.locator('a:has-text("去复核")').click()
    try:
        page.wait_for_url('**/admin/patients/*', timeout=20000)
    except Exception:
        note('[可疑] 点击「去复核」后 URL 未跳转到患者详情')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)
    page.screenshot(path=f'{SHOTS}/a05_patient_detail.png', full_page=True)
    header_txt2 = page.locator('header').first.inner_text()
    check('SXBH-OS-2025' in header_txt2, f'进入患者详情: {header_txt2[:40].strip()!r}',
          f'[BUG] 未进入患者详情: {header_txt2[:40]!r}')

    li_sel = 'li:has(input[placeholder*="复核备注"])'
    confirmed_sel = li_sel + ' button.border-ok-500:has-text("已确认")'
    # 对焦点记录每个条目填写备注并点「已确认」，以「激活态数量 == 条目数」判定完成（容忍刷新竞态下的重复点击，复核操作幂等）
    clicks = 0
    for _ in range(14):
        total_items = page.locator(li_sel).count()
        done_items = page.locator(confirmed_sel).count()
        if total_items > 0 and done_items >= total_items:
            break
        target = None
        for b in page.locator(li_sel).all():
            cls = b.locator('button:has-text("已确认")').first.get_attribute('class') or ''
            if 'border-ok-500' not in cls:  # 尚未确认
                target = b
                break
        if target is None:
            break
        target.locator('input[placeholder*="复核备注"]').fill('自动化回归复核')
        target.locator('button:has-text("已确认")').first.click()
        clicks += 1
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(500)
    total_items = page.locator(li_sel).count()
    done_items = page.locator(confirmed_sel).count()
    ok(f'共点击「已确认」{clicks} 次，最终 {done_items}/{total_items} 个条目处于已确认态')
    check(total_items == 8, f'焦点记录共 {total_items} 个条目', f'[BUG] 条目数异常: {total_items}')
    check(done_items == total_items, f'{done_items}/{total_items} 条目全部完成复核',
          f'[BUG] 仅 {done_items}/{total_items} 个条目为已确认态')
    page.wait_for_load_state('networkidle')
    page.screenshot(path=f'{SHOTS}/a06_after_review.png', full_page=True)
    body_txt = page.locator('main').inner_text()
    check('李文静' in body_txt, '复核人显示李文静（护士切换生效）',
          '[BUG] 复核后未见「李文静」，护士切换未影响复核人')
    check('自动化回归复核' in body_txt, '护士备注已展示', '[可疑] 护士备注未展示')

    # 该记录状态应变为已确认（全部已确认且无需随访）
    page.goto(BASE + '/admin/reviews?status=已确认', wait_until='networkidle')
    ok('复核后「已确认」队列可查询')

    # ---------- 5. 要点版本：查看、新建、激活、恢复 ----------
    page.goto(BASE + '/admin/points', wait_until='networkidle')
    page.wait_for_selector('text=版本列表', timeout=10000)
    page.screenshot(path=f'{SHOTS}/a07_points.png', full_page=True)
    v_txt = page.locator('main').inner_text()
    for v in ['v1.0', 'v2.0', 'v3.0-草稿']:
        check(v in v_txt, f'版本列表含 {v}', f'[BUG] 版本列表缺少 {v}')
    check('启用中' in v_txt, '存在启用中版本', '[BUG] 无启用中版本标记')

    page.locator('button:has-text("新建版本")').click()
    page.fill('input[placeholder="v2.1-草稿"]', 'v2.1-测试')
    page.fill('input[placeholder="肠造口居家自护要点 v2.1"]', '自动化测试版本')
    page.fill('textarea[placeholder="本次变更要点"]', 'Playwright 自动创建，用于验证版本流程')
    page.locator('button:has-text("创建并复制")').click()
    page.wait_for_timeout(1500)
    page.wait_for_load_state('networkidle')
    page.screenshot(path=f'{SHOTS}/a09_points_created.png', full_page=True)
    check(page.locator('text=v2.1-测试').count() > 0, '新版本 v2.1-测试 创建成功', '[BUG] 新建版本失败')
    # 新版本应自动选中并展示复制来的 8 项要点
    main_txt = page.locator('main').inner_text()
    check('自动化测试版本' in main_txt, '新版本标题展示', '[可疑] 新版本未自动选中')

    activate = page.locator('button:has-text("设为启用版本")')
    check(activate.count() > 0, '出现「设为启用版本」按钮', '[BUG] 新建版本后无激活按钮')
    if activate.count() > 0:
        activate.first.click()
        page.wait_for_timeout(1500)
        page.wait_for_load_state('networkidle')
        page.screenshot(path=f'{SHOTS}/a10_points_activated.png', full_page=True)
        # 患者端要点页副标题应显示新激活版本的标题
        page2 = ctx.new_page()
        page2.set_viewport_size({'width': 390, 'height': 844})
        page2.goto(BASE + '/m/points', wait_until='networkidle')
        sub = page2.locator('header p').first.inner_text()
        check('自动化测试版本' in sub, f'激活后患者端要点页: {sub}',
              f'[BUG] 激活新版本后患者端要点页未更新: {sub!r}')
        # 打卡页仍为 8 项（复制自 v2.0）
        page2.goto(BASE + '/m/check', wait_until='networkidle')
        step_txt = page2.locator('text=/第 1 \\/ 8 步/').first
        check(step_txt.count() > 0, '激活新版本后打卡页仍 8 步', '[BUG] 打卡页步数异常')
        page2.close()
        # 恢复激活 v2.0
        page.locator('button:has-text("v2.0")').first.click()
        page.wait_for_timeout(800)
        act2 = page.locator('button:has-text("设为启用版本")')
        if act2.count() > 0:
            act2.first.click()
            page.wait_for_timeout(1200)
            ok('已重新激活 v2.0')
        resp = page.request.get(BASE + '/api/points/active')
        active_v = resp.json()['version']['version']
        check(active_v == 'v2.0', f'激活版本恢复为 {active_v}', f'[BUG] 激活版本未恢复: {active_v}')

    # 重复版本号应报错
    r = page.request.post(BASE + '/api/point-versions',
                          data=json.dumps({'version': 'v2.0', 'title': 'x', 'summary': 'y', 'creator': '陈素清'}),
                          headers={'content-type': 'application/json'})
    check(r.status == 400, '重复版本号 → 400', f'[可疑] 重复版本号返回 {r.status}')

    # ---------- 6. 趋势分析 ----------
    page.goto(BASE + '/admin/analytics', wait_until='networkidle')
    page.wait_for_timeout(1500)
    page.screenshot(path=f'{SHOTS}/a11_analytics.png', full_page=True)
    charts = page.locator('.recharts-wrapper').count()
    check(charts == 3, f'图表 {charts} 个', f'[BUG] 图表数量异常: {charts}（期望 3）')
    page.locator('button:has-text("最近 7 天")').click()
    page.wait_for_timeout(1200)
    page.screenshot(path=f'{SHOTS}/a12_analytics_7d.png', full_page=True)
    ok('切换最近 7 天完成')
    page.locator('button:has-text("最近 90 天")').click()
    page.wait_for_timeout(1200)
    ok('切换最近 90 天完成')

    # ---------- 7. 求助知识 ----------
    page.goto(BASE + '/admin/knowledge', wait_until='networkidle')
    page.screenshot(path=f'{SHOTS}/a13_knowledge.png', full_page=True)
    k_cards = page.locator('main .card').count()
    check(k_cards >= 4, f'知识分组卡片 {k_cards} 个', f'[BUG] 知识页卡片过少: {k_cards}')

    # ---------- 8. 管理端恢复演示数据 ----------
    page.locator('button:has-text("恢复演示数据")').click()
    page.wait_for_timeout(3000)
    page.wait_for_load_state('networkidle')
    page.goto(BASE + '/admin', wait_until='networkidle')
    stats2 = page.locator('.stat-value').all_inner_texts()
    ok(f'恢复演示后工作台统计: {stats2}')
    check(int(stats2[0]) >= 18, '恢复后待复核记录重置', f'[可疑] 恢复后待复核数异常: {stats2}')

    browser.close()

print('\n===== 管理端测试汇总 =====')
print(f'问题数: {len(issues)}')
for i in issues:
    print(' -', i)
print(f'控制台错误数: {len(console_errors)}')
for c in console_errors[:20]:
    print(' -', c[:300])
with open('/tmp/stoma_admin_report.json', 'w') as f:
    json.dump({'issues': issues, 'console_errors': console_errors}, f, ensure_ascii=False, indent=2)
