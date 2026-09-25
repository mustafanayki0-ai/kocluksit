'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Briefcase,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  CalendarDays,
  BarChart3,
  Search,
  Target,
  Sparkles,
  BookOpen,
  ChevronRight,
  UserPlus,
  X,
  Save,
  Pencil,
  Mail,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { cn, buildRollingWindow, type RollingDay, isSameIsoDay } from '@/lib/utils';
import { MeetingCard } from '@/components/rbac/MeetingCard';
import { useMeetingNotifications } from '@/hooks/useMeetingNotifications';
import type { Meeting } from '@/lib/types';

type Student = {
  id: string;
  full_name: string;
  email: string;
  coach_id: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  task_date: string;
  is_completed: boolean;
  created_at: string;
  student_id: string;
  coach_id: string | null;
};

type Exam = {
  id: string;
  exam_type: 'TYT' | 'AYT';
  exam_date: string;
  net_score?: number | null;
  total_net?: number | null;
  student_id: string;
};

function toChartData(list: Exam[]) {
  return [...list]
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
    .map((r) => {
      const net = Number((r.net_score ?? r.total_net ?? 0));
      return {
        date: new Date(r.exam_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
        net,
        label: `${net.toFixed(1)} net`,
      };
    });
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'short',
    });
  } catch {
    return d;
  }
}

interface CoachPanelClientProps {
  coachId: string;
  coachName: string;
  initialStudents: Student[];
}

export function CoachPanelClient({ coachId, coachName, initialStudents }: CoachPanelClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  useMeetingNotifications({
    userId: coachId,
    mode: 'coach',
    enabled: true,
    requestPermission: true,
  });

  const [students, setStudents] = useState<Student[]>(initialStudents ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialStudents && initialStudents.length > 0 ? initialStudents[0].id : null
  );
  const [query, setQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [addingStudent, setAddingStudent] = useState(false);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [selectedUnassignedId, setSelectedUnassignedId] = useState<string>('');
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);

  const [rollingDays] = useState<RollingDay[]>(() => buildRollingWindow());
  const [activeDateIso, setActiveDateIso] = useState<string>(() => {
    const days = buildRollingWindow();
    return days.find((d) => d.isToday)?.dateIso ?? days[3].dateIso;
  });
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDate, setTaskDate] = useState<string>(() => {
    const days = buildRollingWindow();
    return days.find((d) => d.isToday)?.dateIso ?? days[3].dateIso;
  });
  const [savingTask, setSavingTask] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCompleted, setEditCompleted] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [delTaskId, setDelTaskId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function loadUnassignedStudents() {
    setLoadingUnassigned(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, coach_id')
        .eq('role', 'student')
        .is('coach_id', null)
        .order('full_name', { ascending: true, nullsFirst: false });

      const list: Student[] = (data ?? []).map((s: any) => ({
        id: s.id,
        full_name: s.full_name || 'İsimsiz Öğrenci',
        email: s.email || '',
        coach_id: s.coach_id,
      }));
      setUnassignedStudents(list);
    } catch (err: any) {
      toast.error('Bekleyen öğrenciler yüklenemedi', err?.message);
    } finally {
      setLoadingUnassigned(false);
    }
  }

  async function reloadStudents() {
    setLoadingStudents(true);
    try {
      const { data: studs } = await supabase
        .from('profiles')
        .select('id, full_name, email, coach_id')
        .eq('coach_id', coachId)
        .eq('role', 'student')
        .order('full_name', { ascending: true, nullsFirst: false });

      const list: Student[] = (studs ?? []).map((s: any) => ({
        id: s.id,
        full_name: s.full_name || 'İsimsiz Öğrenci',
        email: s.email || '',
        coach_id: s.coach_id,
      }));
      setStudents(list);
      if (list.length > 0 && (!selectedId || !list.find((s) => s.id === selectedId))) {
        setSelectedId(list[0].id);
      }
      if (list.length === 0) {
        setSelectedId(null);
      }
    } catch (err: any) {
      toast.error('Öğrenciler yenilenemedi', err?.message);
    } finally {
      setLoadingStudents(false);
    }
  }

  async function loadStudentDetail(studentId: string) {
    setLoadingDetail(true);
    setTasks([]);
    setExams([]);
    setMeetings([]);
    try {
      const [{ data: t }, { data: e }, { data: m }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('student_id', studentId)
          .order('task_date', { ascending: false }),
        supabase
          .from('exam_results')
          .select('*')
          .eq('student_id', studentId)
          .order('exam_date', { ascending: false }),
        supabase
          .from('meetings')
          .select('id, student_id, coach_id, title, meeting_date, duration_minutes, meeting_url, notes, status, created_at, updated_at')
          .eq('student_id', studentId)
          .order('meeting_date', { ascending: false }),
      ]);
      setTasks((t as Task[]) ?? []);
      setExams((e as Exam[]) ?? []);
      setMeetings((m as Meeting[]) ?? []);
    } catch (err: any) {
      toast.error('Öğrenci detayı yüklenemedi', err?.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    if (selectedId) {
      loadStudentDetail(selectedId);
    } else {
      setTasks([]);
      setExams([]);
      setMeetings([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
    );
  }, [students, query]);

  const selectedStudent = students.find((s) => s.id === selectedId) ?? null;
  const filteredUnassigned = useMemo(() => {
    const q = unassignedSearch.trim().toLowerCase();
    if (!q) return unassignedStudents;
    return unassignedStudents.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
    );
  }, [unassignedStudents, unassignedSearch]);
  const tytData = useMemo(() => toChartData(exams.filter((e) => e.exam_type === 'TYT')), [exams]);
  const aytData = useMemo(() => toChartData(exams.filter((e) => e.exam_type === 'AYT')), [exams]);
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const filteredTasksByDay = useMemo(() => {
    return tasks.filter((t) =>
      isSameIsoDay(t.task_date ?? t.created_at, activeDateIso)
    );
  }, [tasks, activeDateIso]);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUnassignedId) {
      toast.warning('Lütfen listeden bir öğrenci seçin');
      return;
    }
    setSavingStudent(true);
    try {
      const target = unassignedStudents.find((s) => s.id === selectedUnassignedId);
      if (!target) {
        toast.error('Öğrenci bulunamadı');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ coach_id: coachId })
        .eq('id', target.id);

      if (error) throw error;

      toast.success('Öğrenci başarıyla eklendi', target.full_name);
      setSelectedUnassignedId('');
      setAddingStudent(false);
      setUnassignedSearch('');
      await Promise.all([reloadStudents(), loadUnassignedStudents()]);
      if (!selectedId) {
        setSelectedId(target.id);
      }
      router.refresh();
    } catch (err: any) {
      toast.error('Öğrenci eklenemedi', err?.message);
    } finally {
      setSavingStudent(false);
    }
  }

  function openAddTask() {
    setAddingTask(true);
    setEditingId(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDate(activeDateIso);
  }

  function cancelAddTask() {
    setAddingTask(false);
    setTaskTitle('');
    setTaskDesc('');
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    if (!taskTitle.trim()) {
      toast.warning('Lütfen görev başlığı girin');
      return;
    }
    setSavingTask(true);
    try {
      const payload = {
        student_id: selectedId,
        coach_id: coachId,
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        task_date: taskDate,
        is_completed: false,
      };
      const { error, data } = await supabase
        .from('tasks')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      setTasks((cur) => [data as unknown as Task, ...cur]);
      toast.success('Görev başarıyla eklendi');
      cancelAddTask();
      router.refresh();
    } catch (err: any) {
      toast.error('Görev eklenemedi', err?.message);
    } finally {
      setSavingTask(false);
    }
  }

  function startEdit(t: Task) {
    setEditingId(t.id);
    setAddingTask(false);
    setEditTitle(t.title);
    setEditDesc(t.description || '');
    setEditDate(t.task_date || new Date(t.created_at).toISOString().slice(0, 10));
    setEditCompleted(t.is_completed);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditDesc('');
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    if (!editTitle.trim()) {
      toast.warning('Lütfen görev başlığı girin');
      return;
    }
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editTitle.trim(),
          description: editDesc.trim() || null,
          task_date: editDate,
          is_completed: editCompleted,
        })
        .eq('id', editingId);
      if (error) throw error;
      setTasks((cur) =>
        cur.map((t) =>
          t.id === editingId
            ? {
                ...t,
                title: editTitle.trim(),
                description: editDesc.trim() || null,
                task_date: editDate,
                is_completed: editCompleted,
              }
            : t
        )
      );
      toast.success('Görev güncellendi');
      cancelEdit();
      router.refresh();
    } catch (err: any) {
      toast.error('Görev güncellenemedi', err?.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDeleteTask() {
    if (!delTaskId) return;
    setDeletingId(delTaskId);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', delTaskId);
      if (error) throw error;
      setTasks((cur) => cur.filter((t) => t.id !== delTaskId));
      toast.success('Görev silindi');
      router.refresh();
    } catch (err: any) {
      toast.error('Görev silinemedi', err?.message);
    } finally {
      setDeletingId(null);
      setDelTaskId(null);
    }
  }

  async function toggleTask(t: Task) {
    if (togglingId) return;
    setTogglingId(t.id);
    try {
      const next = !t.is_completed;
      const { error } = await supabase.from('tasks').update({ is_completed: next }).eq('id', t.id);
      if (error) throw error;
      setTasks((cur) => cur.map((x) => (x.id === t.id ? { ...x, is_completed: next } : x)));
    } catch (err: any) {
      toast.error('Durum güncellenemedi', err?.message);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-sky-50/40 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hoş Geldin */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-emerald-100/50 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> KOÇ PANELİ
              </div>
              <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
                Hoş geldin, <span className="text-sky-600">{coachName}</span>
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl text-sm sm:text-base">
                Soldaki listeden bir öğrenci seç. Deneme grafiklerini izle, görev ata ve öğrencinin
                gelişimini yönet.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white">
                <Briefcase className="w-7 h-7" strokeWidth={2.2} />
              </div>
              <div>
                <p className="font-bold text-slate-900 leading-tight">{coachName}</p>
                <p className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {students.length} aktif öğrenci
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[340px_1fr] gap-5 items-start">
          {/* Sol: Öğrenci Listesi + Ekleme */}
          <aside className="sticky top-[88px] space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-sky-600" />
                  Öğrencilerim
                </h3>
                <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  {students.length}
                </span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const next = !addingStudent;
                  setAddingStudent(next);
                  setSelectedUnassignedId('');
                  setUnassignedSearch('');
                  if (next) {
                    await loadUnassignedStudents();
                  }
                }}
                className={cn(
                  'w-full mb-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition',
                  addingStudent
                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-gradient-to-r from-sky-600 to-emerald-600 text-white shadow-sm hover:shadow-md hover:from-sky-700 hover:to-emerald-700'
                )}
              >
                {addingStudent ? (
                  <>
                    <X className="w-4 h-4" />
                    İptal
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Öğrenci Ekle
                  </>
                )}
              </button>

              {addingStudent && (
                <form onSubmit={handleAddStudent} className="mb-4 rounded-2xl border border-sky-200 bg-sky-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-sky-600" />
                    <h4 className="font-semibold text-sm text-slate-800">
                      Listeden öğrenci seç
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sisteme kayıtlı, rolü öğrenci olan ve henüz hiçbir koça atanmamış
                    kullanıcılar aşağıda listelenir. Birini seçip &quot;Öğrenciyi Ekle&quot;ye basın.
                  </p>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={unassignedSearch}
                      onChange={(e) => setUnassignedSearch(e.target.value)}
                      placeholder="Listede ara..."
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                    {loadingUnassigned ? (
                      <div className="py-10">
                        <div className="h-8 w-3/4 mx-auto bg-slate-100 rounded animate-pulse mb-2" />
                        <div className="h-8 w-2/3 mx-auto bg-slate-100 rounded animate-pulse" />
                      </div>
                    ) : filteredUnassigned.length === 0 ? (
                      <div className="py-8 px-3 text-center">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">
                          {unassignedStudents.length === 0
                            ? 'Bekleyen öğrenci yok'
                            : 'Eşleşen öğrenci yok'}
                        </p>
                      </div>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {filteredUnassigned.map((s) => {
                          const chosen = s.id === selectedUnassignedId;
                          return (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedUnassignedId(s.id)}
                                className={cn(
                                  'w-full text-left flex items-center gap-3 px-3 py-2.5 transition',
                                  chosen
                                    ? 'bg-sky-100/70 ring-1 ring-sky-300'
                                    : 'hover:bg-slate-50'
                                )}
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                                  {s.full_name
                                    .split(' ')
                                    .filter(Boolean)
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('') || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate">
                                    {s.full_name}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">{s.email || '—'}</p>
                                </div>
                                {chosen && (
                                  <CheckCircle2 className="w-4.5 h-4.5 text-sky-600 flex-shrink-0" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={savingStudent || !selectedUnassignedId}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    <Plus className="w-4 h-4" />
                    {savingStudent ? 'Ekleniyor...' : 'Öğrenciyi Ekle'}
                  </button>
                </form>
              )}

              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="İsim / e-posta ara..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
              </div>

              {loadingStudents ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    {students.length === 0 ? 'Henüz öğrencin yok' : 'Eşleşen öğrenci yok'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {students.length === 0
                      ? 'Yukarıdan öğrenci eklemeyi dene.'
                      : 'Farklı bir arama yap.'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filtered.map((s) => {
                    const active = s.id === selectedId;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className={cn(
                            'w-full text-left rounded-2xl border p-3.5 transition-all flex items-center gap-3',
                            active
                              ? 'bg-gradient-to-r from-sky-50 to-emerald-50 border-sky-200 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                          )}
                        >
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white',
                              active
                                ? 'bg-gradient-to-br from-sky-500 to-emerald-500'
                                : 'bg-slate-200 text-slate-600'
                            )}
                          >
                            {s.full_name
                              .split(' ')
                              .filter(Boolean)
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('') || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-slate-800 text-sm leading-tight truncate">
                                {s.full_name}
                              </p>
                              <ChevronRight
                                className={cn(
                                  'w-4 h-4 flex-shrink-0 transition',
                                  active && 'text-sky-600 translate-x-0.5'
                                )}
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {s.email || '—'}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* Sağ: Öğrenci Detayı */}
          <main className="space-y-5 min-w-0">
            {!selectedStudent ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 sm:p-14 text-center shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white flex items-center justify-center mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="font-extrabold text-2xl text-slate-900">
                  {students.length === 0 ? 'Önce öğrenci ekle' : 'Bir öğrenci seç'}
                </h2>
                <p className="mt-2 text-slate-500 max-w-md mx-auto">
                  {students.length === 0
                    ? 'Soldaki panelden öğrenci ekleyin veya listeden bir öğrenci seçin.'
                    : 'Soldaki listeden bir öğrenci seçerek görevleri ve deneme grafiğini yönetin.'}
                </p>
              </div>
            ) : (
              <>
                {/* Öğrenci Başlığı + İstatistik */}
                <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl">
                        {selectedStudent.full_name
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('') || '?'}
                      </div>
                      <div>
                        <h2 className="font-extrabold text-2xl text-slate-900">
                          {selectedStudent.full_name}
                        </h2>
                        {selectedStudent.email && (
                          <p className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedStudent.email}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Target className="w-3.5 h-3.5" />
                            {totalTasks} toplam görev
                          </span>
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {completedTasks} tamamlanan · %{taskProgress}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5" />
                            {exams.length} deneme
                          </span>
                        </div>
                        {totalTasks > 0 && (
                          <div className="mt-3 h-2 w-full max-w-md rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
                              style={{ width: `${taskProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openAddTask}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-semibold text-sm shadow-sm hover:shadow-md hover:from-sky-700 hover:to-emerald-700 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Yeni Görev Ekle
                    </button>
                  </div>
                </section>

                {/* Yeni Görev Formu */}
                {addingTask && (
                  <section className="rounded-3xl border-2 border-sky-200 bg-sky-50/40 p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Plus className="w-4.5 h-4.5 text-sky-600" />
                        {selectedStudent.full_name} · Yeni Görev Ekle
                      </h3>
                      <button
                        type="button"
                        onClick={cancelAddTask}
                        className="w-8 h-8 rounded-lg text-slate-500 hover:bg-white hover:text-slate-700 transition flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <form onSubmit={submitTask} className="grid sm:grid-cols-1 gap-3 items-end">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Görev Başlığı *
                          </label>
                          <input
                            type="text"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="örn: TYT Matematik - Türev 30 soru çöz"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Açıklama
                          </label>
                          <input
                            type="text"
                            value={taskDesc}
                            onChange={(e) => setTaskDesc(e.target.value)}
                            placeholder="Ekstra detaylar, kaynak önerileri (opsiyonel)"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">
                            Gün (Kayan Pencere)
                          </label>
                          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-slate-200">
                            {rollingDays.map((d) => {
                              const active = d.dateIso === taskDate;
                              return (
                                <button
                                  key={d.key}
                                  type="button"
                                  onClick={() => setTaskDate(d.dateIso)}
                                  className={cn(
                                    'flex-shrink-0 min-w-[110px] px-3 py-2.5 rounded-xl text-xs font-semibold transition border text-center',
                                    active
                                      ? 'bg-gradient-to-br from-sky-600 to-emerald-600 text-white border-transparent shadow'
                                      : d.isToday
                                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:text-sky-700'
                                  )}
                                >
                                  <div className="leading-tight">{d.dateLabel}</div>
                                  <div className={cn(
                                    'text-[10px] mt-1 font-medium',
                                    active ? 'text-white/90' : d.isToday ? 'text-amber-700' : 'text-slate-500'
                                  )}>
                                    {d.isToday ? 'BUGÜN' : d.dayLabel}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Tarih
                          </label>
                          <input
                            type="date"
                            value={taskDate}
                            onChange={(e) => setTaskDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={savingTask}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-60 transition"
                        >
                          <BookOpen className="w-4 h-4" />
                          {savingTask ? 'Kaydediliyor...' : 'Görevi Kaydet'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {/* Silme Onayı */}
                {delTaskId && (
                  <section className="rounded-3xl border-2 border-orange-200 bg-orange-50 p-5 sm:p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-1">
                      Görevi silmek istediğine emin misin?
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Bu işlem geri alınamaz. Görev öğrencinin listesinden de kaldırılır.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={confirmDeleteTask}
                        disabled={!!deletingId}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-semibold text-sm hover:bg-orange-700 disabled:opacity-60 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingId ? 'Siliniyor...' : 'Evet, sil'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDelTaskId(null)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition"
                      >
                        İptal
                      </button>
                    </div>
                  </section>
                )}

                {/* Görevler Listesi */}
                <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                      <Target className="w-4.5 h-4.5 text-sky-600" />
                      {selectedStudent.full_name} · Günlük Program
                    </h3>
                    {!addingTask && (
                      <button
                        type="button"
                        onClick={openAddTask}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100 hover:bg-sky-100 transition self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ekle
                      </button>
                    )}
                  </div>

                  <div className="mb-4 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {rollingDays.map((d) => {
                      const active = d.dateIso === activeDateIso;
                      const dayTasks = tasks.filter((t) =>
                        isSameIsoDay(t.task_date ?? t.created_at, d.dateIso)
                      );
                      const done = dayTasks.filter((t) => t.is_completed).length;
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => setActiveDateIso(d.dateIso)}
                          className={cn(
                            'flex-shrink-0 min-w-[130px] px-3 py-3 rounded-2xl text-xs font-semibold transition flex flex-col items-start gap-1.5 border',
                            active
                              ? 'bg-gradient-to-br from-emerald-500 to-sky-500 text-white border-transparent shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-300'
                              : d.isToday
                                ? 'bg-amber-50/80 text-amber-900 border-amber-300 hover:bg-amber-100/80 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-slate-50 shadow-sm'
                          )}
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-sm font-extrabold leading-none">
                              {d.dateLabel.split(' ')[0]}
                            </span>
                            <span
                              className={cn(
                                'inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-full text-[10px] font-bold',
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
                            'flex items-end justify-between w-full gap-2',
                            active ? 'text-white/95' : d.isToday ? 'text-amber-800' : 'text-slate-600'
                          )}>
                            <div className="flex flex-col items-start leading-tight">
                              <span className="text-[11px] font-semibold">
                                {d.dateLabel.split(' ').slice(1).join(' ')}
                              </span>
                              <span className={cn(
                                'text-[10px] font-bold mt-0.5 uppercase tracking-wide',
                                active ? 'text-white/80' : d.isToday ? 'text-amber-700' : 'text-slate-500'
                              )}>
                                {d.isToday ? '· BUGÜN ·' : d.dayLabel}
                              </span>
                            </div>
                            {dayTasks.length > 0 && (
                              <div className="text-[9px] font-bold leading-none px-1.5 py-0.5 rounded-md bg-black/10">
                                %{dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {loadingDetail && tasks.length === 0 ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                      ))}
                    </div>
                  ) : filteredTasksByDay.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                      <Target className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="font-semibold text-slate-700">
                        {rollingDays.find((d) => d.dateIso === activeDateIso)?.fullLabel ?? 'Seçili gün'} için henüz görev yok
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Yukarıdaki &quot;Ekle&quot; butonu ile bu güne ilk görevi oluşturun.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {filteredTasksByDay.map((t) => {
                        if (editingId === t.id) {
                          return (
                            <li
                              key={t.id}
                              className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-4"
                            >
                              <form onSubmit={saveEdit} className="space-y-3">
                                <div className="grid sm:grid-cols-[1fr_180px] gap-3">
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="Görev başlığı"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                                  />
                                  <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                                  placeholder="Açıklama (opsiyonel)"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                                />
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700 select-none">
                                  <input
                                    type="checkbox"
                                    checked={editCompleted}
                                    onChange={(e) => setEditCompleted(e.target.checked)}
                                    className="w-4 h-4 rounded text-sky-600"
                                  />
                                  Tamamlandı olarak işaretle
                                </label>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 disabled:opacity-60 transition"
                                  >
                                    <Save className="w-4 h-4" />
                                    {savingEdit ? 'Kaydediliyor...' : 'Kaydet'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition"
                                  >
                                    <X className="w-4 h-4" />
                                    İptal
                                  </button>
                                </div>
                              </form>
                            </li>
                          );
                        }
                        return (
                          <li
                            key={t.id}
                            className={cn(
                              'rounded-2xl border p-4 transition-all group',
                              t.is_completed
                                ? 'border-emerald-200 bg-emerald-50/50'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                            )}
                          >
                            <div className="flex items-start gap-3.5">
                              <button
                                type="button"
                                onClick={() => toggleTask(t)}
                                disabled={togglingId === t.id}
                                className={cn(
                                  'mt-0.5 flex-shrink-0 transition',
                                  t.is_completed
                                    ? 'text-emerald-600'
                                    : 'text-slate-400 hover:text-emerald-500'
                                )}
                              >
                                {t.is_completed ? (
                                  <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
                                ) : (
                                  <Circle className="w-6 h-6" strokeWidth={2.5} />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h4
                                    className={cn(
                                      'font-semibold',
                                      t.is_completed && 'text-slate-500 line-through'
                                    )}
                                  >
                                    {t.title}
                                  </h4>
                                  <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 mr-1">
                                      <CalendarDays className="w-3 h-3" />
                                      {formatDate(t.task_date || t.created_at)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => startEdit(t)}
                                      className="w-8 h-8 rounded-lg text-slate-500 hover:bg-sky-50 hover:text-sky-600 transition inline-flex items-center justify-center"
                                      title="Düzenle"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDelTaskId(t.id)}
                                      className="w-8 h-8 rounded-lg text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition inline-flex items-center justify-center"
                                      title="Sil"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                {t.description && (
                                  <p
                                    className={cn(
                                      'mt-1.5 text-sm leading-relaxed',
                                      t.is_completed && 'text-slate-400 line-through'
                                    )}
                                  >
                                    {t.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                {/* Deneme Grafikleri */}
                <div className="grid lg:grid-cols-2 gap-5">
                  <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        TYT Gelişim Grafiği
                      </h3>
                      <span className="text-xs text-slate-500">{tytData.length} deneme</span>
                    </div>
                    <div className="h-72">
                      {tytData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500">
                          Henüz TYT denemesi yok.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={tytData}
                            margin={{ top: 10, right: 12, left: -8, bottom: 0 }}
                          >
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                              }}
                              labelStyle={{ fontWeight: 600 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line
                              type="monotone"
                              dataKey="net"
                              name="TYT Net"
                              stroke="#10b981"
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        AYT Gelişim Grafiği
                      </h3>
                      <span className="text-xs text-slate-500">{aytData.length} deneme</span>
                    </div>
                    <div className="h-72">
                      {aytData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-slate-500">
                          Henüz AYT denemesi yok.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={aytData}
                            margin={{ top: 10, right: 12, left: -8, bottom: 0 }}
                          >
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                              }}
                              labelStyle={{ fontWeight: 600 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line
                              type="monotone"
                              dataKey="net"
                              name="AYT Net"
                              stroke="#0ea5e9"
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </section>
                </div>

                {/* Görüşme Yönetimi */}
                <MeetingCard
                  meetings={meetings}
                  mode="coach"
                  studentId={selectedStudent.id}
                  coachId={coachId}
                  students={students.map((s) => ({
                    ...s,
                    role: 'student' as const,
                    created_at: (s as any).created_at ?? new Date().toISOString(),
                    updated_at: (s as any).updated_at ?? new Date().toISOString(),
                    phone: (s as any).phone ?? null,
                    target_university: (s as any).target_university ?? null,
                    target_department: (s as any).target_department ?? null,
                  }))}
                  loading={loadingDetail}
                  onMutation={() => loadStudentDetail(selectedStudent.id)}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
