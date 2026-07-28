import { AdminShell } from '@/components/AdminShell';
import { KNOWLEDGE } from '@/lib/knowledge';
import { LifeBuoy, BookOpen, ListChecks } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminKnowledge() {
  const grouped = KNOWLEDGE.reduce<Record<string, typeof KNOWLEDGE>>((acc, item) => {
    (acc[item.topic] = acc[item.topic] ?? []).push(item);
    return acc;
  }, {});
  return (
    <AdminShell
      title="求助与知识条目"
      subtitle="按主题整理护士在随访中可能遇到的常见问题与回应参考"
    >
      <div className="rounded-2xl border border-gold-200 bg-gold-50 p-4 text-xs leading-6 text-gold-600">
        <LifeBuoy className="mr-1 inline h-3.5 w-3.5" />
        本页提供护士在电话/微信随访中可参考的回应话术；不构成医疗建议，最终判断仍由造口专科护士完成。
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {Object.entries(grouped).map(([topic, items]) => (
          <div key={topic} className="card p-5">
            <div className="flex items-center gap-2 text-brand-600">
              <BookOpen className="h-4 w-4" />
              <span className="text-base font-semibold">{topic}</span>
            </div>
            <ul className="mt-3 space-y-3">
              {items.map((it, i) => (
                <li key={i} className="rounded-xl border border-brand-100 bg-white p-3">
                  <div className="flex items-start gap-2 text-sm font-medium text-brand-600">
                    <ListChecks className="mt-0.5 h-4 w-4 text-gold-500" />
                    {it.question}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-500">{it.hint}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
