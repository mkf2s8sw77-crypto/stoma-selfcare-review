import { db, raw } from '@/db';
import {
  patients,
  carePointVersions,
  carePoints,
  careRecords,
  careRecordItems,
  nurseAccounts,
  auditLogs,
  appMeta,
} from '@/db/schema';
import { CARE_POINT_MAP_BY_VERSION } from '@/db/seed-points';
import { reviewPoint, type ReviewInput, type ReviewOutput } from '@/lib/review';
import { POINT_VERSIONS } from '@/lib/points';
import { z } from 'zod';
import type { CarePointDef } from '@/lib/points';
import { seed } from '@/db/seed';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/** 演示身份 Cookie 名（患者端切换器写入，服务端页面读取） */
export const DEMO_PATIENT_COOKIE = 'demo_patient_id';
export const DEMO_NURSE_COOKIE = 'demo_nurse';

/**
 * 读取当前演示患者身份：
 * 患者端切换器把所选患者写入 Cookie + localStorage，服务端页面据此取数；
 * Cookie 缺失或指向已不存在的患者（如刚恢复演示数据）时，回落到首位患者。
 */
export async function getCurrentDemoPatient(): Promise<PatientView | null> {
  const list = getPatients();
  if (list.length === 0) return null;
  const store = await cookies();
  const id = Number(store.get(DEMO_PATIENT_COOKIE)?.value ?? 0);
  return list.find((p) => p.id === id) ?? list[0];
}

/** 读取当前演示护士身份（用于审计 actor），无效时回落陈素清 */
export async function getCurrentDemoNurse(): Promise<string> {
  const store = await cookies();
  const value = (store.get(DEMO_NURSE_COOKIE)?.value ?? '').trim();
  if (!value) return '陈素清';
  const nurses = getNurses();
  return nurses.some((n) => n.displayName === value) ? value : '陈素清';
}

export interface RecordItemView {
  id: number;
  pointId: number;
  pointCode: string;
  pointTitle: string;
  execution: string;
  rawText: string;
  aiStatus: string;
  aiMatch: number;
  aiEvidence: string;
  aiReason: string;
  nurseStatus: string;
  nurseNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface RecordView {
  id: number;
  patientId: number;
  versionId: number;
  versionLabel: string;
  recordedAt: string;
  recordedBy: string;
  generalNote: string | null;
  status: string;
  createdAt: string;
  items: RecordItemView[];
  matchAvg: number;
}

export interface PatientView {
  id: number;
  code: string;
  name: string;
  gender: string;
  ageBand: string;
  stomaType: string;
  surgeryDate: string;
  caregiverRole: string;
  primaryNurse: string;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface CarePointView {
  id: number;
  versionId: number;
  version: string;
  code: string;
  orderIdx: number;
  title: string;
  content: string;
  mustFlag: boolean;
  keywords: string[];
  evidenceHints: string[];
}

export interface VersionView {
  id: number;
  version: string;
  title: string;
  summary: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  activatedAt: string | null;
  pointCount: number;
}

function safeJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function ensureActiveVersionId(): number {
  const v = db.select().from(carePointVersions).all().find((x) => x.isActive);
  if (!v) throw new Error('未找到激活版本');
  return v.id;
}

export function getLandingSummary() {
  const ps = db.select().from(patients).all();
  const recs = db.select().from(careRecords).all();
  const items = db.select().from(careRecordItems).all();
  const versions = db.select().from(carePointVersions).all();
  const activeRow = versions.find((v) => v.isActive);
  return {
    counts: {
      patients: ps.length,
      activeVersion: activeRow?.version ?? '-',
      pendingRecords: recs.filter((r) => r.status === '待复核').length,
      followUpRecords: recs.filter((r) => r.status === '需随访').length,
      confirmedRecords: recs.filter((r) => r.status === '已确认').length,
      totalItems: items.length,
    },
    activeVersion: activeRow,
    disclaimer:
      db.select().from(appMeta).all().find((m) => m.key === 'demo_disclaimer')?.value ??
      '本系统仅整理自护记录与复核依据，最终判断由造口专科护士完成。',
  };
}

export function getPatients(): PatientView[] {
  return db.select().from(patients).all().map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    gender: p.gender,
    ageBand: p.ageBand,
    stomaType: p.stomaType,
    surgeryDate: p.surgeryDate,
    caregiverRole: p.caregiverRole,
    primaryNurse: p.primaryNurse,
    status: p.status,
    note: p.note,
    createdAt: p.createdAt,
  }));
}

export function getPatient(id: number): PatientView | null {
  const p = db.select().from(patients).all().find((x) => x.id === id);
  if (!p) return null;
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    gender: p.gender,
    ageBand: p.ageBand,
    stomaType: p.stomaType,
    surgeryDate: p.surgeryDate,
    caregiverRole: p.caregiverRole,
    primaryNurse: p.primaryNurse,
    status: p.status,
    note: p.note,
    createdAt: p.createdAt,
  };
}

export function getVersions(): VersionView[] {
  const versions = db.select().from(carePointVersions).all();
  const points = db.select().from(carePoints).all();
  return versions
    .sort((a, b) => b.version.localeCompare(a.version))
    .map((v) => ({
      id: v.id,
      version: v.version,
      title: v.title,
      summary: v.summary,
      isActive: !!v.isActive,
      createdBy: v.createdBy,
      createdAt: v.createdAt,
      activatedAt: v.activatedAt,
      pointCount: points.filter((p) => p.versionId === v.id).length,
    }));
}

export function getVersion(id: number): {
  version: VersionView;
  points: CarePointView[];
} | null {
  const v = db.select().from(carePointVersions).all().find((x) => x.id === id);
  if (!v) return null;
  const points = db
    .select()
    .from(carePoints)
    .all()
    .filter((p) => p.versionId === v.id)
    .sort((a, b) => a.orderIdx - b.orderIdx)
    .map(
      (p): CarePointView => ({
        id: p.id,
        versionId: p.versionId,
        version: v.version,
        code: p.code,
        orderIdx: p.orderIdx,
        title: p.title,
        content: p.content,
        mustFlag: !!p.mustFlag,
        keywords: safeJson<string[]>(p.keywords, []),
        evidenceHints: safeJson<string[]>(p.evidenceHints, []),
      }),
    );
  return {
    version: {
      id: v.id,
      version: v.version,
      title: v.title,
      summary: v.summary,
      isActive: !!v.isActive,
      createdBy: v.createdBy,
      createdAt: v.createdAt,
      activatedAt: v.activatedAt,
      pointCount: points.length,
    },
    points,
  };
}

export function getActivePoints(): CarePointView[] {
  const v = db.select().from(carePointVersions).all().find((x) => x.isActive);
  if (!v) return [];
  return getVersion(v.id)!.points;
}

function pointDefFromRow(p: any): CarePointDef {
  return {
    code: p.code,
    orderIdx: p.orderIdx,
    title: p.title,
    content: p.content,
    mustFlag: !!p.mustFlag,
    keywords: safeJson<string[]>(p.keywords, []),
    evidenceHints: safeJson<string[]>(p.evidenceHints, []),
  };
}

function reviewForRecord(recordId: number) {
  const rec = db.select().from(careRecords).all().find((r) => r.id === recordId);
  if (!rec) return;
  const points = db
    .select()
    .from(carePoints)
    .all()
    .filter((p) => p.versionId === rec.versionId)
    .sort((a, b) => a.orderIdx - b.orderIdx);
  const items = db.select().from(careRecordItems).all().filter((it) => it.recordId === recordId);
  for (let i = 0; i < items.length; i++) {
    const point = points[i];
    if (!point) continue;
    const review = reviewPoint({
      point: pointDefFromRow(point),
      execution: items[i].execution as any,
      rawText: items[i].rawText,
    });
    raw
      .prepare(
        'UPDATE care_record_items SET ai_status=?, ai_match=?, ai_evidence=?, ai_reason=? WHERE id=?',
      )
      .run(review.aiStatus, review.aiMatch, review.aiEvidence, review.aiReason, items[i].id);
  }
}

export function getRecord(id: number): RecordView | null {
  const rec = db.select().from(careRecords).all().find((r) => r.id === id);
  if (!rec) return null;
  const version = db.select().from(carePointVersions).all().find((v) => v.id === rec.versionId);
  const points = db
    .select()
    .from(carePoints)
    .all()
    .filter((p) => p.versionId === rec.versionId)
    .sort((a, b) => a.orderIdx - b.orderIdx);
  const items = db
    .select()
    .from(careRecordItems)
    .all()
    .filter((it) => it.recordId === id)
    .sort((a, b) => a.id - b.id);

  const sorted = items
    .map((it, idx) => {
      const p = points[idx];
      return {
        id: it.id,
        pointId: p?.id ?? 0,
        pointCode: p?.code ?? '',
        pointTitle: p?.title ?? '',
        execution: it.execution,
        rawText: it.rawText,
        aiStatus: it.aiStatus,
        aiMatch: it.aiMatch,
        aiEvidence: it.aiEvidence,
        aiReason: it.aiReason,
        nurseStatus: it.nurseStatus,
        nurseNote: it.nurseNote,
        reviewedAt: it.reviewedAt,
        reviewedBy: it.reviewedBy,
      };
    });

  const matchAvg =
    items.length > 0
      ? Math.round(items.reduce((s, x) => s + (x.aiMatch ?? 0), 0) / items.length)
      : 0;
  return {
    id: rec.id,
    patientId: rec.patientId,
    versionId: rec.versionId,
    versionLabel: version?.version ?? '-',
    recordedAt: rec.recordedAt,
    recordedBy: rec.recordedBy,
    generalNote: rec.generalNote,
    status: rec.status,
    createdAt: rec.createdAt,
    items: sorted,
    matchAvg,
  };
}

export function getPatientRecords(patientId: number): RecordView[] {
  return db
    .select()
    .from(careRecords)
    .all()
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .map((r) => getRecord(r.id)!)
    .filter(Boolean);
}

export function getRecentRecords(patientId: number, limit = 8): RecordView[] {
  return getPatientRecords(patientId).slice(0, limit);
}

export function getReviewQueue(filter?: string): RecordView[] {
  let list = db.select().from(careRecords).all();
  if (filter && filter !== '全部') {
    list = list.filter((r) => r.status === filter);
  }
  return list
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .map((r) => getRecord(r.id)!)
    .filter(Boolean);
}

export function getNurses() {
  return db
    .select()
    .from(nurseAccounts)
    .all()
    .map((n) => ({ username: n.username, displayName: n.displayName, role: n.role }));
}

export function getAuditLogs(limit = 20) {
  return db
    .select()
    .from(auditLogs)
    .all()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getAnalytics(rangeDays: number) {
  const since = new Date();
  since.setDate(since.getDate() - rangeDays);
  const records = db.select().from(careRecords).all();
  const items = db.select().from(careRecordItems).all();
  const recent = records.filter((r) => new Date(r.recordedAt) >= since);

  const matchTrend: { date: string; avg: number; count: number }[] = [];
  for (let i = rangeDays - 1; i >= 0; i -= Math.max(1, Math.floor(rangeDays / 12))) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayRecs = records.filter((r) => r.recordedAt.startsWith(day));
    if (dayRecs.length === 0) continue;
    let sum = 0;
    let n = 0;
    for (const rec of dayRecs) {
      const recItems = items.filter((x) => x.recordId === rec.id);
      if (recItems.length === 0) continue;
      const avg =
        recItems.reduce((s, x) => s + (x.aiMatch ?? 0), 0) / recItems.length;
      sum += avg;
      n++;
    }
    if (n > 0) {
      matchTrend.push({ date: day, avg: Math.round(sum / n), count: n });
    }
  }

  // 状态分布
  const statusDist = {
    已确认: 0,
    需随访: 0,
    待复核: 0,
    暂不适用: 0,
  } as Record<string, number>;
  for (const r of records) {
    if (statusDist[r.status] !== undefined) statusDist[r.status]++;
  }

  // 重点患者排行（需随访最多）
  const patientCount: Record<number, number> = {};
  for (const r of records) {
    if (r.status === '需随访') {
      patientCount[r.patientId] = (patientCount[r.patientId] ?? 0) + 1;
    }
  }
  const focusPatients = Object.entries(patientCount)
    .map(([pid, n]) => {
      const p = db.select().from(patients).all().find((x) => x.id === Number(pid));
      return p ? { patient: p, count: n } : null;
    })
    .filter((x): x is { patient: any; count: number } => !!x)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 整体平均
  const overallAvg =
    items.length === 0
      ? 0
      : Math.round(items.reduce((s, x) => s + (x.aiMatch ?? 0), 0) / items.length);

  return {
    rangeDays,
    matchTrend,
    statusDist,
    focusPatients,
    overallAvg,
    pendingCount: records.filter((r) => r.status === '待复核').length,
    followUpCount: records.filter((r) => r.status === '需随访').length,
    weekNew: records.filter((r) => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return new Date(r.recordedAt) >= d;
    }).length,
  };
}

const reviewItemSchema = z.object({
  pointId: z.number().int().nonnegative(),
  execution: z.enum(['已按要点执行', '部分执行', '暂未执行', '不适用']),
  rawText: z.string().max(2000),
});

const submitRecordSchema = z.object({
  patientId: z.number().int().positive(),
  recordedBy: z.string().min(1).max(40),
  generalNote: z.string().max(2000).optional(),
  items: z.array(reviewItemSchema).min(1),
  recordedAt: z.string().optional(),
});

export interface SubmitResult {
  recordId: number;
  matchAvg: number;
  results: { pointId: number; aiStatus: string; aiMatch: number; aiEvidence: string; aiReason: string }[];
}

export function submitRecord(input: z.infer<typeof submitRecordSchema>): SubmitResult {
  const parsed = submitRecordSchema.parse(input);
  const versionId = ensureActiveVersionId();
  const points = db
    .select()
    .from(carePoints)
    .all()
    .filter((p) => p.versionId === versionId)
    .sort((a, b) => a.orderIdx - b.orderIdx);
  const recordedAt = parsed.recordedAt ?? new Date().toISOString();
  const recRes = db
    .insert(careRecords)
    .values({
      patientId: parsed.patientId,
      versionId,
      recordedAt,
      recordedBy: parsed.recordedBy,
      generalNote: parsed.generalNote ?? null,
      status: '待复核',
      createdAt: new Date().toISOString(),
    })
    .run();
  const recordId = Number(recRes.lastInsertRowid);
  const results: SubmitResult['results'] = [];
  let sum = 0;
  for (const it of parsed.items) {
    const point = points.find((p) => p.id === it.pointId) ?? points.shift();
    if (!point) continue;
    const review = reviewPoint({
      point: pointDefFromRow(point),
      execution: it.execution as any,
      rawText: it.rawText,
    });
    db.insert(careRecordItems)
      .values({
        recordId,
        pointId: point.id,
        execution: it.execution,
        rawText: it.rawText,
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
    results.push({
      pointId: point.id,
      aiStatus: review.aiStatus,
      aiMatch: review.aiMatch,
      aiEvidence: review.aiEvidence,
      aiReason: review.aiReason,
    });
    sum += review.aiMatch;
  }
  const matchAvg = results.length > 0 ? Math.round(sum / results.length) : 0;
  db.insert(auditLogs)
    .values({
      actor: parsed.recordedBy,
      action: 'SUBMIT_RECORD',
      targetType: 'care_record',
      targetId: String(recordId),
      meta: JSON.stringify({ matchAvg }),
      createdAt: new Date().toISOString(),
    })
    .run();
  revalidatePath('/m');
  revalidatePath('/admin');
  return { recordId, matchAvg, results };
}

const nurseReviewSchema = z.object({
  itemId: z.number().int().positive(),
  status: z.enum(['已确认', '需随访', '暂不适用', '未复核']),
  note: z.string().max(2000).optional(),
  reviewer: z.string().min(1).max(40),
});

export function reviewItem(input: z.infer<typeof nurseReviewSchema>) {
  const parsed = nurseReviewSchema.parse(input);
  const item = db.select().from(careRecordItems).all().find((i) => i.id === parsed.itemId);
  if (!item) throw new Error('记录项不存在');
  raw
    .prepare(
      'UPDATE care_record_items SET nurse_status=?, nurse_note=?, reviewed_at=?, reviewed_by=? WHERE id=?',
    )
    .run(
      parsed.status,
      parsed.note ?? null,
      new Date().toISOString(),
      parsed.reviewer,
      item.id,
    );
  // 重新计算记录状态：从数据库重新读取，避免 in-memory siblings 仍是旧值
  const fresh = db.select().from(careRecordItems).all().filter((x) => x.recordId === item.recordId);
  let anyFollow = false;
  let allReviewed = true;
  for (const x of fresh) {
    if (x.nurseStatus === '需随访') anyFollow = true;
    if (x.nurseStatus === '未复核') allReviewed = false;
  }
  const newStatus = !allReviewed
    ? '待复核'
    : anyFollow
      ? '需随访'
      : '已确认';
  raw.prepare('UPDATE care_records SET status=? WHERE id=?').run(newStatus, item.recordId);
  db.insert(auditLogs)
    .values({
      actor: parsed.reviewer,
      action: 'REVIEW_ITEM',
      targetType: 'care_record_item',
      targetId: String(item.id),
      meta: JSON.stringify({ status: parsed.status }),
      createdAt: new Date().toISOString(),
    })
    .run();
  revalidatePath('/admin');
  return { ok: true, recordStatus: newStatus };
}

export function recomputeRecord(recordId: number, reviewer = '陈素清') {
  const rec = db.select().from(careRecords).all().find((r) => r.id === recordId);
  if (!rec) return false;
  reviewForRecord(recordId);
  db.insert(auditLogs)
    .values({
      actor: reviewer,
      action: 'RECOMPUTE_RECORD',
      targetType: 'care_record',
      targetId: String(recordId),
      meta: null,
      createdAt: new Date().toISOString(),
    })
    .run();
  revalidatePath('/admin');
  revalidatePath('/m');
  return true;
}

const createVersionSchema = z.object({
  version: z.string().min(1).max(40),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  fromVersion: z.string().min(1).optional(),
  creator: z.string().min(1).max(40),
});

export function createVersion(input: z.infer<typeof createVersionSchema>) {
  const parsed = createVersionSchema.parse(input);
  const exists = db
    .select()
    .from(carePointVersions)
    .all()
    .find((v) => v.version === parsed.version);
  if (exists) throw new Error('版本号已存在');
  const res = db
    .insert(carePointVersions)
    .values({
      version: parsed.version,
      title: parsed.title,
      summary: parsed.summary,
      isActive: false,
      createdBy: parsed.creator,
      createdAt: new Date().toISOString(),
      activatedAt: null,
    })
    .run();
  const versionId = Number(res.lastInsertRowid);
  const sourceVersion = parsed.fromVersion
    ? POINT_VERSIONS.find((v) => v.version === parsed.fromVersion)
    : POINT_VERSIONS.find((v) => v.isActive);
  const points = sourceVersion
    ? CARE_POINT_MAP_BY_VERSION[sourceVersion.version]
    : CARE_POINT_MAP_BY_VERSION['v2.0'];
  for (const p of points) {
    db.insert(carePoints)
      .values({
        versionId,
        code: p.code,
        orderIdx: p.orderIdx,
        title: p.title,
        content: p.content,
        mustFlag: p.mustFlag,
        keywords: JSON.stringify(p.keywords),
        evidenceHints: JSON.stringify(p.evidenceHints),
        createdAt: new Date().toISOString(),
      })
      .run();
  }
  db.insert(auditLogs)
    .values({
      actor: parsed.creator,
      action: 'CREATE_VERSION',
      targetType: 'care_point_version',
      targetId: parsed.version,
      meta: JSON.stringify({ from: sourceVersion?.version ?? null }),
      createdAt: new Date().toISOString(),
    })
    .run();
  revalidatePath('/admin/points');
  return { versionId, version: parsed.version };
}

export function activateVersion(id: number, actor: string) {
  const v = db.select().from(carePointVersions).all().find((x) => x.id === id);
  if (!v) throw new Error('版本不存在');
  for (const other of db.select().from(carePointVersions).all()) {
    raw.prepare('UPDATE care_point_versions SET is_active=? WHERE id=?').run(other.id === id ? 1 : 0, other.id);
  }
  raw.prepare('UPDATE care_point_versions SET activated_at=? WHERE id=?').run(new Date().toISOString(), id);
  db.insert(auditLogs)
    .values({
      actor,
      action: 'ACTIVATE_VERSION',
      targetType: 'care_point_version',
      targetId: v.version,
      meta: null,
      createdAt: new Date().toISOString(),
    })
    .run();
  revalidatePath('/admin/points');
  revalidatePath('/');
  revalidatePath('/m');
}

export function resetDemoData() {
  seed();
  revalidatePath('/');
  revalidatePath('/m');
  revalidatePath('/admin');
}

export interface CsvRow {
  record_id: string;
  patient_code: string;
  patient_name: string;
  recorded_at: string;
  recorded_by: string;
  status: string;
  point_code: string;
  point_title: string;
  execution: string;
  ai_status: string;
  ai_match: number;
  ai_evidence: string;
  nurse_status: string;
  reviewed_by: string | null;
}

export function buildExportRows(rangeDays: number): CsvRow[] {
  const since = new Date();
  since.setDate(since.getDate() - rangeDays);
  const recs = db
    .select()
    .from(careRecords)
    .all()
    .filter((r) => new Date(r.recordedAt) >= since);
  const patientsById = Object.fromEntries(
    db.select().from(patients).all().map((p) => [p.id, p]),
  );
  const pointsById = Object.fromEntries(db.select().from(carePoints).all().map((p) => [p.id, p]));
  const rows: CsvRow[] = [];
  for (const r of recs) {
    const items = db
      .select()
      .from(careRecordItems)
      .all()
      .filter((it) => it.recordId === r.id)
      .sort((a, b) => a.id - b.id);
    for (const it of items) {
      const p = patientsById[r.patientId];
      const point = pointsById[it.pointId];
      rows.push({
        record_id: `R${r.id}`,
        patient_code: p?.code ?? '',
        patient_name: p ? p.name.replace(/(先生|女士)$/, '') : '',
        recorded_at: r.recordedAt,
        recorded_by: r.recordedBy,
        status: r.status,
        point_code: point?.code ?? '',
        point_title: point?.title ?? '',
        execution: it.execution,
        ai_status: it.aiStatus,
        ai_match: it.aiMatch,
        ai_evidence: it.aiEvidence,
        nurse_status: it.nurseStatus,
        reviewed_by: it.reviewedBy,
      });
    }
  }
  return rows;
}
