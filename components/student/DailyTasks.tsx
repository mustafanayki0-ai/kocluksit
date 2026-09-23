'use client';

import { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  ListTodo,
  Clock,
  CheckCircle2,
  Flame,
  GripVertical,
  CalendarDays,
} from 'lucide-react';
import type { DailyTask } from '@/lib/types';
import { cn, DAYS, type DayKey, dayIndexFromDate, todayDayKey } from '@/lib/utils';

interface DailyTasksProps {
  tasks?: DailyTask[];
  studentId?: string;
}

export function DailyTasks({ tasks: initial }: DailyTasksProps) {
  const [tasks, setTasks] = useState<DailyTask[]>(initial ?? []);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<DayKey>(todayDayKey());

  const filtered = useMemo(() => {
    const curDay = DAYS.find((d) => d.key === activeDay);
    if (!curDay) return tasks;
    return tasks.filter((t) => dayIndexFromDate(t.task_date ?? t.created_at) === curDay.idx);
  }, [tasks, activeDay]);

  const completedCount = filtered.filter((t) => t.is_completed).length;
  const totalHours = filtered.reduce(
    (sum, t) => sum + (t.estimated_hours ?? 0),
    0
  );
  const completedHours = filtered
    .filter((t) => t.is_completed)
    .reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0);
  const progress = filtered.length > 0 ? (completedCount / filtered.length) * 100 : 0;

  const toggleTask = (id: string) => {
    setLoading(id);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, is_completed: !t.is_completed, updated_at: new Date().toISOString() }
          : t
      )
    );
    setTimeout(() => setLoading(null), 300);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl" />
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ListTodo className="w-5.5 h-5.5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Haftalık Program
                </span>
              </div>
              <h3 className="font-display text-xl font-bold">
                <span className="gradient-text">Görevlerin</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sadece tamamlandı olarak işaretleyebilirsin.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="accent" className="gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              {completedCount}/{filtered.length} tamam
            </Badge>
            <Badge variant="fire" className="gap-1.5">
              <Clock className="w-3 h-3" />
              {completedHours}/{totalHours} saat
            </Badge>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5 rounded-2xl bg-slate-100/70 p-1.5 border border-slate-200/80">
          {DAYS.map((d) => {
            const active = d.key === activeDay;
            const dayTasks = tasks.filter(
              (t) => dayIndexFromDate(t.task_date ?? t.created_at) === d.idx
            );
            const done = dayTasks.filter((t) => t.is_completed).length;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDay(d.key)}
                className={cn(
                  'flex-1 min-w-[80px] px-2.5 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between gap-2',
                  active
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                )}
              >
                <span className="flex items-center gap-1">
                  <span className="hidden sm:inline">{d.label}</span>
                  <span className="sm:hidden">{d.short}</span>
                </span>
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-bold',
                    active
                      ? dayTasks.length > 0 && done === dayTasks.length
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-100 text-emerald-700'
                      : dayTasks.length > 0
                      ? done === dayTasks.length
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-700'
                      : 'bg-slate-200/70 text-slate-500'
                  )}
                >
                  {dayTasks.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              {DAYS.find((d) => d.key === activeDay)?.label} · İlerleme
            </span>
            <span className="font-display font-bold gradient-text">
              %{progress.toFixed(0)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-500 to-orange-500 transition-all duration-700 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] bg-[length:200%_100%] animate-shine" />
            </div>
          </div>
          {progress === 100 && filtered.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 pt-1 font-medium">
              <Flame className="w-4 h-4" />
              Harika! Seçtiğin gündeki tüm hedeflerini bitirdin 💚
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody className="space-y-2.5">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <ListTodo className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">
              {DAYS.find((d) => d.key === activeDay)?.label} için henüz görev atanmamış
            </p>
            <p className="text-sm text-slate-500 mt-1">Koçun sana görev atadığında burada listelenecek.</p>
          </div>
        )}

        {filtered.map((task) => (
          <div
            key={task.id}
            className={cn(
              'group relative rounded-xl border transition-all duration-300 p-4',
              task.is_completed
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 opacity-30 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <Checkbox
                  checked={task.is_completed}
                  onChange={() => toggleTask(task.id)}
                  label={
                    <div className="flex flex-col">
                      <span className={cn('text-[15px]', loading === task.id && 'opacity-60')}>{task.title}</span>
                      {task.description && (
                        <span
                          className={cn(
                            'text-xs mt-1 leading-relaxed',
                            task.is_completed ? 'text-slate-400' : 'text-slate-500'
                          )}
                        >
                          {task.description}
                        </span>
                      )}
                    </div>
                  }
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {task.estimated_hours && (
                  <div className="chip bg-slate-50 text-slate-600 border border-slate-200 gap-1 text-[10px]">
                    <Clock className="w-3 h-3" />
                    {task.estimated_hours} sa
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
