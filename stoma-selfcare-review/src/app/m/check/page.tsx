'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileShell } from '@/components/MobileShell';
import { MobilePatientSwitcher } from '@/components/MobilePatientSwitcher';
import { ChevronLeft, ChevronRight, Sparkles, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BASE_PATH } from '@/lib/path';

interface Point { id: number; code: string; orderIdx: number; title: string; content: string; mustFlag: boolean; }
interface PatientOpt { id: number; name: string; code: string; }

const EXEC_OPTIONS = ['已按要点执行', '部分执行', '暂未执行', '不适用'] as const;
type Exec = typeof EXEC_OPTIONS[number];

export default function MobileCheckPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [step, setStep] = useState(0);
  const [exec, setExec] = useState<Record<number, Exec>>({});
  const [text, setText] = useState<Record<number, string>>({});
  const [by, setBy] = useState('本人');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { recordId: number; matchAvg: number; results: { pointId: number; aiStatus: string; aiMatch: number }[] }>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_PATH}/api/patients`).then((r) => r.json()),
      fetch(`${BASE_PATH}/api/points/active`).then((r) => r.json()),
    ]).then(([pj, pj2]) => {
      const list: PatientOpt[] = pj.patients.map((p: any) => ({ id: p.id, name: p.name, code: p.code }));
      setPatients(list);
      let pid = Number(localStorage.getItem('demo_patient_id') ?? 0);
      if (!pid || !list.find((x) => x.id === pid)) {
        pid = list[0]?.id ?? 0;
        if (pid) localStorage.setItem('demo_patient_id', String(pid));
      }
      setPatientId(pid);
      setPoints(pj2.points ?? []);
    });
  }, []);

  const total = points.length;
  const current = points[step];
  const allAnswered = points.every((p) => exec[p.id]);

  async function submit() {
    if (!patientId) return;
    setSubmitting(true);
    const items = points.map((p) => ({
      pointId: p.id,
      execution: exec[p.id] ?? '已按要点执行',
      rawText: text[p.id] ?? '',
    }));
    const res = await fetch(`${BASE_PATH}/api/records`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ patientId, recordedBy: by, generalNote: note, items }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setResult(data);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.error?.message ?? '提交失败，请重试');
    }
  }

  if (patients.length === 0 || points.length === 0) {
    return (
      <MobileShell title="自护打卡" subtitle="按步骤完成今日居家自护">
        <div className="card p-6 text-center text-sm text-ink-500">正在加载要点…</div>
      </MobileShell>
    );
  }

  if (result) {
    return (
      <MobileShell
        title="已提交"
        subtitle="AI 复核完成后将等待造口专科护士确认"
        rightSlot={<MobilePatientSwitcher patients={patients} />}
      >
        <div className="card p-5">
          <div className="flex items-center gap-2 text-brand-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-base font-semibold">自护记录已提交</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            共 {points.length} 项要点，平均匹配度 {result.matchAvg}%。AI 仅做语义比对与依据整理，最终判断由造口专科护士完成。
          </p>
          <div className="mt-4 space-y-2">
            {points.map((p, i) => {
              const r = result.results[i];
              return (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-brand-100 px-3 py-2">
                  <div className="text-sm text-brand-600">{p.title}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-ink-400">{r?.aiMatch ?? 0}%</span>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[11px]',
                      r?.aiStatus === '与要点一致' ? 'bg-[#E2F2EA] text-ok-500' :
                      r?.aiStatus === '表达模糊，需再次确认' ? 'bg-[#FAF1E0] text-warn-500' :
                      r?.aiStatus === '依据不足' ? 'bg-ink-50 text-ink-400' :
                      'bg-[#FBE5E1] text-danger-500',
                    )}>{r?.aiStatus ?? '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={() => router.push(`/m/records/${result.recordId}`)}
            >
              查看完整复核
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setResult(null);
                setStep(0);
                setExec({});
                setText({});
                setNote('');
              }}
            >
              再记一次
            </button>
          </div>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell
      title="自护打卡"
      subtitle="按 8 项要点依次回顾今日执行情况"
      rightSlot={<MobilePatientSwitcher patients={patients} />}
    >
      <div className="mb-3 flex items-center gap-1.5 text-xs text-ink-400">
        {points.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              i <= step ? 'bg-brand-500' : 'bg-brand-100',
            )}
          />
        ))}
      </div>
      {current && (
        <div className="card p-5">
          <div className="flex items-center justify-between text-xs text-ink-400">
            <span>第 {step + 1} / {total} 步</span>
            <span>{current.code}</span>
          </div>
          <h2 className="mt-2 text-base font-semibold text-brand-600">{current.title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">{current.content}</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {EXEC_OPTIONS.map((e) => {
              const active = exec[current.id] === e;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => setExec({ ...exec, [current.id]: e })}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-sm transition',
                    active
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-brand-100 bg-white text-ink-500 hover:border-brand-200',
                  )}
                >
                  {e}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="field-label">补充描述（AI 将以此为比对依据）</label>
            <textarea
              className="field-area min-h-[88px]"
              placeholder="例如：用温水清洁造口和周围皮肤，没用酒精和碘伏…"
              value={text[current.id] ?? ''}
              onChange={(e) => setText({ ...text, [current.id]: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          上一步
        </button>
        {step < total - 1 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          >
            下一步
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            提交本次自护记录
          </button>
        )}
      </div>

      {step === total - 1 && (
        <div className="mt-4 card p-4">
          <div className="section-title">记录信息</div>
          <div className="mt-3 space-y-3">
            <div>
              <label className="field-label">记录人</label>
              <select className="field" value={by} onChange={(e) => setBy(e.target.value)}>
                {['本人', '配偶', '儿子', '女儿', '其他家属'].map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">其他想告知护士的情况（可选）</label>
              <textarea
                className="field-area min-h-[64px]"
                placeholder="例如：最近睡眠一般、家里温度较低…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="rounded-xl border border-gold-200 bg-gold-50 p-3 text-xs leading-5 text-gold-600">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                提交后请等待造口专科护士在随访前联系。
              </div>
            </div>
          </div>
        </div>
      )}

      {!allAnswered && step === total - 1 && (
        <div className="mt-3 text-center text-xs text-warn-500">请先完成所有要点的执行情况选择。</div>
      )}

      <div className="mt-3 text-center text-[11px] text-ink-400">
        <Sparkles className="mr-1 inline h-3 w-3" /> AI 仅作语义比对，最终判断由造口专科护士完成。
      </div>
    </MobileShell>
  );
}