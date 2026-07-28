import { NextResponse } from 'next/server';
import { buildExportRows } from '@/lib/server';
import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import path from 'node:path';
import fs from 'node:fs';
export const dynamic = 'force-dynamic';

function csvEscape(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawRange = Number(url.searchParams.get('range') ?? 30);
  const range = Number.isFinite(rawRange) && rawRange > 0 && rawRange <= 365 ? Math.floor(rawRange) : 30;
  const rows = buildExportRows(range);
  const header = [
    '记录编号', '患者编号', '患者姓名', '记录时间', '记录人', '记录状态',
    '要点编号', '要点标题', '执行情况', 'AI 状态', 'AI 匹配度', 'AI 证据',
    '护士复核状态', '复核人',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.record_id, r.patient_code, r.patient_name, r.recorded_at, r.recorded_by,
        r.status, r.point_code, r.point_title, r.execution, r.ai_status,
        r.ai_match, r.ai_evidence, r.nurse_status, r.reviewed_by ?? '',
      ].map(csvEscape).join(','),
    );
  }
  const csv = '\uFEFF' + lines.join('\n');
  const dir = path.join(process.cwd(), 'data', 'exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `stoma-selfcare-export-${range}d-${Date.now()}.csv`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, csv, 'utf-8');
  db.insert(auditLogs).values({
    actor: '陈素清', action: 'EXPORT_CSV', targetType: 'export', targetId: filename,
    meta: JSON.stringify({ rows: rows.length, range }),
    createdAt: new Date().toISOString(),
  }).run();
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}
