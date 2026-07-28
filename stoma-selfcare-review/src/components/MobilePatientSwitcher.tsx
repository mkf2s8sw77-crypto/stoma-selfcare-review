'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'demo_patient_id';
const COOKIE_KEY = 'demo_patient_id';

/** 同步写入 localStorage 与 Cookie：服务端页面依赖 Cookie 读取当前演示身份 */
function persist(pid: number) {
  localStorage.setItem(STORAGE_KEY, String(pid));
  document.cookie = `${COOKIE_KEY}=${pid}; path=/; max-age=31536000; samesite=lax`;
}

export function MobilePatientSwitcher({ patients }: { patients: { id: number; name: string; code: string }[] }) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const router = useRouter();
  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    // 已存身份有效则沿用；无效（如恢复演示数据后旧 id 已不存在）时回落到首位患者并修复本地状态
    const valid = patients.find((p) => p.id === stored);
    const target = valid ?? patients[0];
    if (!target) return;
    setId(target.id);
    persist(target.id);
  }, [patients]);
  const current = patients.find((p) => p.id === id);
  function pick(pid: number) {
    setId(pid);
    persist(pid);
    setOpen(false);
    router.refresh();
  }
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-brand-100 bg-white px-3 py-1.5 text-xs text-ink-500 shadow-sm"
      >
        <UserRound className="h-3.5 w-3.5 text-brand-500" />
        {current ? current.name : '选择患者'}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-60 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-card">
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-brand-50',
                p.id === id ? 'text-brand-600' : 'text-ink-500',
              )}
            >
              <span>{p.name}</span>
              <span className="text-[10px] text-ink-400">{p.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
