import { MobileShell } from '@/components/MobileShell';
import { MobilePatientSwitcher } from '@/components/MobilePatientSwitcher';
import { getPatients, getCurrentDemoPatient, getActivePoints, getRecentRecords } from '@/lib/server';
import Link from 'next/link';
import { relativeTime } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { Sparkles, ArrowRight, CalendarDays } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MobileHome() {
  const patients = getPatients();
  const patient = (await getCurrentDemoPatient()) ?? patients[0];
  if (!patient) return null;
  const records = getRecentRecords(patient.id, 5);
  const points = getActivePoints();

  return (
    <MobileShell
      title={`你好，${patient.name.replace(/(先生|女士)$/, '')}`}
      subtitle="按要点完成今日居家自护，并查看最近一次复核结论"
      rightSlot={<MobilePatientSwitcher patients={patients.map((p) => ({ id: p.id, name: p.name, code: p.code }))} />}
    >
      <div className="rounded-2xl border border-gold-200 bg-gradient-to-br from-gold-50 to-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gold-600">今日待办</div>
            <div className="mt-1 text-base font-semibold text-brand-600">共 {points.length} 项居家自护要点</div>
          </div>
          <CalendarDays className="h-7 w-7 text-gold-500" />
        </div>
        <Link
          href="/m/check"
          className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-brand-600 shadow-sm transition hover:bg-brand-50"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold-500" />
            开始今日自护打卡
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 card p-4">
        <div className="flex items-center justify-between">
          <div className="section-title">最近一次自护记录</div>
          <Link href="/m/records" className="text-xs text-ink-400 hover:text-brand-600">
            全部记录
          </Link>
        </div>
        {records.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-brand-100 p-4 text-center text-xs text-ink-400">
            还没有自护记录，完成一次打卡后会在这里显示。
          </div>
        ) : (
          <Link
            href={`/m/records/${records[0].id}`}
            className="mt-3 flex items-center justify-between rounded-xl border border-brand-100 bg-white p-3"
          >
            <div>
              <div className="text-sm font-medium text-brand-600">
                {records[0].items.filter((i) => i.aiStatus === '与要点一致').length}/{records[0].items.length} 项与要点一致
              </div>
              <div className="mt-0.5 text-xs text-ink-400">
                {relativeTime(records[0].recordedAt)} · 平均匹配 {records[0].matchAvg}%
              </div>
            </div>
            <StatusBadge status={records[0].status} />
          </Link>
        )}
      </div>

      <div className="mt-4 card p-4">
        <div className="flex items-center justify-between">
          <div className="section-title">今日要点速览</div>
          <Link href="/m/points" className="text-xs text-ink-400 hover:text-brand-600">
            全部要点
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {points.slice(0, 4).map((p) => (
            <li key={p.id} className="flex items-start gap-2 rounded-xl bg-brand-50/40 p-2.5 text-sm leading-6 text-ink-600">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-400" />
              <span className="font-medium text-brand-600">{p.title}</span>
              <span className="text-xs text-ink-400">· {p.content.slice(0, 30)}…</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 card p-4">
        <div className="section-title">温馨提示</div>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          本工具仅整理自护记录与 AI 比对证据，最终判断由造口专科护士完成。如出现高热、剧烈腹痛、造口颜色发黑、大量渗血或呼吸困难等情况，请立即前往就近医院急诊。
        </p>
      </div>
    </MobileShell>
  );
}
