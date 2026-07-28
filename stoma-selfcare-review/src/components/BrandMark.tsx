import { BASE_PATH } from '@/lib/path';

export function BrandMark({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="inline-flex items-center gap-3">
      <div
        className="flex items-center justify-center rounded-full border border-brand-100 bg-white shadow-card"
        style={{ width: size + 16, height: size + 16 }}
      >
        {/* Logo 本身已是白底圆徽章，外层加品牌色描边以避免在彩色背景上被吃边 */}
        <img
          src={`${BASE_PATH}/logo.png`}
          alt="山西白求恩医院"
          width={size}
          height={size}
          className="block object-contain"
        />
      </div>
      {withText && (
        <div className="leading-tight">
          <div className="text-sm font-semibold text-brand-600">山西白求恩医院</div>
          <div className="text-[11px] text-ink-400">肠造口居家自护 AI 复核助手</div>
        </div>
      )}
    </div>
  );
}
