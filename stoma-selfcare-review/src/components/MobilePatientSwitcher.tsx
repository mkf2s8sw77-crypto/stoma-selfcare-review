'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobilePatientSwitcher({ patients }: { patients: { id: number; name: string; code: string }[] }) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const router = useRouter();
  useEffect(() => {
    const v = Number(localStorage.getItem('demo_patient_id') ?? 0);
    setId(v || patients[0]?.id || null);
    if (!v && patients[0]) localStorage.setItem('demo_patient_id', String(patients[0].id));
  }, [patients]);
  const current = patients.find((p) => p.id === id);
  function pick(pid: number) {
    setId(pid);
    localStorage.setItem('demo_patient_id', String(pid));
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
