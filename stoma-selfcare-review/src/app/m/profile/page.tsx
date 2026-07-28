import { MobileShell } from '@/components/MobileShell';
import { getPatients, getActivePoints, getVersion } from '@/lib/server';
import { UserRound, Stethoscope, CalendarDays, History } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MobileProfile() {
  const patients = getPatients();
  const p = patients[0];
  const points = getActivePoints();
  const active = points.length > 0 ? getVersion(points[0].versionId) : null;

  return (
    <MobileShell title="我的" subtitle="脱敏档案与当前激活要点版本">
      <div className="card flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <UserRound className="h-6 w-6" />
        </div>
        <div>
          <div className="text-base font-semibold text-brand-600">{p.name}</div>
          <div className="mt-0.5 text-xs text-ink-400">编号 {p.code} · 业务化脱敏</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-brand-100 bg-white p-4">
          <div className="text-xs text-ink-400">性别 / 年龄段</div>
          <div className="mt-1 text-sm font-medium text-brand-600">{p.gender} · {p.ageBand}</div>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-4">
          <div className="text-xs text-ink-400">造口类型</div>
          <div className="mt-1 text-sm font-medium text-brand-600">{p.stomaType}</div>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-4">
          <div className="text-xs text-ink-400">手术时间</div>
          <div className="mt-1 text-sm font-medium text-brand-600">{p.surgeryDate}</div>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-4">
          <div className="text-xs text-ink-400">建档状态</div>
          <div className="mt-1 text-sm font-medium text-brand-600">{p.status}</div>
        </div>
      </div>

      <div className="mt-3 card p-4">
        <div className="flex items-center gap-2 text-brand-600">
          <Stethoscope className="h-4 w-4" />
          <span className="section-title">主要照护者 / 主治团队</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-500">{p.caregiverRole}</p>
        <p className="mt-1 text-sm leading-6 text-ink-500">造口专科责任护士：{p.primaryNurse}</p>
      </div>

      <div className="mt-3 card p-4">
        <div className="flex items-center gap-2 text-brand-600">
          <CalendarDays className="h-4 w-4" />
          <span className="section-title">当前激活要点版本</span>
        </div>
        <p className="mt-2 text-base font-semibold text-brand-600">{active?.version.title ?? '尚未发布'}</p>
        <p className="mt-1 text-xs leading-5 text-ink-400">{active?.version.summary}</p>
        <p className="mt-2 text-xs text-ink-400">共 {points.length} 项要点</p>
      </div>

      <div className="mt-3 rounded-2xl border border-gold-200 bg-gold-50 p-3 text-xs leading-5 text-gold-600">
        <History className="mr-1 inline h-3.5 w-3.5" />
        系统所有数据均为脱敏示例，不与任何外部系统对接，正式启用前将以医院正式造口护理规范为准。
      </div>
    </MobileShell>
  );
}
