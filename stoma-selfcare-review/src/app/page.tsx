import Link from 'next/link';
import { UserRound, Stethoscope, ClipboardList, ShieldCheck, Sparkles, BookOpenCheck } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { SafetyBanner } from '@/components/SafetyBanner';
import { getLandingSummary, getPatients, getVersion } from '@/lib/server';
import { BASE_PATH } from '@/lib/path';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const summary = getLandingSummary();
  const patients = getPatients();
  const active = summary.activeVersion
    ? getVersion(summary.activeVersion.id)
    : null;

  return (
    <div className="min-h-screen bg-[#F6F7F4]">
      <header className="border-b border-brand-100 bg-white">
        <div className="container-page flex items-center justify-between py-4">
          <BrandMark size={32} withText={true} />
          <div className="hidden items-center gap-2 text-xs text-ink-400 md:flex">
            <span>当前激活版本：</span>
            <span className="badge-gold">{summary.activeVersion?.version ?? '-'}</span>
          </div>
        </div>
      </header>

      <main className="container-page py-10">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs text-gold-600">
              <Sparkles className="h-3.5 w-3.5" />
              居家自护记录 · 造口专科护士复核
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-brand-600 sm:text-4xl">
              肠造口居家自护
              <br />
              AI 复核助手
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-ink-500">
              由造口专科护士预先审核并按版本维护居家自护要点；患者或主要照护者按要点提交执行记录；系统仅做语义比对与依据整理，定位可能遗漏或理解不一致的环节，附原始记录供护士复核。最终判断始终由专业人员完成。
            </p>
            <div className="mt-6">
              <SafetyBanner />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/m"
              className="card flex h-full flex-col gap-3 p-5 transition hover:border-brand-200 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="text-base font-semibold text-brand-600">我是患者 / 主要照护者</div>
              <p className="text-xs leading-6 text-ink-500">
                按今日护理要点完成打卡，查看历次记录与 AI 比对证据；当前演示以「{patients[0]?.name ?? '示例患者'}」为默认身份。
              </p>
              <div className="mt-auto flex items-center justify-between text-xs">
                <span className="text-ink-400">移动端优先</span>
                <span className="badge">{patients.length} 名患者</span>
              </div>
            </Link>

            <Link
              href="/admin"
              className="card flex h-full flex-col gap-3 p-5 transition hover:border-brand-200 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-600">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="text-base font-semibold text-brand-600">我是造口专科护士</div>
              <p className="text-xs leading-6 text-ink-500">
                查看 AI 复核待处理队列、患者执行档案，维护居家自护要点版本，并按需导出脱敏复盘数据。
              </p>
              <div className="mt-auto flex items-center justify-between text-xs">
                <span className="text-ink-400">PC 端优先</span>
                <span className="badge-gold">演示账号：陈素清 / 李文静</span>
              </div>
            </Link>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card">
            <div className="stat-label">在册患者</div>
            <div className="mt-2 stat-value">{summary.counts.patients}</div>
            <div className="mt-1 text-xs text-ink-400">业务化脱敏编号 SXBH-OS-2025-001 起</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">待复核记录</div>
            <div className="mt-2 stat-value">{summary.counts.pendingRecords}</div>
            <div className="mt-1 text-xs text-ink-400">含护士尚未处理的最新自护打卡</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">需随访再次确认</div>
            <div className="mt-2 stat-value text-warn-500">{summary.counts.followUpRecords}</div>
            <div className="mt-1 text-xs text-ink-400">已由护士标注优先关注</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">已确认记录</div>
            <div className="mt-2 stat-value text-ok-500">{summary.counts.confirmedRecords}</div>
            <div className="mt-1 text-xs text-ink-400">构成可追溯的居家自护执行档案</div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          <div className="card flex h-full flex-col gap-2 p-5">
            <div className="flex items-center gap-2 text-brand-600">
              <BookOpenCheck className="h-4 w-4" />
              <span className="section-title">要点版本维护</span>
            </div>
            <p className="text-sm leading-6 text-ink-500">
              {summary.activeVersion?.title ?? '尚无激活版本'}；{summary.activeVersion?.summary ?? ''}
            </p>
            <p className="text-xs text-ink-400">
              共 {active?.points.length ?? 0} 项要点；新建版本会复制当前激活版本的内容，便于按需增删。
            </p>
            <div className="mt-auto pt-2">
              <Link href="/admin/points" className="btn-outline text-xs">
                查看版本管理
              </Link>
            </div>
          </div>
          <div className="card flex h-full flex-col gap-2 p-5">
            <div className="flex items-center gap-2 text-brand-600">
              <ClipboardList className="h-4 w-4" />
              <span className="section-title">待复核队列</span>
            </div>
            <p className="text-sm leading-6 text-ink-500">
              共 {summary.counts.pendingRecords} 条待复核记录，平均匹配度用于快速识别需要重点确认的患者。
            </p>
            <div className="mt-auto pt-2">
              <Link href="/admin" className="btn-outline text-xs">
                进入护士工作台
              </Link>
            </div>
          </div>
          <div className="card flex h-full flex-col gap-2 p-5">
            <div className="flex items-center gap-2 text-brand-600">
              <ShieldCheck className="h-4 w-4" />
              <span className="section-title">数据安全边界</span>
            </div>
            <p className="text-sm leading-6 text-ink-500">
              不与任何外部系统对接；所有记录保存在本机 SQLite，导出 CSV 自动脱敏；最终判断由造口专科护士完成。
            </p>
            <div className="mt-auto pt-2">
              <Link href={`${BASE_PATH}/api/export.csv?range=30`} className="btn-outline text-xs">
                试导出脱敏 CSV
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t border-brand-100 bg-white">
        <div className="container-page flex flex-col gap-1 py-5 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© 山西白求恩医院 · 肠造口居家自护 AI 复核助手</span>
          <span>当前为无登录演示，所有数据均为脱敏示例。</span>
        </div>
      </footer>
    </div>
  );
}
