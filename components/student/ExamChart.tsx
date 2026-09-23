'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import type { ExamResult, ExamChartData, ExamType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ExamChartProps {
  type: ExamType;
  results: ExamResult[];
  targetNet?: number;
}

function prepareChartData(results: ExamResult[]): ExamChartData[] {
  return results
    .slice()
    .sort(
      (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
    )
    .map((r) => {
      const net = Number(r.net_score ?? r.total_net ?? 0);
      return {
        date: new Date(r.exam_date).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'short',
        }),
        net,
        turkish: r.turkish_net ? Number(r.turkish_net) : undefined,
        math: r.math_net ? Number(r.math_net) : undefined,
        label: `${net.toFixed(1)} net`,
      };
    });
}

function calculateTrend(data: ExamChartData[]) {
  if (data.length < 2) return { value: 0, direction: 'flat' as const };
  const last = data[data.length - 1].net;
  const prev = data[data.length - 2].net;
  const diff = Number((last - prev).toFixed(1));
  return {
    value: Math.abs(diff),
    direction: (diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat') as 'up' | 'down' | 'flat',
  };
}

export function ExamChart({ type, results, targetNet }: ExamChartProps) {
  const data = results && results.length > 0 ? prepareChartData(results) : [];

  const trend = calculateTrend(data);
  const avg =
    data.length > 0
      ? Number(
          (data.reduce((sum, d) => sum + d.net, 0) / data.length).toFixed(1)
        )
      : 0;
  const best = data.length > 0 ? Math.max(...data.map((d) => d.net)) : 0;
  const latest = data.length > 0 ? data[data.length - 1].net : 0;
  const target = targetNet ?? (type === 'TYT' ? 100 : 120);

  const color = type === 'TYT' ? '#10b981' : '#0ea5e9';
  const colorSoft =
    type === 'TYT'
      ? 'from-emerald-500/10 to-emerald-400/10'
      : 'from-sky-500/10 to-sky-400/10';

  const stats = [
    { label: 'Son Net', value: latest, highlight: true },
    { label: 'Ortalama', value: avg },
    { label: 'En İyi', value: best },
    { label: 'Hedef', value: target, suffix: '+' },
  ];

  if (data.length === 0) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <BarChart3 className="w-5.5 h-5.5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">
                  {type} <span className="gradient-text">Gelişim Grafiği</span>
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Henüz deneme sonucu yok
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-10 text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">
              Henüz deneme verisi bulunmuyor
            </p>
            <p className="text-sm text-slate-400">
              İlk deneme sonucunu girdiğinde gelişim grafiğin burada görünecek.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center',
                type === 'TYT' ? 'bg-emerald-50' : 'bg-sky-50'
              )}
            >
              <BarChart3
                className={cn(
                  'w-5.5 h-5.5',
                  type === 'TYT' ? 'text-emerald-600' : 'text-sky-600'
                )}
              />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">
                {type} <span className="gradient-text">Gelişim Grafiği</span>
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Son {data.length} deneme netin ve genel seyrin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={type === 'TYT' ? 'brand' : 'accent'} size="md">
              {type === 'TYT' ? 'Temel Yeterlilik' : 'Alan Yeterlilik'}
            </Badge>
            <Badge
              variant={
                trend.direction === 'up'
                  ? 'success'
                  : trend.direction === 'down'
                  ? 'warning'
                  : 'ink'
              }
              size="md"
              className="gap-1.5"
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {trend.value > 0 ? `+${trend.value}` : trend.value} net
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className={cn(
                'rounded-xl p-3.5 border',
                s.highlight
                  ? `bg-gradient-to-br ${colorSoft} border-transparent shadow-sm`
                  : 'bg-slate-50 border-slate-200'
              )}
            >
              <div className="text-[11px] uppercase tracking-wider font-medium text-slate-500">
                {s.label}
              </div>
              <div
                className={cn(
                  'font-display text-2xl font-bold mt-0.5 tabular-nums',
                  s.highlight ? 'text-slate-900' : 'text-slate-800'
                )}
              >
                {s.value}
                {s.suffix && <span className="text-sm ml-0.5">{s.suffix}</span>}
              </div>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardBody>
        <div className="h-64 md:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`stroke-${type}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                  <stop
                    offset="100%"
                    stopColor={type === 'TYT' ? '#0ea5e9' : '#f97316'}
                    stopOpacity="0.9"
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 4"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.98)',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  color: '#0f172a',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.12)',
                  fontSize: 13,
                }}
                labelStyle={{ color: '#64748b', marginBottom: 4 }}
                cursor={{ stroke: color, strokeOpacity: 0.3, strokeWidth: 1 }}
                formatter={(val: number) => [`${val.toFixed(1)} net`, 'Toplam']}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#64748b' }}
                iconType="circle"
              />
              <ReferenceLine
                y={target}
                stroke="#f97316"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: `Hedef: ${target}`,
                  fill: '#f97316',
                  fontSize: 11,
                  position: 'right',
                }}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Toplam Net"
                stroke={`url(#stroke-${type})`}
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: '#ffffff',
                  stroke: color,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: color,
                  stroke: '#ffffff',
                  strokeWidth: 3,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
