import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';
import { getAnalytics, getReviewQueue, getPatients, getNurses } from '@/lib/server';
import { formatDateTime, relativeTime } from '@/lib/utils';
import { Users, ClipboardList, Activity, Sparkles, ChevronRight, LifeBuoy, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const data = getAnalytics(30);
  const queue = getReviewQueue('待复核');
  const focus = getReviewQueue('需随访').slice(0, 6);
  const patients = getPatients();
  const nurses = getNurses();

  return (
    <AdminShell title="工作台" subtitle="随访前快速聚焦需要再次确认的环节">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">待复核记录</span>
            <ClipboardList className="h-4 w-4 text-brand-500" />
          </div>
          <div className="mt-2 stat-value">{data.pendingCount}</div>
          <div className="mt-1 text-xs text-ink-400">建议优先处理</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">本周新增</span>
            <Activity className="h-4 w-4 text-brand-500" />
          </div>
          <div className="mt-2 stat-value">{data.weekNew}</div>
          <div className="mt-1 text-xs text-ink-400">含患者与照护者打卡</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">平均匹配度</span>
            <Sparkles className="h-4 w-4 text-gold-500" />
          </div>
          <div className="mt-2 stat-value">{data.overallAvg}%</div>
          <div className="mt-1 text-xs text-ink-400">仅作语义比对参考</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="stat-label">需重点确认</span>
            <LifeBuoy className="h-4 w-4 text-warn-500" />
          </div>
          <div className="mt-2 stat-value text-warn-500">{data.followUpCount}</div>
          <div className="mt-1 text-xs text-ink-400">已由护士标记优先</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
            <div>
              <div className="section-title">AI 复核待处理队列</div>
              <p className="mt-1 text-xs text-ink-400">由 AI 完成要点比对，护士仅做人工确认与备注</p>
            </div>
            <Link href="/admin/reviews" className="btn-ghost text-xs">
              查看全部
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {queue.length === 0 ? (
            <div className="p-6 text-center text-sm text-ink-400">暂无待复核记录</div>
          ) : (
            <ul className="divide-y divide-brand-100">
              {queue.slice(0, 6).map((r) => {
                const p = patients.find((x) => x.id === r.patientId);
                const need = r.items.filter((i) => i.aiStatus !== '与要点一致').length;
                return (
                  <li key={r.id}>
                    <Link
                      href={`/admin/patients/${r.patientId}?record=${r.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-brand-50/50"
                    >
                      <div>
                        <div className="text-sm font-medium text-brand-600">
                          {p?.name ?? '患者'} · {p?.code ?? ''}
                        </div>
                        <div className="mt-0.5 text-xs text-ink-400">
                          {formatDateTime(r.recordedAt)} · {relativeTime(r.recordedAt)} · {need} 项需再次确认
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-400">匹配 {r.matchAvg}%</span>
                        <StatusBadge status={r.status} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
            <div>
              <div className="section-title">今日关注患者</div>
              <p className="mt-1 text-xs text-ink-400">需随访次数较多的患者</p>
            </div>
            <Link href="/admin/patients" className="btn-ghost text-xs">
              <Users className="h-3.5 w-3.5" />
              全部
            </Link>
          </div>
          <ul className="divide-y divide-brand-100">
            {data.focusPatients.length === 0 ? (
              <li className="p-6 text-center text-sm text-ink-400">暂无重点患者</li>
            ) : (
              data.focusPatients.map((fp) => (
                <li key={fp.patient.id}>
                  <Link
                    href={`/admin/patients/${fp.patient.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-brand-50/50"
                  >
                    <div>
                      <div className="text-sm font-medium text-brand-600">{fp.patient.name}</div>
                      <div className="mt-0.5 text-xs text-ink-400">{fp.patient.stomaType}</div>
                    </div>
                    <span className="badge-warn">{fp.count} 次</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="section-title">匹配度趋势</div>
          <p className="mt-1 text-xs text-ink-400">按天聚合，AI 整体表现</p>
          <div className="mt-3 space-y-1.5">
            {data.matchTrend.slice(-7).map((d) => (
              <div key={d.date} className="flex items-center gap-2 text-xs text-ink-500">
                <span className="w-20 flex-shrink-0">{d.date.slice(5)}</span>
                <div className="h-2 flex-1 rounded-full bg-brand-50">
                  <div className="h-2 rounded-full bg-brand-500" style={{ width: `${d.avg}%` }} />
                </div>
                <span className="w-10 text-right">{d.avg}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="section-title">记录状态分布</div>
          <p className="mt-1 text-xs text-ink-400">含全部历史与最近新增</p>
          <ul className="mt-3 space-y-2 text-sm">
            {(['已确认', '需随访', '待复核', '暂不适用'] as const).map((k) => {
              const v = data.statusDist[k] ?? 0;
              const total = Math.max(1, Object.values(data.statusDist).reduce((a, b) => a + b, 0));
              return (
                <li key={k} className="flex items-center gap-2">
                  <span className="w-20 text-ink-500">{k}</span>
                  <div className="h-2 flex-1 rounded-full bg-brand-50">
                    <div className="h-2 rounded-full bg-gold-400" style={{ width: `${(v / total) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-ink-500">{v}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="card p-5">
          <div className="section-title">演示账号</div>
          <p className="mt-1 text-xs text-ink-400">当前无登录，可在侧栏切换演示身份</p>
          <ul className="mt-3 space-y-2 text-sm">
            {nurses.map((n) => (
              <li key={n.username} className="flex items-center justify-between rounded-xl border border-brand-100 px-3 py-2">
                <span className="text-brand-600">{n.displayName}</span>
                <span className="text-xs text-ink-400">{n.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-gold-200 bg-gold-50 p-4 text-xs leading-6 text-gold-600">
        <History className="mr-1 inline h-3.5 w-3.5" />
        本工作台展示的所有比对结果仅供参考，最终判断由造口专科护士完成；演示数据可随时通过右上角「恢复演示数据」按钮重置。
      </div>
    </AdminShell>
  );
}
