'use client';

import { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, ListSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import {
  ListTodo,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';
import type { DailyTask } from '@/lib/types';
import { formatDate, buildRollingWindow, type RollingDay, isSameIsoDay, cn } from '@/lib/utils';

interface StudentTasksProps {
  studentId: string;
  coachId?: string;
  tasks: DailyTask[];
  mode: 'student' | 'coach';
  loading?: boolean;
  onMutation?: () => Promise<void>;
}

type Editing = {
  id: string;
  title: string;
  description: string | null;
  task_date: string;
} | null;

export function StudentTasks({ studentId, coachId, tasks: initial, mode, loading, onMutation }: StudentTasksProps) {
  const supabase = createClient();
  const toast = useToast();

  const [tasks, setTasks] = useState<DailyTask[]>(initial ?? []);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);

  const [rollingDays] = useState<RollingDay[]>(() => buildRollingWindow());
  const [activeDateIso, setActiveDateIso] = useState<string>(() => {
    const days = buildRollingWindow();
    return days.find((d) => d.isToday)?.dateIso ?? days[3].dateIso;
  });

  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_date: (() => {
      const days = buildRollingWindow();
      return days.find((d) => d.isToday)?.dateIso ?? days[3].dateIso;
    })(),
  });

  useMemo(() => {
    setTasks(initial ?? []);
  }, [initial]);

  const isStudent = mode === 'student';

  const sorted = useMemo(() => {
    return [...tasks]
      .filter((t) => isSameIsoDay(t.task_date, activeDateIso))
      .sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        return a.task_date.localeCompare(b.task_date);
      });
  }, [tasks, activeDateIso]);

  const handleToggle = async (task: DailyTask) => {
    const target = !task.is_completed;
    setTogglingId(task.id);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: target, updated_at: new Date().toISOString() })
        .eq('id', task.id);
      if (error) throw error;
      setTasks((cur) =>
        cur.map((t) => (t.id === task.id ? { ...t, is_completed: target } : t))
      );
      toast.success(target ? 'Görev tamamlandı' : 'Görev geri alındı', task.title);
      if (onMutation) await onMutation();
    } catch (e: any) {
      toast.error('Görev güncellenemedi', e?.message || 'Bir sorun oluştu');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    if (!newTask.title.trim()) {
      toast.warning('Görev başlığı gerekli');
      return;
    }
    if (!coachId) {
      toast.error('Koç bilgisi eksik');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        student_id: studentId,
        coach_id: coachId,
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        task_date: newTask.task_date,
        is_completed: false,
      };
      const { data, error } = await supabase
        .from('tasks')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      setTasks((cur) => [data as DailyTask, ...cur]);
      setNewTask({ title: '', description: '', task_date: new Date().toISOString().slice(0, 10) });
      setCreating(false);
      toast.success('Görev eklendi', data.title);
      if (onMutation) await onMutation();
    } catch (e: any) {
      toast.error('Görev eklenemedi', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (t: DailyTask) => {
    setEditing({
      id: t.id,
      title: t.title,
      description: t.description,
      task_date: t.task_date,
    });
  };

  const saveEdit = async () => {
    if (!editing || !editing.title.trim()) {
      toast.warning('Görev başlığı gerekli');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editing.title.trim(),
          description: editing.description?.trim() || null,
          task_date: editing.task_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editing.id);
      if (error) throw error;
      setTasks((cur) =>
        cur.map((t) =>
          t.id === editing.id
            ? {
                ...t,
                title: editing.title.trim(),
                description: editing.description?.trim() || null,
                task_date: editing.task_date,
              }
            : t
        )
      );
      toast.success('Görev güncellendi');
      setEditing(null);
      if (onMutation) await onMutation();
    } catch (e: any) {
      toast.error('Görev güncellenemedi', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTask = async (id: string, title: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks((cur) => cur.filter((t) => t.id !== id));
      toast.success('Görev silindi', title);
      if (onMutation) await onMutation();
    } catch (e: any) {
      toast.error('Görev silinemedi', e?.message);
    } finally {
      setDeletingId(null);
    }
  };

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const totalCount = tasks.length;
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl" />
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ListTodo className="w-4.5 h-4.5 text-emerald-600" />
              <h3 className="font-display font-bold text-lg text-slate-900">
                {isStudent ? 'Günlük Görevlerim' : 'Öğrenci Günlük Görevleri'}
              </h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {totalCount} görev · {completedCount} tamamlandı · %{progress} oranında
            </p>
          </div>
          {!isStudent && (
            <Button
              size="sm"
              onClick={() => {
                setCreating((c) => {
                  if (!c) {
                    setNewTask((nt) => ({ ...nt, task_date: activeDateIso }));
                  }
                  return !c;
                });
              }}
              type="button"
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'İptal' : 'Yeni Görev'}
            </Button>
          )}
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {!isStudent && creating && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Görev Başlığı *</span>
                <input
                  value={newTask.title}
                  onChange={(e) => setNewTask((c) => ({ ...c, title: e.target.value }))}
                  className="input mt-1.5"
                  placeholder="TYT Matematik - Türev konu tekrarı"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Tarih</span>
                <input
                  type="date"
                  value={newTask.task_date}
                  onChange={(e) => setNewTask((c) => ({ ...c, task_date: e.target.value }))}
                  className="input mt-1.5"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Açıklama</span>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask((c) => ({ ...c, description: e.target.value }))}
                className="input mt-1.5 min-h-[72px]"
                placeholder="Bu görev için detaylar, kaynaklar, hedefler..."
              />
            </label>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() =>
                  setNewTask({ title: '', description: '', task_date: activeDateIso })
                }
              >
                Temizle
              </Button>
              <Button size="sm" type="button" loading={submitting} onClick={handleCreate} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Ekle
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-slate-200">
          {rollingDays.map((d) => {
            const active = d.dateIso === activeDateIso;
            const dayTasks = tasks.filter((t) => isSameIsoDay(t.task_date, d.dateIso));
            const done = dayTasks.filter((t) => t.is_completed).length;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDateIso(d.dateIso)}
                className={cn(
                  'flex-shrink-0 min-w-[120px] px-3 py-2.5 rounded-xl text-xs font-semibold transition flex flex-col items-start gap-1 border',
                  active
                    ? 'bg-gradient-to-br from-emerald-500 to-sky-500 text-white border-transparent shadow-md shadow-emerald-500/20 ring-2 ring-emerald-300'
                    : d.isToday
                      ? 'bg-amber-50/80 text-amber-900 border-amber-300 hover:bg-amber-100/80'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-sm font-extrabold leading-none">
                    {d.dateLabel.split(' ')[0]}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[10px] font-bold',
                      active
                        ? dayTasks.length > 0 && done === dayTasks.length
                          ? 'bg-white text-emerald-700'
                          : 'bg-white/25 text-white'
                        : d.isToday
                          ? dayTasks.length > 0 && done === dayTasks.length
                            ? 'bg-emerald-500 text-white'
                            : 'bg-amber-200 text-amber-800'
                          : dayTasks.length > 0
                            ? done === dayTasks.length
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-700'
                            : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {dayTasks.length}
                  </span>
                </div>
                <div className={cn(
                  'flex items-center justify-between w-full gap-2 text-[10px] font-bold uppercase tracking-wide leading-tight',
                  active ? 'text-white/85' : d.isToday ? 'text-amber-700' : 'text-slate-500'
                )}>
                  <span>{d.dateLabel.split(' ').slice(1).join(' ')}</span>
                  <span>{d.isToday ? '· BUGÜN ·' : d.dayLabel}</span>
                </div>
              </button>
            );
          })}
        </div>

        {loading ? (
          <ListSkeleton count={5} />
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 py-10 flex flex-col items-center text-center gap-2.5 px-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-800">
              {rollingDays.find((d) => d.dateIso === activeDateIso)?.fullLabel ?? 'Seçili gün'} için henüz görev yok
            </p>
            <p className="text-sm text-slate-500 max-w-md">
              {isStudent
                ? 'Koçun sana bir program hazırladığında buradan göreceksin. Sabırsızlanma, başarı yakında!'
                : 'Bu öğrenci için seçili günde henüz bir görev eklenmedi. Sağ üstten yeni görev ekleyerek başlayabilirsin.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {sorted.map((t) => {
              const isEditing = editing?.id === t.id;
              const Row = () => (
                <>
                  <Checkbox
                    checked={t.is_completed}
                    onChange={() => handleToggle(t)}
                    disabled={togglingId === t.id}
                    aria-label="Görev tamamlandı"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`font-medium text-sm leading-snug ${
                          t.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}
                      >
                        {t.title}
                      </p>
                      <Badge variant={t.is_completed ? 'success' : 'ink'} size="sm" className="gap-1">
                        {t.is_completed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                          </>
                        ) : (
                          <>
                            <Circle className="w-3 h-3" /> Bekliyor
                          </>
                        )}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className={`mt-1 text-xs leading-relaxed ${t.is_completed ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(t.task_date)}
                      </span>
                    </div>
                  </div>
                  {!isStudent && !isEditing && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => startEdit(t)}
                        className="!p-2"
                        title="Düzenle"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => deleteTask(t.id, t.title)}
                        loading={deletingId === t.id}
                        className="!p-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              );

              return (
                <li
                  key={t.id}
                  className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${
                    t.is_completed
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-soft'
                  }`}
                >
                  {isEditing ? (
                    <div className="w-full grid sm:grid-cols-[auto_1fr] gap-3">
                      <Checkbox checked={t.is_completed} disabled />
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <label className="block">
                            <span className="text-xs font-semibold text-slate-600">Başlık *</span>
                            <input
                              value={editing.title}
                              onChange={(e) => setEditing((c) => (c ? { ...c, title: e.target.value } : c))}
                              className="input mt-1.5"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-semibold text-slate-600">Tarih</span>
                            <input
                              type="date"
                              value={editing.task_date}
                              onChange={(e) => setEditing((c) => (c ? { ...c, task_date: e.target.value } : c))}
                              className="input mt-1.5"
                            />
                          </label>
                        </div>
                        <label className="block">
                          <span className="text-xs font-semibold text-slate-600">Açıklama</span>
                          <textarea
                            value={editing.description ?? ''}
                            onChange={(e) => setEditing((c) => (c ? { ...c, description: e.target.value } : c))}
                            className="input mt-1.5 min-h-[72px]"
                          />
                        </label>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => setEditing(null)}
                            className="gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            İptal
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            loading={submitting}
                            onClick={saveEdit}
                            className="gap-1.5"
                          >
                            <Save className="w-4 h-4" />
                            Kaydet
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Row />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
