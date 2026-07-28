'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, ClipboardList, BookOpen, UserRound, RefreshCw } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { SafetyBanner } from './SafetyBanner';
import { cn } from '@/lib/utils';
import { BASE_PATH } from '@/lib/path';

const TABS = [
  { href: '/m', label: '首页', icon: Home },
  { href: '/m/check', label: '自护打卡', icon: ClipboardList },
  { href: '/m/records', label: '执行记录', icon: BookOpen },
  { href: '/m/points', label: '要点', icon: BookOpen },
  { href: '/m/profile', label: '我的', icon: UserRound },
];

export function MobileShell({
  title,
  subtitle,
  children,
  showSafety = true,
  rightSlot,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  showSafety?: boolean;
  rightSlot?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [patientId, setPatientId] = useState<number | null>(null);

  useEffect(() => {
    const id = Number(localStorage.getItem('demo_patient_id') ?? 0);
    setPatientId(id || null);
  }, []);

  async function resetDemo() {
    if (!confirm('确定要重置为初始演示数据吗？所有自护记录与复核将恢复为初始状态。')) return;
    await fetch(`${BASE_PATH}/api/reset-demo`, { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F6F7F4] pb-20">
      <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/95 backdrop-blur">
        <div className="container-mobile flex items-center justify-between py-3">
          <BrandMark size={28} withText={true} />
          <div className="flex items-center gap-1.5">
            {rightSlot}
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={resetDemo}
              title="恢复初始演示数据"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              恢复演示
            </button>
          </div>
        </div>
        {(title || subtitle) && (
          <div className="container-mobile pb-3">
            {title && <h1 className="text-lg font-semibold text-brand-600">{title}</h1>}
            {subtitle && <p className="mt-1 text-xs text-ink-400">{subtitle}</p>}
          </div>
        )}
      </header>

      <main className="container-mobile py-4">
        {showSafety && (
          <div className="mb-3">
            <SafetyBanner />
          </div>
        )}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-100 bg-white shadow-[0_-4px_16px_rgba(17,50,28,0.04)]">
        <div className="container-mobile flex items-stretch justify-between py-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = pathname === t.href || (t.href !== '/m' && pathname.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[11px] transition',
                  active ? 'text-brand-600' : 'text-ink-400',
                )}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
