'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Archive, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BASE_PATH } from '@/lib/path';

const OPTIONS = [
  { value: '已确认', label: '已确认', icon: CheckCircle2, color: 'ok' },
  { value: '需随访', label: '需随访再次确认', icon: AlertCircle, color: 'warn' },
  { value: '暂不适用', label: '暂不适用', icon: Archive, color: 'muted' },
] as const;

export function ReviewActions({ itemId, status }: { itemId: number; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function apply(value: string) {
    const reviewer = (typeof window !== 'undefined' && localStorage.getItem('demo_nurse')) || '陈素清';
    setPending(value);
    const res = await fetch(`${BASE_PATH}/api/records/${itemId}/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: value, note: value === '需随访' ? note || '建议下次随访重点确认' : note, reviewer }),
    });
    setPending(null);
    if (res.ok) {
      setNote('');
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.error?.message ?? '复核失败');
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-dashed border-brand-100 bg-white/60 p-3">
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => {
          const active = status === o.value;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              onClick={() => apply(o.value)}
              disabled={pending !== null}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition',
                active
                  ? o.color === 'ok'
                    ? 'border-ok-500 bg-[#E2F2EA] text-ok-500'
                    : o.color === 'warn'
                      ? 'border-warn-500 bg-[#FAF1E0] text-warn-500'
                      : 'border-ink-300 bg-ink-50 text-ink-500'
                  : 'border-brand-100 text-ink-500 hover:border-brand-200',
              )}
            >
              {pending === o.value ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
              {o.label}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="（可选）填写复核备注，将出现在患者端"
          className="field flex-1 text-xs"
        />
      </div>
    </div>
  );
}
