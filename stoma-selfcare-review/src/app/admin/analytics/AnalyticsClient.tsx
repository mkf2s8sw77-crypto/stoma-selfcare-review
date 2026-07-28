'use client';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';
import { Download, BarChart3, Activity, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { BASE_PATH } from '@/lib/path';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, PieChart, Pie, Cell,
} from 'recharts';

interface Analytics {
  rangeDays: number;
  matchTrend: { date: string; avg: number; count: number }[];
  statusDist: Record<string, number>;
  focusPatients: { patient: any; count: number }[];
  overallAvg: number;
  pendingCount: number;
  followUpCount: number;
  weekNew: number;
}

const COLORS = ['#1E4B2C', '#CEB268', '#D2913A', '#6A7368'];

export function AnalyticsClient({ initial }: { initial: Analytics }) {
  const [data, setData] = useState<Analytics>(initial);
  const [range, setRange] = useState(30);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(true);
    fetch(`${BASE_PATH}/api/analytics?range=${range}`)
      .then((r) => r.json())
      .then((j) => setData(j))
      .finally(() => setBusy(false));
  }, [range]);

  const statusPie = Object.entries(data.statusDist).map(([k, v]) => ({ name: k, value: v }));
  const totalStatus = statusPie.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <AdminShell
      title="趋势分析"
      subtitle="按时间窗口观察 AI 比对表现与重点患者"
      rightSlot={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={cn(
                  'rounded-full px-3 py-1 transition',
                  range === d ? 'bg-brand-500 text-white' : 'border border-brand-100 text-ink-500 hover:border-brand-200',
                )}
              >
                最近 {d} 天
              </button>
            ))}
          </div>
          <a href={`${BASE_PATH}/api/export.csv?range=${range}`} className="btn-primary text-xs">
            <Download className="h-3.5 w-3.5" />
            导出脱敏 CSV
          </a>
        </div>
      }
    >
      <div className={cn('transition', busy && 'opacity-60')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">平均匹配度</span>
              <TrendingUp className="h-4 w-4 text-brand-500" />
            </div>
            <div className="mt-2 stat-value">{data.overallAvg}%</div>
            <div className="mt-1 text-xs text-ink-400">所有要点的 AI 相似度均值</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">待复核</span>
              <Activity className="h-4 w-4 text-gold-500" />
            </div>
            <div className="mt-2 stat-value">{data.pendingCount}</div>
            <div className="mt-1 text-xs text-ink-400">建议本周内完成</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">需随访</span>
              <AlertCircle className="h-4 w-4 text-warn-500" />
            </div>
            <div className="mt-2 stat-value text-warn-500">{data.followUpCount}</div>
            <div className="mt-1 text-xs text-ink-400">随访前重点关注</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label">需重点确认患者</span>
              <Users className="h-4 w-4 text-brand-500" />
            </div>
            <div className="mt-2 stat-value">{data.focusPatients.length}</div>
            <div className="mt-1 text-xs text-ink-400">需随访次数 TOP 5</div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="section-title">AI 匹配度趋势</div>
                <p className="mt-1 text-xs text-ink-400">按日聚合，值越高表示患者原话与要点越接近</p>
              </div>
              <BarChart3 className="h-4 w-4 text-ink-400" />
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.matchTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2EEE3" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="#6A7368" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#6A7368" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg" stroke="#1E4B2C" strokeWidth={2} dot={{ r: 3 }} name="平均匹配度 %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <div className="section-title">记录状态分布</div>
            <p className="mt-1 text-xs text-ink-400">含全部历史</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Pie
                    data={statusPie}
                    innerRadius={48}
                    outerRadius={72}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
                      const RAD = Math.PI / 180;
                      const r = innerRadius + (outerRadius - innerRadius) * 1.15;
                      const x = cx + r * Math.cos(-midAngle * RAD);
                      const y = cy + r * Math.sin(-midAngle * RAD);
                      return (
                        <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fill="#3F473D">
                          {`${name} ${Math.round((percent ?? 0) * 100)}%`}
                        </text>
                      );
                    }}
                  >
                    {statusPie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <div className="section-title">记录数 / 匹配度（按周）</div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.matchTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2EEE3" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="#6A7368" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#6A7368" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#6A7368" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#CEB268" name="记录数" />
                  <Bar yAxisId="right" dataKey="avg" fill="#1E4B2C" name="匹配度 %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <div className="section-title">需重点确认患者</div>
            <ul className="mt-3 space-y-2">
              {data.focusPatients.length === 0 && <li className="text-sm text-ink-400">暂无</li>}
              {data.focusPatients.map((fp) => (
                <li key={fp.patient.id} className="flex items-center justify-between rounded-xl border border-brand-100 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-brand-600">{fp.patient.name}</div>
                    <div className="text-xs text-ink-400">{fp.patient.stomaType}</div>
                  </div>
                  <span className="badge-warn">{fp.count} 次</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
