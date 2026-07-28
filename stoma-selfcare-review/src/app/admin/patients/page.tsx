import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';
import { getPatients, getReviewQueue } from '@/lib/server';
import { db } from '@/db';
import { careRecordItems, careRecords } from '@/db/schema';
import { formatDateTime, relativeTime } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminPatients() {
  const patients = getPatients();
  const queue = getReviewQueue();
  const records = db.select().from(careRecords).all();
  return (
    <AdminShell title="患者档案" subtitle={`共 ${patients.length} 名在册患者，含 1 名暂停随访`}>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/60 text-xs text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left">编号</th>
              <th className="px-4 py-3 text-left">姓名</th>
              <th className="px-4 py-3 text-left">年龄段</th>
              <th className="px-4 py-3 text-left">造口类型</th>
              <th className="px-4 py-3 text-left">责任护士</th>
              <th className="px-4 py-3 text-left">最近记录</th>
              <th className="px-4 py-3 text-left">AI 结论</th>
              <th className="px-4 py-3 text-left">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {patients.map((p) => {
              const recs = records.filter((r) => r.patientId === p.id);
              recs.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
              const last = recs[0];
              return (
                <tr key={p.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 text-xs text-ink-400">{p.code}</td>
                  <td className="px-4 py-3 font-medium text-brand-600">{p.name}</td>
                  <td className="px-4 py-3 text-ink-500">{p.gender} · {p.ageBand}</td>
                  <td className="px-4 py-3 text-ink-500">{p.stomaType}</td>
                  <td className="px-4 py-3 text-ink-500">{p.primaryNurse}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {last ? `${formatDateTime(last.recordedAt)} · ${relativeTime(last.recordedAt)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {last ? <StatusBadge status={last.status} /> : <span className="text-xs text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.status === '在册' ? 'badge' : 'badge-muted'}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/patients/${p.id}`} className="btn-ghost text-xs">
                      详情 <ChevronRight className="h-3.5 w-3.5" />
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
