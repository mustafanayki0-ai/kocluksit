'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LineChartSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ExamResult } from '@/lib/types';

interface ExamLineChartProps {
  results: ExamResult[];
  loading?: boolean;
}

function prepareData(results: ExamResult[]) {
  return results
    .map((r) => ({
      date: new Date(r.exam_date).toLocaleDateString('tr-TR', { month: '2-digit', day: '2-digit' }),
      net: Number((r as any).net_score ?? r.total_net ?? 0),
      label: `${r.exam_type} - ${new Date(r.exam_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`,
    }))
    .sort((a, b) => {
      const sa = a.date.split('.');
      const sb = b.date.split('.');
      return Number(sa[1]) - Number(sb[1]) || Number(sa[0]) - Number(sb[0]);
    });
}

function TrendBadge({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <Badge variant="ink" size="sm" className="gap-1.5">
        <Minus className="w-3 h-3" />
        Trend: Yeterli veri yok
      </Badge>
    );
  }
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const diff = last - prev;
  const delta = diff.toFixed(2);
  if (diff > 0) {
    return (
      <Badge variant="success" size="sm" className="gap-1.5">
        <TrendingUp className="w-3 h-3" />
        +{delta} net yukarı
      </Badge>
    );
  }
  if (diff < 0) {
    return (
      <Badge variant="warning" size="sm" className="gap-1.5">
        <TrendingDown className="w-3 h-3" />
        {delta} net aşağı
      </Badge>
    );
  }
  return (
    <Badge variant="ink" size="sm" className="gap-1.5">
      <Minus className="w-3 h-3" />
      Sabit
    </Badge>
  );
}

function Stats({ data }: { data: ReturnType<typeof prepareData> }) {
  const avg = data.length ? (data.reduce((s, d) => s + d.net, 0) / data.length).toFixed(2) : '—';
  const max = data.length ? Math.max(...data.map((d) => d.net)).toFixed(2) : '—';
  const last = data.length ? data[data.length - 1].net.toFixed(2) : '—';
  const box =
    'rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col gap-1';
  const label = 'text-[11px] uppercase tracking-wider font-semibold text-slate-500';
  const value = 'text-2xl font-display font-bold text-slate-900 leading-none';
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className={box}>
        <span className={label}>Ortalama</span>
        <span className={value}>{avg}</span>
      </div>
      <div className={box}>
        <span className={label}>En Yüksek</span>
        <span className={value}>{max}</span>
      </div>
      <div className={box}>
        <span className={label}>Son Net</span>
        <span className={value}>{last}</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
        <BarChart3 className="w-6 h-6" />
      </div>
      <div>
        <p className="font-semibold text-slate-800">Henüz deneme verisi yok</p>
        <p className="text-sm text-slate-500 mt-1">
          Sisteme ilk deneme sonucunu eklediğinde grafiğin burada belirecek.
        </p>
      </div>
    </div>
  );
}

export function ExamLineChart({ results, loading }: ExamLineChartProps) {
  const tytAll = results.filter((r) => r.exam_type === 'TYT');
  const aytAll = results.filter((r) => r.exam_type === 'AYT');
  const tyt = useMemo(() => prepareData(tytAll), [tytAll]);
  const ayt = useMemo(() => prepareData(aytAll), [aytAll]);

  if (loading) {
    return (
      <div className="space-y-5">
        <LineChartSkeleton />
        <LineChartSkeleton />
      </div>
    );
  }

  const renderChart = ({
    data,
    type,
    color,
    soft,
  }: {
    data: ReturnType<typeof prepareData>;
    type: 'TYT' | 'AYT';
    color: string;
    soft: string;
  }) => {
    return (
      <Card className="overflow-hidden relative">
        <div className={`absolute -top-24 -right-16 w-72 h-72 rounded-full blur-3xl ${soft}`} />
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5" strokeWidth={2.2} />
                {type} Net Gelişimi
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {data.length} deneme · kronolojik sıralama
              </p>
            </div>
            <TrendBadge values={data.map((d) => d.net)} />
          </div>
        </CardHeader>
        <CardBody className="space-y-5">
          {data.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                    <defs>
                      <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        background: 'rgba(255,255,255,0.98)',
                        boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.18)',
                        fontSize: 12,
                        padding: '10px 12px',
                      }}
                      labelStyle={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}
                      formatter={(value: number) => [`${value.toFixed(2)} net`, 'Toplam Net']}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke={color}
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#ffffff', stroke: color, strokeWidth: 2 }}
                      activeDot={{ r: 6, stroke: color, strokeWidth: 3, fill: color }}
                      fill={`url(#grad-${type})`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Stats data={data} />
            </>
          )}
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="space-y-5">
      {renderChart({ data: tyt, type: 'TYT', color: '#10b981', soft: 'bg-emerald-500/20' })}
      {renderChart({ data: ayt, type: 'AYT', color: '#0ea5e9', soft: 'bg-sky-500/20' })}
    </div>
  );
}
