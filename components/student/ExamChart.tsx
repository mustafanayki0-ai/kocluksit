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
    .map((r) => ({
      date: new Date(r.exam_date).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short',
      }),
      net: Number(r.total_net),
      turkish: r.turkish_net ? Number(r.turkish_net) : undefined,
      math: r.math_net ? Number(r.math_net) : undefined,
      label: `${r.total_net.toFixed(1)} net`,
    }));
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

function buildSyntheticChartData(type: ExamType) {
  const base = type === 'TYT' ? 65 : 70;
  const variance = type === 'TYT' ? 8 : 12;
  const points = type === 'TYT' ? 5 : 4;
  const arr: ExamChartData[] = [];
  let value = base - variance;
  for (let i = 0; i < points; i++) {
    value = value + (variance / points) * (0.7 + Math.random() * 0.6);
    arr.push({
      date: `${i + 1}. Deneme`,
      net: Number(Math.min(base + variance, value).toFixed(1)),
      label: `${Math.min(base + variance, value).toFixed(1)} net`,
    });
  }
  return arr;
}

export function ExamChart({ type, results, targetNet }: ExamChartProps) {
  const data =
    results && results.length > 0
      ? prepareChartData(results)
      : buildSyntheticChartData(type);

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

  const color = type === 'TYT' ? '#ed99ff' : '#49ff9f';
  const colorSoft = type === 'TYT' ? 'from-emerald-500 to-emerald-400' : 'from-emerald-500 to-emerald-400';

  const stats = [
    { label: 'Son Net', value: latest, highlight: true },
    { label: 'Ortalama', value: avg },
    { label: 'En İyi', value: best },
    { label: 'Hedef', value: target, suffix: '+' },
  ];

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center shadow-lg',
                type === 'TYT'
                  ? 'bg-emerald-500/20 shadow-emerald-500/10'
                  : 'bg-emerald-500/20 shadow-emerald-500/10'
              )}
            >
              <BarChart3
                className={cn(
                  'w-5.5 h-5.5',
                  type === 'TYT' ? 'text-emerald-400' : 'text-emerald-400'
                )}
              />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">
                {type} <span className="gradient-text">Gelişim Grafiği</span>
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Son {data.length} deneme netin ve genel seyrin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                  ? `bg-gradient-to-br ${colorSoft} bg-opacity-10 border-transparent shadow-lg`
                  : 'bg-slate-900/60 border-slate-800'
              )}
            >
              <div className="text-[11px] uppercase tracking-wider font-medium text-slate-400">
                {s.label}
              </div>
              <div
                className={cn(
                  'font-display text-2xl font-bold mt-0.5 tabular-nums',
                  s.highlight ? 'text-white' : 'text-slate-100'
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
                    stopColor={type === 'TYT' ? '#49ff9f' : '#ed99ff'}
                    stopOpacity="0.9"
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 4"
                stroke="#2a2a3a"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#656598"
                tick={{ fill: '#8585b3', fontSize: 11 }}
                axisLine={{ stroke: '#3a3a53' }}
                tickLine={false}
              />
              <YAxis
                stroke="#656598"
                tick={{ fill: '#8585b3', fontSize: 11 }}
                axisLine={{ stroke: '#3a3a53' }}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(21, 21, 31, 0.95)',
                  border: '1px solid rgba(82, 82, 124, 0.5)',
                  borderRadius: 12,
                  color: '#ececf4',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                  fontSize: 13,
                }}
                labelStyle={{ color: '#8585b3', marginBottom: 4 }}
                cursor={{ stroke: color, strokeOpacity: 0.3, strokeWidth: 1 }}
                formatter={(val: number) => [`${val.toFixed(1)} net`, 'Toplam']}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#8585b3' }}
                iconType="circle"
              />
              <ReferenceLine
                y={target}
                stroke="#ff9636"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: `Hedef: ${target}`,
                  fill: '#ff9636',
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
                  fill: '#15151f',
                  stroke: color,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: color,
                  stroke: '#15151f',
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
