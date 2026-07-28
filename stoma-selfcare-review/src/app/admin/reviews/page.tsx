import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';
import { getReviewQueue, getPatients } from '@/lib/server';
import { formatDateTime, relativeTime } from '@/lib/utils';
import { ChevronRight, Filter } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUSES = ['全部', '待复核', '需随访', '已确认', '暂不适用'];

export default async function AdminReviews({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const current = status && STATUSES.includes(status) ? status : '全部';
  const list = getReviewQueue(current);
  const patients = getPatients();

  return (
    <AdminShell
      title="复核队列"
      subtitle="按状态筛选全部自护记录"
      rightSlot={
        <div className="flex items-center gap-1 text-xs">
          <Filter className="h-3.5 w-3.5 text-ink-400" />
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/reviews?status=${encodeURIComponent(s)}`}
              className={
                s === current
                  ? 'rounded-full bg-brand-500 px-3 py-1 text-white'
                  : 'rounded-full border border-brand-100 px-3 py-1 text-ink-500 hover:border-brand-200'
              }
            >
              {s}
            </Link>
          ))}
        </div>
      }
    >
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-xs text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left">记录</th>
              <th className="px-4 py-3 text-left">患者</th>
              <th className="px-4 py-3 text-left">记录时间</th>
              <th className="px-4 py-3 text-left">匹配度</th>
              <th className="px-4 py-3 text-left">需再次确认</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-ink-400">
                  当前状态下暂无记录
                </td>
              </tr>
            )}
            {list.map((r) => {
              const p = patients.find((x) => x.id === r.patientId);
              const need = r.items.filter((i) => i.nurseStatus === '需随访' || (i.nurseStatus === '未复核' && (i.aiStatus === '未提及' || i.aiStatus === '未明确提及' || i.aiStatus === '表达模糊，需再次确认'))).length;
              return (
                <tr key={r.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 text-xs text-ink-400">R{r.id}</td>
                  <td className="px-4 py-3 text-brand-600">{p?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDateTime(r.recordedAt)} · {relativeTime(r.recordedAt)}</td>
                  <td className="px-4 py-3 text-brand-600">{r.matchAvg}%</td>
                  <td className="px-4 py-3 text-ink-500">{need} / {r.items.length}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/patients/${r.patientId}?record=${r.id}`} className="btn-ghost text-xs">
                      去复核 <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
