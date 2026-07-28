import { db, raw } from './index';
import {
  patients,
  carePointVersions,
  carePoints,
  careRecords,
  careRecordItems,
  nurseAccounts,
  auditLogs,
  appMeta,
} from './schema';
import { POINT_VERSIONS } from '../lib/points';
import { reviewPoint, type ReviewInput } from '../lib/review';
import { CARE_POINT_MAP_BY_VERSION } from './seed-points';

function now(): string {
  return new Date().toISOString();
}

function offsetDate(daysAgo: number, base = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function dayDate(daysAgo: number, base = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function pickN<T>(arr: T[], n: number): T[] {
  const c = [...arr];
  const out: T[] = [];
  while (out.length < n && c.length) {
    out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]);
  }
  return out;
}

export function resetDatabase(): void {
  const tables = [
    'care_record_items',
    'care_records',
    'care_points',
    'care_point_versions',
    'audit_logs',
    'patients',
    'nurse_accounts',
    'app_meta',
  ];
  for (const t of tables) raw.exec(`DELETE FROM ${t};`);
  // 重置自增序列，保证每次「恢复演示数据」后患者编号稳定从 1 开始
  raw.exec(`DELETE FROM sqlite_sequence WHERE name IN (${tables.map((t) => `'${t}'`).join(', ')});`);
}

export function seed(): void {
  resetDatabase();

  // ---- 护士账号 ----
  const nurses = [
    { username: 'chensuqing', displayName: '陈素清', role: '造口专科护士' },
    { username: 'liwenjing', displayName: '李文静', role: '造口专科护士' },
  ];
  const nurseIds: number[] = [];
  for (const n of nurses) {
    const res = db
      .insert(nurseAccounts)
      .values({ ...n, createdAt: now() })
      .run();
    nurseIds.push(Number(res.lastInsertRowid));
  }

  // ---- 护理要点版本 ----
  const versionIds: Record<string, number> = {};
  const v2PointIdByCode: Record<string, number[]> = {};
  for (const v of POINT_VERSIONS) {
    const res = db
      .insert(carePointVersions)
      .values({
        version: v.version,
        title: v.title,
        summary: v.summary,
        isActive: v.isActive,
        createdBy: '陈素清',
        createdAt: offsetDate(randInt(30, 90)),
        activatedAt: v.isActive ? offsetDate(randInt(10, 30)) : null,
      })
      .run();
    versionIds[v.version] = Number(res.lastInsertRowid);
    const points = CARE_POINT_MAP_BY_VERSION[v.version];
    const insertedIds: number[] = [];
    for (const p of points) {
      const r = db.insert(carePoints)
        .values({
          versionId: versionIds[v.version],
          code: p.code,
          orderIdx: p.orderIdx,
          title: p.title,
          content: p.content,
          mustFlag: p.mustFlag,
          keywords: JSON.stringify(p.keywords),
          evidenceHints: JSON.stringify(p.evidenceHints),
          createdAt: now(),
        })
        .run();
      insertedIds.push(Number(r.lastInsertRowid));
    }
    if (v.version === 'v2.0') {
      v2PointIdByCode[v.version] = insertedIds;
    }
  }

  // 审计：版本发布
  for (const v of POINT_VERSIONS) {
    db.insert(auditLogs)
      .values({
        actor: '陈素清',
        action: 'PUBLISH_VERSION',
        targetType: 'care_point_version',
        targetId: v.version,
        meta: JSON.stringify({ summary: v.summary }),
        createdAt: offsetDate(randInt(10, 60)),
      })
      .run();
  }

  // ---- 患者 ----
  const patientsDef = [
    {
      code: 'SXBH-OS-2025-001',
      name: '马志远 先生',
      gender: '男' as const,
      ageBand: '60-70',
      stomaType: '乙状结肠造口 · 永久',
      surgeryDate: '2025-09-12',
      caregiverRole: '主要照护者：配偶 王女士',
      primaryNurse: '陈素清',
      status: '在册' as const,
    },
    {
      code: 'SXBH-OS-2025-002',
      name: '高淑芬 女士',
      gender: '女' as const,
      ageBand: '50-60',
      stomaType: '回肠造口 · 临时',
      surgeryDate: '2025-10-04',
      caregiverRole: '主要照护者：本人',
      primaryNurse: '李文静',
      status: '在册' as const,
    },
    {
      code: 'SXBH-OS-2025-003',
      name: '张建国 先生',
      gender: '男' as const,
      ageBand: '70+',
      stomaType: '乙状结肠造口 · 永久',
      surgeryDate: '2025-08-21',
      caregiverRole: '主要照护者：儿子',
      primaryNurse: '陈素清',
      status: '在册' as const,
    },
    {
      code: 'SXBH-OS-2025-004',
      name: '李素云 女士',
      gender: '女' as const,
      ageBand: '40-50',
      stomaType: '横结肠造口 · 临时',
      surgeryDate: '2025-11-15',
      caregiverRole: '主要照护者：本人',
      primaryNurse: '李文静',
      status: '在册' as const,
    },
    {
      code: 'SXBH-OS-2025-005',
      name: '赵海明 先生',
      gender: '男' as const,
      ageBand: '30-40',
      stomaType: '回肠造口 · 临时',
      surgeryDate: '2025-12-02',
      caregiverRole: '主要照护者：配偶 刘女士',
      primaryNurse: '陈素清',
      status: '在册' as const,
    },
    {
      code: 'SXBH-OS-2025-006',
      name: '周桂兰 女士',
      gender: '女' as const,
      ageBand: '60-70',
      stomaType: '乙状结肠造口 · 永久',
      surgeryDate: '2025-07-30',
      caregiverRole: '主要照护者：女儿',
      primaryNurse: '李文静',
      status: '暂停' as const,
    },
  ];

  const patientIds: number[] = [];
  for (const p of patientsDef) {
    const res = db
      .insert(patients)
      .values({ ...p, note: '', createdAt: offsetDate(randInt(20, 120)) })
      .run();
    patientIds.push(Number(res.lastInsertRowid));
  }

  // ---- 演示记录 ----
  const v2Points = CARE_POINT_MAP_BY_VERSION['v2.0'];
  const pointIdsInDb: number[] = v2PointIdByCode['v2.0'] ?? v2Points.map((p) => p.id);
  const executions = ['已按要点执行', '已按要点执行', '已按要点执行', '部分执行', '部分执行', '暂未执行', '不适用'] as const;

  const TEXT_POOL: Record<string, string[]> = {
    P1: [
      '操作前我按七步洗手法洗了手，准备好了造口袋、温水、皮肤保护剂和垃圾袋，一切顺利。',
      '用流动水规范洗手，造口袋、皮肤保护剂、软毛巾和垃圾袋都提前备齐了。',
      '洗手和准备都按要点做了，温水流动水都备齐了，垃圾袋和造口袋也准备好了。',
    ],
    P2: [
      '用温水把造口和周围皮肤轻轻擦干净了，没有用酒精和碘伏，皮肤不刺激。',
      '温水清洁了造口和周围皮肤，避开酒精和碘伏这类刺激性消毒剂。',
      '用温水轻拭造口和周围皮肤，没用酒精和碘伏，皮肤没有发红。',
    ],
    P3: [
      '造口颜色粉红，量了一下直径大概 28 毫米，记在记录本上了。',
      '测了造口大小约 30 毫米，颜色正常，形态也记了下来。',
      '今天测量了造口大小和颜色，颜色粉红形态正常，记录在册。',
    ],
    P4: [
      '轻轻把旧底盘揭下来，用底盘剥离喷剂辅助，新底盘贴上后按压了两分钟。',
      '用剥离喷剂辅助揭除旧底盘，新底盘贴好后按压了一到两分钟。',
      '轻柔揭掉旧底盘并贴上新底盘，按标准流程按压了一两分钟让底盘贴合。',
    ],
    P5: [
      '今天造口排出黄色糊状物大概 200 毫升，时间是上午 9 点。',
      '记录了排泄物颜色、性状、量和时间，颜色黄色糊状约 200 毫升。',
      '今天造口排出成形粪便约 150 毫升，颜色正常，时间下午 3 点。',
    ],
    P6: [
      '造口周围皮肤无红肿破溃，也没有渗漏和异味。',
      '皮肤看着正常没有红肿破溃，也没有异味渗漏。',
      '造口及周围皮肤无红肿、破溃、过敏、异味、渗漏。',
    ],
    P7: [
      '旧底盘和袋子放进垃圾袋生活垃圾分类处理，备用品放回柜子。',
      '使用过的底盘造口袋按生活垃圾分类投放，备用物品妥善保存。',
      '垃圾分类处理了用过的底盘，备用的造口袋放回柜子保存。',
    ],
    P8: [
      '今天没有异常，把情况记录下来提交，等护士在随访前联系。',
      '已把异常情况记录并提交，等待造口专科护士在随访前联系。',
      '记录了今天的执行情况提交，等护士联系随访。',
    ],
  };

  const GENERAL_NOTES = [
    '今天整体比较顺利。',
    '工作比较忙，时间紧。',
    '家人一起协助完成的。',
    '心情一般。',
    '准备明天的复查资料。',
  ];

  for (let i = 0; i < patientIds.length; i++) {
    const pid = patientIds[i];
    const profile = ['good', 'medium', 'good', 'bad', 'medium', 'medium'][i];
    const count = profile === 'good' ? randInt(12, 18) : profile === 'medium' ? randInt(9, 14) : randInt(7, 11);
    const versionId = versionIds['v2.0'];
    for (let d = 0; d < count; d++) {
      const daysAgo = randInt(1, 60);
      const date = dayDate(daysAgo);
      const recordedBy = rand(['本人', '配偶', '儿子', '女儿']);
      const generalNote = rand(GENERAL_NOTES);
      const recordRes = db
        .insert(careRecords)
        .values({
          patientId: pid,
          versionId,
          recordedAt: new Date(`${date}T${String(randInt(7, 21)).padStart(2, '0')}:${String(randInt(0, 59)).padStart(2, '0')}:00`).toISOString(),
          recordedBy,
          generalNote,
          status: '待复核',
          createdAt: offsetDate(daysAgo - 1),
        })
        .run();
      const recordId = Number(recordRes.lastInsertRowid);

      let okCount = 0;
      for (let pi = 0; pi < v2Points.length; pi++) {
        const p = v2Points[pi];
        let exec: typeof executions[number];
        if (profile === 'good') {
          exec = Math.random() < 0.92 ? '已按要点执行' : rand(['部分执行', '不适用', '不适用']);
        } else if (profile === 'medium') {
          exec = rand(['已按要点执行', '已按要点执行', '已按要点执行', '部分执行', '不适用']);
        } else {
          exec = rand(['部分执行', '暂未执行', '已按要点执行', '不适用']);
        }
        const text =
          exec === '暂未执行'
            ? ''
            : exec === '不适用'
              ? ''
              : rand(TEXT_POOL[p.code] ?? ['']);
        const pointDef = {
          code: p.code,
          orderIdx: p.orderIdx,
          title: p.title,
          content: p.content,
          mustFlag: !!p.mustFlag,
          keywords: p.keywords,
          evidenceHints: p.evidenceHints,
        };
        const review = reviewPoint({ point: pointDef, execution: exec, rawText: text });
        if (review.aiStatus === '与要点一致') okCount++;
        db.insert(careRecordItems)
          .values({
            recordId,
            pointId: pointIdsInDb[pi],
            execution: exec,
            rawText: text,
            aiStatus: review.aiStatus,
            aiMatch: review.aiMatch,
            aiEvidence: review.aiEvidence,
            aiReason: review.aiReason,
            nurseStatus: '未复核',
            nurseNote: null,
            reviewedAt: null,
            reviewedBy: null,
          })
          .run();
      }
    }
  }

  // 给部分较早的历史记录打上护士复核（保留最近 18 条作为待复核演示）
  const allRecords = db
    .select()
    .from(careRecords)
    .all()
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  const older = allRecords.slice(18);
  for (const rec of older) {
    const items = db.select().from(careRecordItems).all().filter((x) => x.recordId === rec.id);
    const nurse = rand(['陈素清', '李文静']);
    let anyNeeds = false;
    let allBypassed = true;
    for (const it of items) {
      let ns: '已确认' | '需随访' | '暂不适用';
      if (it.aiStatus === '与要点一致') {
        ns = Math.random() < 0.1 ? '需随访' : '已确认';
      } else if (it.aiStatus === '依据不足') {
        ns = Math.random() < 0.4 ? '需随访' : '已确认';
        allBypassed = false;
      } else if (it.aiStatus === '表达模糊，需再次确认') {
        ns = Math.random() < 0.35 ? '需随访' : '已确认';
        allBypassed = false;
      } else if (it.aiStatus === '未明确提及' || it.aiStatus === '未提及') {
        ns = Math.random() < 0.6 ? '需随访' : '已确认';
        allBypassed = false;
      } else {
        ns = '暂不适用';
      }
      if (ns === '需随访') anyNeeds = true;
      raw
        .prepare(
          'UPDATE care_record_items SET nurse_status = ?, nurse_note = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?',
        )
        .run(ns, ns === '需随访' ? '建议下次随访重点确认' : null, offsetDate(randInt(1, 20)), nurse, it.id);
    }
    const finalStatus = anyNeeds ? (Math.random() < 0.4 ? '已确认' : '需随访') : '已确认';
    raw
      .prepare('UPDATE care_records SET status = ? WHERE id = ?')
      .run(finalStatus, rec.id);
    db.insert(auditLogs)
      .values({
        actor: nurse,
        action: 'REVIEW_RECORD',
        targetType: 'care_record',
        targetId: String(rec.id),
        meta: JSON.stringify({ anyNeeds, allBypassed }),
        createdAt: offsetDate(randInt(1, 20)),
      })
      .run();
  }

  // 审计：导出
  db.insert(auditLogs)
    .values({
      actor: '陈素清',
      action: 'EXPORT_CSV',
      targetType: 'export',
      targetId: 'csv',
      meta: JSON.stringify({ range: '最近 30 天' }),
      createdAt: offsetDate(1),
    })
    .run();

  db.insert(appMeta).values({ key: 'demo_built_at', value: now() }).run();
  db.insert(appMeta).values({ key: 'demo_disclaimer', value: '本系统仅整理自护记录与复核依据，最终判断由造口专科护士完成。' }).run();

  console.log('种子数据写入完成。');
  console.log(`患者：${patientIds.length} 名`);
  console.log(`护士：${nurseIds.length} 名`);
  console.log(`版本：${Object.keys(versionIds).length} 个`);
  console.log(`记录：${allRecords.length} 条`);
}

if (require.main === module) {
  seed();
  process.exit(0);
}
