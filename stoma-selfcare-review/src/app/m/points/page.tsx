import { MobileShell } from '@/components/MobileShell';
import { MobilePatientSwitcher } from '@/components/MobilePatientSwitcher';
import { getActivePoints, getVersions, getPatients } from '@/lib/server';
import { BookOpenCheck, Star, Archive } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MobilePointsPage() {
  const patients = getPatients();
  const versions = getVersions();
  const active = versions.find((v) => v.isActive);
  const points = getActivePoints();

  return (
    <MobileShell
      title="居家自护要点"
      subtitle={`当前激活版本：${active?.title ?? '尚未发布'}`}
      rightSlot={<MobilePatientSwitcher patients={patients.map((p) => ({ id: p.id, name: p.name, code: p.code }))} />}
    >
      <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4 text-xs leading-5 text-gold-600">
        演示版要点，仅供先导试用参考；正式启用前需由山西白求恩医院造口专科护士团队审核。
      </div>

      <ul className="mt-3 space-y-2">
        {points.map((p) => (
          <li key={p.id} className="rounded-2xl border border-brand-100 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-brand-600">{p.title}</div>
                <div className="mt-1 text-xs text-ink-400">{p.code} · {p.mustFlag ? '必做' : '建议'}</div>
              </div>
              {p.mustFlag ? <Star className="h-4 w-4 text-gold-500" /> : <BookOpenCheck className="h-4 w-4 text-ink-400" />}
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-500">{p.content}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 section-title">历史版本</div>
      <ul className="mt-2 space-y-2">
        {versions.filter((v) => !v.isActive).map((v) => (
          <li key={v.id} className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white px-3 py-2.5">
            <div>
              <div className="text-sm font-medium text-brand-600">{v.title}</div>
              <div className="mt-0.5 text-xs text-ink-400">共 {v.pointCount} 项 · {v.activatedAt?.slice(0, 10) ?? v.createdAt.slice(0, 10)} · {v.createdBy}</div>
            </div>
            <Archive className="h-4 w-4 text-ink-400" />
          </li>
        ))}
      </ul>
    </MobileShell>
  );
}
