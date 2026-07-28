import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MobileShell } from '@/components/MobileShell';
import { StatusBadge } from '@/components/StatusBadge';
import { getRecord, getPatients } from '@/lib/server';
import { formatDateTime, cn } from '@/lib/utils';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MobileRecordDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getRecord(Number(id));
  if (!record) return notFound();
  const patients = getPatients();
  const patient = patients.find((p) => p.id === record.patientId);

  return (
    <MobileShell
      title="记录详情"
      subtitle={`${patient?.name ?? ''} · ${formatDateTime(record.recordedAt)}`}
      rightSlot={<Link href="/m/records" className="btn-ghost text-xs">返回</Link>}
    >
      <div className="rounded-2xl border border-brand-100 bg-white p-4">
        <div className="flex items-center justify-between text-xs text-ink-400">
          <span>使用版本 {record.versionLabel}</span>
          <span>匹配度均值 {record.matchAvg}%</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-medium text-brand-600">整体状态</div>
          <StatusBadge status={record.status} />
        </div>
        {record.generalNote && (
          <p className="mt-2 text-sm leading-6 text-ink-500">{record.generalNote}</p>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {record.items.map((it) => (
          <li key={it.id} className="rounded-2xl border border-brand-100 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-brand-600">{it.pointTitle}</div>
                <div className="mt-1 text-xs text-ink-400">
                  {it.execution} · AI 匹配 {Math.round(it.aiMatch)}%
                </div>
              </div>
              <StatusBadge status={it.nurseStatus === '未复核' ? it.aiStatus : it.nurseStatus} />
            </div>
            {it.rawText && (
              <p className="mt-2 rounded-xl bg-brand-50/40 p-2.5 text-sm leading-6 text-ink-500">
                「{it.rawText}」
              </p>
            )}
            {it.aiEvidence && (
              <div className="mt-2 text-xs text-ink-400">
                依据关键词：<span className="text-brand-600">{it.aiEvidence}</span>
              </div>
            )}
            {it.nurseNote && (
              <div className="mt-2 rounded-xl border border-gold-200 bg-gold-50 p-2.5 text-xs text-gold-600">
                护士备注：{it.nurseNote} {it.reviewedBy && <span>· {it.reviewedBy} {it.reviewedAt?.slice(0, 10)}</span>}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 rounded-2xl border border-gold-200 bg-gold-50 p-3 text-xs leading-5 text-gold-600">
        <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
        本页面所有比对结果仅供参考，最终判断由造口专科护士完成。
      </div>
    </MobileShell>
  );
}