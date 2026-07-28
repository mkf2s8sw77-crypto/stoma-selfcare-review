import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';
import { ReviewActions } from './ReviewActions';
import { getPatient, getPatientRecords, getActivePoints, getVersion } from '@/lib/server';
import { formatDateTime, relativeTime, cn } from '@/lib/utils';
import { ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPatientDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ record?: string }>;
}) {
  const { id } = await params;
  const { record } = await searchParams;
  const patient = getPatient(Number(id));
  if (!patient) return notFound();
  const records = getPatientRecords(patient.id);
  const points = getActivePoints();
  const focus = record ? records.find((r) => r.id === Number(record)) ?? records[0] : records[0];

  return (
    <AdminShell
      title={patient.name}
      subtitle={`${patient.code} · ${patient.stomaType} · 责任护士：${patient.primaryNurse}`}
      rightSlot={
        <Link href="/admin/patients" className="btn-ghost text-xs">
          <ChevronLeft className="h-3.5 w-3.5" />
          返回列表
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <div className="card p-5">
            <div className="section-title">基本信息</div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-400">性别 / 年龄段</dt>
                <dd className="mt-1 text-brand-600">{patient.gender} · {patient.ageBand}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">手术时间</dt>
                <dd className="mt-1 text-brand-600">{patient.surgeryDate}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-ink-400">主要照护者</dt>
                <dd className="mt-1 text-brand-600">{patient.caregiverRole}</dd>
              </div>
            </dl>
          </div>
          <div className="card p-5">
            <div className="section-title">{points.length} 项要点执行进度</div>
            <p className="mt-1 text-xs text-ink-400">综合最近 5 次记录</p>
            <ul className="mt-3 space-y-2">
              {points.map((p) => {
                // 记录可能来自不同版本：先按记录的 versionId 找到对应版本里同 code 的 pointId
                const recent = records.slice(0, 5).map((r) => {
                  const ver = getVersion(r.versionId);
                  const pid = ver?.points.find((x) => x.code === p.code)?.id;
                  return r.items.find((it) => it.pointId === pid)?.aiStatus;
                }).filter(Boolean) as string[];
                const ok = recent.filter((s) => s === '与要点一致').length;
                const pct = recent.length === 0 ? 0 : Math.round((ok / recent.length) * 100);
                return (
                  <li key={p.id}>
                    <div className="flex items-center justify-between text-xs text-ink-500">
                      <span>{p.title}</span>
                      <span className="text-brand-600">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-brand-50">
                      <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="card p-5">
            <div className="section-title">执行记录时间轴</div>
            <ul className="mt-3 space-y-2">
              {records.slice(0, 8).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/patients/${patient.id}?record=${r.id}`}
                    className={cn(
                      'flex items-center justify-between rounded-xl border border-brand-100 px-3 py-2 text-xs hover:bg-brand-50/40',
                      focus?.id === r.id && 'border-gold-300 bg-gold-50',
                    )}
                  >
                    <span>
                      <span className="text-brand-600">{formatDateTime(r.recordedAt)}</span>
                      <span className="ml-2 text-ink-400">{relativeTime(r.recordedAt)}</span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {focus ? (
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="section-title">AI 比对详情</div>
                  <p className="mt-1 text-xs text-ink-400">记录 {focus.id} · 匹配度均值 {focus.matchAvg}%</p>
                </div>
                <StatusBadge status={focus.status} />
              </div>
              {focus.generalNote && (
                <p className="mt-3 rounded-xl bg-brand-50/40 p-3 text-sm leading-6 text-ink-500">{focus.generalNote}</p>
              )}
              <ul className="mt-4 space-y-3">
                {focus.items.map((it) => (
                  <li key={it.id} className="rounded-2xl border border-brand-100 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-brand-600">{it.pointTitle}</div>
                        <div className="mt-1 text-xs text-ink-400">
                          {it.execution} · AI 匹配 {Math.round(it.aiMatch)}% · {it.aiStatus}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={it.nurseStatus === '未复核' ? it.aiStatus : it.nurseStatus} />
                      </div>
                    </div>
                    {it.rawText && (
                      <p className="mt-2 rounded-xl bg-brand-50/40 p-2.5 text-sm leading-6 text-ink-500">「{it.rawText}」</p>
                    )}
                    <p className="mt-2 text-xs text-ink-400">AI 依据：{it.aiReason} {it.aiEvidence && <span>· 命中「{it.aiEvidence}」</span>}</p>
                    {it.nurseNote && (
                      <div className="mt-2 rounded-xl border border-gold-200 bg-gold-50 p-2.5 text-xs text-gold-600">
                        护士备注：{it.nurseNote} {it.reviewedBy && <span>· {it.reviewedBy}</span>}
                      </div>
                    )}
                    <ReviewActions itemId={it.id} status={it.nurseStatus} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="card p-6 text-center text-sm text-ink-400">该患者暂无自护记录</div>
          )}

          <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4 text-xs leading-6 text-gold-600">
            <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
            AI 仅整理患者原话与要点之间的差异，所有复核动作由造口专科护士完成；不要依据此页面做出并发症或治疗判断。
          </div>
        </div>
      </div>
    </AdminShell>
  );
}