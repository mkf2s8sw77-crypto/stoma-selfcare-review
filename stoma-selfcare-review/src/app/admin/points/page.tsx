'use client';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { BASE_PATH } from '@/lib/path';
import { Plus, Save, Star, History, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VersionView {
  id: number;
  version: string;
  title: string;
  summary: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  activatedAt: string | null;
  pointCount: number;
}
interface PointView {
  id: number;
  code: string;
  orderIdx: number;
  title: string;
  content: string;
  mustFlag: boolean;
  keywords: string[];
  evidenceHints: string[];
}

export default function AdminPoints() {
  const [versions, setVersions] = useState<VersionView[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [points, setPoints] = useState<PointView[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ version: '', title: '', summary: '' });

  async function load() {
    const r = await fetch(`${BASE_PATH}/api/point-versions`);
    const j = await r.json();
    setVersions(j.versions);
    const a = j.versions.find((v: VersionView) => v.isActive) ?? j.versions[0];
    if (a) {
      setActiveId(a.id);
      const det = await fetch(`${BASE_PATH}/api/point-versions/${a.id}`);
      const dj = await det.json();
      setPoints(dj.points);
    }
  }
  useEffect(() => { load(); }, []);

  async function pick(id: number) {
    setActiveId(id);
    const det = await fetch(`${BASE_PATH}/api/point-versions/${id}`);
    const dj = await det.json();
    setPoints(dj.points);
  }

  async function activate() {
    if (!activeId) return;
    setBusy(true);
    const actor = localStorage.getItem('demo_nurse') ?? undefined;
    await fetch(`${BASE_PATH}/api/point-versions/${activeId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ actor }),
    });
    await load();
    setBusy(false);
  }

  async function create() {
    if (!draft.version || !draft.title || !draft.summary) {
      alert('请填写版本号、标题与说明');
      return;
    }
    const from = versions.find((v) => v.isActive)?.version ?? 'v2.0';
    setBusy(true);
    const r = await fetch(`${BASE_PATH}/api/point-versions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...draft, fromVersion: from, creator: '陈素清' }),
    });
    setBusy(false);
    if (r.ok) {
      setCreating(false);
      setDraft({ version: '', title: '', summary: '' });
      const j = await r.json();
      await load();
      pick(j.versionId);
    } else {
      const err = await r.json();
      alert(err?.error?.message ?? '创建失败');
    }
  }

  const active = versions.find((v) => v.id === activeId);

  return (
    <AdminShell
      title="居家自护要点版本"
      subtitle="按版本维护 8 项要点；启用后会影响后续所有患者记录的 AI 比对"
      rightSlot={
        <button onClick={() => setCreating(true)} className="btn-primary text-xs">
          <Plus className="h-3.5 w-3.5" />
          新建版本
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-brand-100 px-4 py-3 text-sm font-semibold text-brand-600">版本列表</div>
          <ul className="divide-y divide-brand-100">
            {versions.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-400">暂无版本</li>
            )}
            {versions.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => pick(v.id)}
                  className={cn(
                    'flex w-full items-start justify-between px-4 py-3 text-left text-sm transition hover:bg-brand-50/40',
                    v.id === activeId && 'bg-brand-50/60',
                  )}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-brand-600">{v.version}</span>
                      {v.isActive && <span className="badge-gold">启用中</span>}
                    </div>
                    <div className="mt-1 text-xs text-ink-400">共 {v.pointCount} 项</div>
                    <div className="mt-0.5 text-xs text-ink-400">
                      {v.activatedAt?.slice(0, 10) ?? v.createdAt.slice(0, 10)} · {v.createdBy}
                    </div>
                  </div>
                  <History className="h-4 w-4 text-ink-400" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          {active && (
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-brand-600">{active.title}</div>
                  <p className="mt-1 text-sm text-ink-500">{active.summary}</p>
                </div>
                {!active.isActive && (
                  <button onClick={activate} disabled={busy} className="btn-primary text-xs">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    设为启用版本
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="card">
            <ul className="divide-y divide-brand-100">
              {points.map((p) => (
                <li key={p.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-brand-600">{p.orderIdx}. {p.title}</div>
                      <p className="mt-1 text-sm leading-6 text-ink-500">{p.content}</p>
                      <div className="mt-2 text-xs text-ink-400">
                        关键词：{p.keywords.join('、')}
                      </div>
                    </div>
                    {p.mustFlag ? <Star className="h-4 w-4 text-gold-500" /> : <span className="text-xs text-ink-400">建议</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {creating && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
            <div className="text-base font-semibold text-brand-600">新建要点版本</div>
            <p className="mt-1 text-xs text-ink-400">将基于当前激活版本复制全部要点，便于微调后再启用</p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="field-label">版本号</label>
                <input className="field" placeholder="v2.1-草稿" value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} />
              </div>
              <div>
                <label className="field-label">版本标题</label>
                <input className="field" placeholder="肠造口居家自护要点 v2.1" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div>
                <label className="field-label">说明</label>
                <textarea className="field-area min-h-[80px]" placeholder="本次变更要点" value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setCreating(false)} className="btn-ghost text-xs">取消</button>
              <button onClick={create} disabled={busy} className="btn-primary text-xs">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                创建并复制
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
