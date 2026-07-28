import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    与要点一致: 'badge-ok',
    已确认: 'badge-ok',
    '表达模糊，需再次确认': 'badge-warn',
    需随访: 'badge-warn',
    未明确提及: 'badge-danger',
    未提及: 'badge-danger',
    依据不足: 'badge-muted',
    暂不适用: 'badge-ink',
    待复核: 'badge-gold',
    在册: 'badge',
    暂停: 'badge-muted',
    结束: 'badge-muted',
  };
  return <span className={cn(map[status] ?? 'badge-ink')}>{status}</span>;
}