import { ShieldCheck } from 'lucide-react';

export function SafetyBanner({ tone = 'gold', text }: { tone?: 'gold' | 'ink' | 'brand'; text?: string }) {
  const defaultText =
    '本系统仅整理自护记录与复核依据，最终判断由造口专科护士完成；本工具不输出并发症判断，不替代专业医疗建议。';
  return (
    <div
      className={
        tone === 'gold'
          ? 'safety-banner flex items-start gap-2'
          : tone === 'brand'
            ? 'rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-6 text-brand-600 flex items-start gap-2'
            : 'rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm leading-6 text-ink-500 flex items-start gap-2'
      }
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{text ?? defaultText}</span>
    </div>
  );
}
