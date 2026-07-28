'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, ClipboardList, BookOpen, BarChart3,
  RefreshCw, LifeBuoy, LogOut, Stethoscope, UserCog,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { cn } from '@/lib/utils';
import { BASE_PATH } from '@/lib/path';

const NAV = [
  { href: '/admin', label: '工作台', icon: LayoutDashboard },
  { href: '/admin/patients', label: '患者档案', icon: Users },
  { href: '/admin/reviews', label: '复核队列', icon: ClipboardList },
  { href: '/admin/points', label: '要点版本', icon: BookOpen },
  { href: '/admin/analytics', label: '趋势分析', icon: BarChart3 },
  { href: '/admin/knowledge', label: '求助知识', icon: LifeBuoy },
];

export function AdminShell({
  title,
  subtitle,
  children,
  rightSlot,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [nurse, setNurse] = useState('陈素清');

  useEffect(() => {
    setNurse(localStorage.getItem('demo_nurse') ?? '陈素清');
  }, []);

  function pickNurse(name: string) {
    setNurse(name);
    localStorage.setItem('demo_nurse', name);
    router.refresh();
  }

  async function resetDemo() {
    if (!confirm('确定要重置为初始演示数据吗？所有自护记录与复核将恢复为初始状态。')) return;
    await fetch(`${BASE_PATH}/api/reset-demo`, { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-[#F6F7F4]">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-brand-100 bg-white lg:flex">
        <div className="flex items-center gap-3 border-b border-brand-100 px-5 py-4">
          <BrandMark size={28} withText={true} />
        </div>
        <nav className="flex-1 px-3 py-3">
          {NAV.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.href || (it.href !== '/admin' && pathname.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn('nav-item mt-0.5', active && 'nav-item-active')}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-brand-100 px-3 py-3 text-xs text-ink-400">
          <div className="mb-2 flex items-center gap-1.5 text-ink-500">
            <UserCog className="h-3.5 w-3.5" />
            当前演示账号
          </div>
          <div className="flex flex-col gap-1">
            {['陈素清', '李文静'].map((n) => (
              <button
                key={n}
                onClick={() => pickNurse(n)}
                className={cn(
                  'flex items-center justify-between rounded-md px-2 py-1 text-xs transition',
                  nurse === n ? 'bg-brand-50 text-brand-600' : 'text-ink-500 hover:bg-ink-50',
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="h-3 w-3" />
                  {n} · 造口专科护士
                </span>
                {nurse === n && <span className="text-[10px] text-brand-500">使用中</span>}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-brand-100 bg-white px-5">
          <div>
            {title && <div className="text-base font-semibold text-brand-600">{title}</div>}
            {subtitle && <div className="mt-0.5 text-xs text-ink-400">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-2">
            {rightSlot}
            <button onClick={resetDemo} className="btn-ghost text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              恢复演示数据
            </button>
            <Link href="/" className="btn-ghost text-xs">
              <LogOut className="h-3.5 w-3.5" />
              返回首页
            </Link>
          </div>
        </header>
        <main className="flex-1 px-5 py-5">{children}</main>
        <footer className="border-t border-brand-100 bg-white px-5 py-3 text-xs text-ink-400">
          本系统仅整理自护记录与复核依据，最终判断由造口专科护士完成；当前为无登录演示，可随时切换演示账号。
        </footer>
      </div>
    </div>
  );
}
