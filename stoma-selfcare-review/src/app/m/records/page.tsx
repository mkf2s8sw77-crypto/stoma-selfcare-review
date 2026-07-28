import Link from 'next/link';
import { MobileShell } from '@/components/MobileShell';
import { MobilePatientSwitcher } from '@/components/MobilePatientSwitcher';
import { StatusBadge } from '@/components/StatusBadge';
import { getPatients, getCurrentDemoPatient, getPatientRecords } from '@/lib/server';
import { formatDateTime, relativeTime } from '@/lib/utils';
import { ChevronRight, Filter } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MobileRecordsPage() {
  const patients = getPatients();
  const patient = (await getCurrentDemoPatient()) ?? patients[0];
  if (!patient) return null;
  const records = getPatientRecords(patient.id);

  const ok = records.filter((r) => r.status === '已确认').length;
  const need = records.filter((r) => r.status === '需随访').length;
  const pending = records.filter((r) => r.status === '待复核').length;

  return (
    <MobileShell
      title="执行记录"
      subtitle={`已收集 ${records.length} 次自护记录`}
      rightSlot={<MobilePatientSwitcher patients={patients.map((p) => ({ id: p.id, name: p.name, code: p.code }))} />}
    >
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-3 text-center">
          <div className="text-xs text-ink-400">已确认</div>
          <div className="mt-1 text-lg font-semibold text-ok-500">{ok}</div>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-3 text-center">
          <div className="text-xs text-ink-400">需随访</div>
          <div className="mt-1 text-lg font-semibold text-warn-500">{need}</div>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-3 text-center">
          <div className="text-xs text-ink-400">待复核</div>
          <div className="mt-1 text-lg font-semibold text-gold-600">{pending}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="section-title">全部记录</div>
        <div className="flex items-center gap-1 text-xs text-ink-400">
          <Filter className="h-3.5 w-3.5" />
          按时间倒序
        </div>
      </div>

      <ul className="mt-2 space-y-2">
        {records.length === 0 && (
          <li className="rounded-2xl border border-dashed border-brand-100 p-6 text-center text-sm text-ink-400">
            还没有自护记录
          </li>
        )}
        {records.map((r) => {
          const okCount = r.items.filter((i) => i.aiStatus === '与要点一致').length;
          return (
            <li key={r.id}>
              <Link
                href={`/m/records/${r.id}`}
                className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white p-3.5"
              >
                <div>
                  <div className="text-sm font-medium text-brand-600">
                    {okCount}/{r.items.length} 项与要点一致
                  </div>
                  <div className="mt-1 text-xs text-ink-400">
                    {formatDateTime(r.recordedAt)} · {relativeTime(r.recordedAt)} · 匹配 {r.matchAvg}%
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <ChevronRight className="h-4 w-4 text-ink-400" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </MobileShell>
  );
}
