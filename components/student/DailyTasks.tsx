'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import {
  ListTodo,
  Plus,
  Clock,
  CheckCircle2,
  Flame,
  Trash2,
  GripVertical,
} from 'lucide-react';
import type { DailyTask } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

interface DailyTasksProps {
  tasks?: DailyTask[];
  studentId?: string;
}

export function DailyTasks({ tasks: initial, studentId }: DailyTasksProps) {
  const [tasks, setTasks] = useState<DailyTask[]>(initial ?? []);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const totalHours = tasks.reduce(
    (sum, t) => sum + (t.estimated_hours ?? 0),
    0
  );
  const completedHours = tasks
    .filter((t) => t.is_completed)
    .reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0);
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

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

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addTask = () => {
    if (!newTitle.trim()) return;
    const now = new Date().toISOString();
    setTasks((prev) => [
      ...prev,
      {
        id: `t_${Date.now()}`,
        student_id: studentId || 'local',
        task_date: new Date().toISOString(),
        title: newTitle.trim(),
        description: null,
        is_completed: false,
        estimated_hours: 1,
        created_at: now,
        updated_at: now,
      },
    ]);
    setNewTitle('');
    setAdding(false);
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
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Bugün · {formatDate(new Date())}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold">
                Günlük <span className="gradient-text">Görevlerin</span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="accent" className="gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              {completedCount}/{tasks.length} tamam
            </Badge>
            <Badge variant="fire" className="gap-1.5">
              <Clock className="w-3 h-3" />
              {completedHours}/{totalHours} saat
            </Badge>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Günlük İlerleme</span>
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
          {progress === 100 && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 pt-1 font-medium">
              <Flame className="w-4 h-4" />
              Harika! Bugünkü tüm hedeflerini bitirdin. Biraz dinlenmeyi unutma 💚
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody className="space-y-2.5">
        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-500">Bugün için henüz görev eklenmemiş.</p>
          </div>
        )}

        {tasks.map((task) => (
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
              <div className="mt-0.5 opacity-30 group-hover:opacity-100 transition-opacity cursor-grab">
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
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Görevi sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {adding ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
            <Input
              placeholder="Yeni görev ekle..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTask();
                if (e.key === 'Escape') {
                  setAdding(false);
                  setNewTitle('');
                }
              }}
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  setNewTitle('');
                }}
              >
                İptal
              </Button>
              <Button size="sm" onClick={addTask}>
                <Plus className="w-4 h-4" /> Ekle
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full p-3.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400/50 hover:bg-emerald-50/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-emerald-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Yeni görev ekle
          </button>
        )}
      </CardBody>
    </Card>
  );
}
