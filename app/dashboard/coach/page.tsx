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
  Pencil,
  Save,
  X,
  CheckCircle2,
  Circle,
  CalendarDays,
  Calendar,
  BarChart3,
  Search,
  Target,
  Sparkles,
  BookOpen,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Student = {
  id: string;
  full_name: string;
  coach_id: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  task_date: string;
  is_completed: boolean;
  created_at: string;
};

type Exam = {
  id: string;
  exam_type: 'TYT' | 'AYT';
  exam_date: string;
  net_score: number;
};

type Meeting = {
  id: string;
  meeting_date: string;
  duration_minutes: number;
  meeting_url: string | null;
  notes: string | null;
  status?: string | null;
};

function toChartData(list: Exam[]) {
  return [...list]
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
    .map((r) => ({
      date: new Date(r.exam_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
      net: Number(r.net_score ?? 0),
      label: `${(r.net_score ?? 0).toFixed(1)} net`,
    }));
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

export default function CoachDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState('Koç');

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [savingTask, setSavingTask] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCompleted, setEditCompleted] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [delTaskId, setDelTaskId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('19:00');
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [savingMeeting, setSavingMeeting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function loadCoachAndStudents() {
    try {
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (uErr || !user) {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return;
      }
      setCoachId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle();
      setCoachName(profile?.full_name || user.email?.split('@')[0] || 'Koç');

      if (profile?.role !== 'coach') {
        if (typeof window !== 'undefined') window.location.href = '/dashboard/student';
        return;
      }

      const { data: studs } = await supabase
        .from('profiles')
        .select('id, full_name, coach_id')
        .eq('coach_id', user.id)
        .eq('role', 'student')
        .order('full_name', { ascending: true, nullsFirst: false });

      const list: Student[] = ((studs ?? []) as any[]).map((s) => ({
        id: s.id,
        full_name: s.full_name || 'İsimsiz Öğrenci',
        coach_id: s.coach_id,
      }));
      setStudents(list);
      if (list.length > 0 && !list.find((s) => s.id === selectedId)) {
        setSelectedId(list[0].id);
      }
    } catch (err: any) {
      toast.error('Öğrenciler alınamadı', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSelected() {
    if (!selectedId) {
      setTasks([]);
      setExams([]);
      setMeetings([]);
      return;
    }
    try {
      const [{ data: t }, { data: e }, { data: m }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('student_id', selectedId)
          .order('task_date', { ascending: false }),
        supabase
          .from('exam_results')
          .select('*')
          .eq('student_id', selectedId)
          .order('exam_date', { ascending: false }),
        supabase
          .from('meetings')
          .select('*')
          .eq('student_id', selectedId)
          .order('meeting_date', { ascending: false }),
      ]);
      setTasks((t as Task[]) ?? []);
      setExams((e as Exam[]) ?? []);
      setMeetings((m as Meeting[]) ?? []);
    } catch (err: any) {
      toast.error('Öğrenci verileri alınamadı', err?.message);
    }
  }

  useEffect(() => {
    loadCoachAndStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSelected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.full_name.toLowerCase().includes(q));
  }, [students, query]);

  const selectedStudent = students.find((s) => s.id === selectedId) ?? null;
  const tytData = useMemo(() => toChartData(exams.filter((e) => e.exam_type === 'TYT')), [exams]);
  const aytData = useMemo(() => toChartData(exams.filter((e) => e.exam_type === 'AYT')), [exams]);
  const completed = tasks.filter((t) => t.is_completed).length;

  function openAddForm() {
    setAdding(true);
    setEditingId(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDate(new Date().toISOString().slice(0, 10));
  }

  function cancelAdd() {
    setAdding(false);
    setTaskTitle('');
    setTaskDesc('');
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !coachId) return;
    if (!taskTitle.trim()) {
      toast.error('Lütfen görev başlığı girin');
      return;
    }
    setSavingTask(true);
    try {
      const payload: any = {
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
      setTasks((cur) => [(data as unknown) as Task, ...cur]);
      toast.success('Görev başarıyla eklendi');
      cancelAdd();
      router.refresh();
    } catch (err: any) {
      toast.error('Görev eklenemedi', err?.message);
    } finally {
      setSavingTask(false);
    }
  }

  function startEdit(t: Task) {
    setEditingId(t.id);
    setAdding(false);
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
      toast.error('Lütfen görev başlığı girin');
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
            ? { ...t, title: editTitle.trim(), description: editDesc.trim() || null, task_date: editDate, is_completed: editCompleted }
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

  async function confirmDelete() {
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
    if (!selectedId || togglingId) return;
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

  async function saveMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !coachId) return;
    if (!meetingDate || !meetingTime) {
      toast.error('Lütfen tarih ve saat girin');
      return;
    }
    setSavingMeeting(true);
    try {
      const full = new Date(`${meetingDate}T${meetingTime}:00`).toISOString();
      const { error } = await supabase.from('meetings').insert([
        {
          student_id: selectedId,
          coach_id: coachId,
          meeting_date: full,
          duration_minutes: Number(meetingDuration),
          meeting_url: meetingUrl.trim() || null,
          notes: meetingNotes.trim() || null,
          status: 'scheduled',
        },
      ]);
      if (error) throw error;
      toast.success('Görüşme kaydedildi');
      setMeetingUrl('');
      setMeetingNotes('');
      await loadSelected();
      router.refresh();
    } catch (err: any) {
      toast.error('Görüşme kaydedilemedi', err?.message);
    } finally {
      setSavingMeeting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-sky-50/40 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-emerald-100/50 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> KOÇ PANELİ
              </div>
              <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
                Hoş geldin,{' '}
                <span className="text-sky-600">{coachName}</span>
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl text-sm sm:text-base">
                Soldaki listeden bir öğrenci seçerek programını, görevlerini ve deneme grafiğini yönetebilirsin.
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

        <div className="grid lg:grid-cols-[320px_1fr] gap-5 items-start">
          {/* Öğrenci Listesi */}
          <aside className="sticky top-[88px]">
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
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Öğrenci ara..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Öğrenci bulunamadı</p>
                  <p className="text-xs text-slate-500 mt-1">Sisteme öğrenci eklenmesini bekle.</p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {filtered.map((s) => {
                    const active = s.id === selectedId;
                    const prog = tasks.length
                      ? Math.round((tasks.filter((t) => t.is_completed).length / tasks.length) * 100)
                      : 0;
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
                                className={cn('w-4 h-4 flex-shrink-0 transition', active && 'text-sky-600 translate-x-0.5')}
                              />
                            </div>
                            {active && tasks.length > 0 && (
                              <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                                  style={{ width: `${prog}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* Sağ İçerik */}
          <main className="space-y-5 min-w-0">
            {!selectedStudent ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 sm:p-14 text-center shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white flex items-center justify-center mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="font-extrabold text-2xl text-slate-900">Bir öğrenci seç</h2>
                <p className="mt-2 text-slate-500 max-w-md mx-auto">
                  Soldaki listeden bir öğrenci seçerek görev CRUD, görüşme takvimi ve deneme grafiğini yönet.
                </p>
              </div>
            ) : (
              <>
                {/* Öğrenci Başlığı */}
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
                        <h2 className="font-extrabold text-2xl text-slate-900">{selectedStudent.full_name}</h2>
                        <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Target className="w-3.5 h-3.5" />
                            {tasks.length} toplam görev
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {completed} tamamlanan
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5" />
                            {exams.length} deneme
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openAddForm}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-semibold text-sm shadow-sm hover:shadow-md hover:from-sky-700 hover:to-emerald-700 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Yeni Görev Ekle
                    </button>
                  </div>
                </section>

                {/* Görüşme Planla */}
                <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Calendar className="w-4.5 h-4.5 text-orange-500" />
                    Haftalık Görüşmeyi Planla
                  </h3>
                  <form onSubmit={saveMeeting} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tarih</label>
                      <input
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Saat</label>
                      <input
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Süre (dk)</label>
                      <select
                        value={meetingDuration}
                        onChange={(e) => setMeetingDuration(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                      >
                        {[30, 45, 60, 75, 90, 120].map((m) => (
                          <option key={m} value={m}>{m} dk</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={savingMeeting}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm shadow-sm hover:shadow-md hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 transition"
                    >
                      <Clock className="w-4 h-4" />
                      {savingMeeting ? 'Kaydediliyor...' : 'Görüşmeyi Kaydet'}
                    </button>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Görüşme Linki (Zoom vb.)</label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/..."
                        value={meetingUrl}
                        onChange={(e) => setMeetingUrl(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notlar</label>
                      <input
                        type="text"
                        placeholder="Haftalık genel durum, konular vs."
                        value={meetingNotes}
                        onChange={(e) => setMeetingNotes(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                      />
                    </div>
                  </form>
                  {meetings.length > 0 && (
                    <div className="mt-5 space-y-2">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Son Görüşmeler
                      </h4>
                      {meetings.slice(0, 3).map((m) => (
                        <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-800 inline-flex items-center gap-1.5">
                              <CalendarDays className="w-4 h-4 text-sky-600" />
                              {formatDate(m.meeting_date)} •{' '}
                              {new Date(m.meeting_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {m.duration_minutes} dk {m.status ? `· ${m.status}` : ''}
                              {m.notes ? `· ${m.notes}` : ''}
                            </p>
                          </div>
                          {m.meeting_url && (
                            <a
                              href={m.meeting_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 transition"
                            >
                              Görüşmeye Git →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Yeni Görev Formu */}
                {adding && (
                  <section className="rounded-3xl border-2 border-sky-200 bg-sky-50/40 p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Plus className="w-4.5 h-4.5 text-sky-600" />
                        Yeni Görev Ekle
                      </h3>
                      <button
                        type="button"
                        onClick={cancelAdd}
                        className="w-8 h-8 rounded-lg text-slate-500 hover:bg-white hover:text-slate-700 transition flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <form onSubmit={submitTask} className="grid sm:grid-cols-[1fr_180px] gap-3 items-end">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Görev Başlığı *</label>
                          <input
                            type="text"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="örn: TYT Matematik 30 soru çöz"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Açıklama</label>
                          <input
                            type="text"
                            value={taskDesc}
                            onChange={(e) => setTaskDesc(e.target.value)}
                            placeholder="Ekstra detaylar (opsiyonel)"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tarih</label>
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
                    <h3 className="font-bold text-slate-900 mb-1">Görevi silmek istediğine emin misin?</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Bu işlem geri alınamaz. İlgili görev öğrenci listesinden de kaldırılacaktır.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={confirmDelete}
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
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                      <Target className="w-4.5 h-4.5 text-sky-600" />
                      {selectedStudent.full_name} · Görevleri
                    </h3>
                    {!adding && (
                      <button
                        type="button"
                        onClick={openAddForm}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100 hover:bg-sky-100 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Ekle
                      </button>
                    )}
                  </div>
                  {tasks.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                      <Target className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="font-semibold text-slate-700">Henüz görev yok</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Yukarıdaki &ldquo;Yeni Görev Ekle&rdquo; butonuyla ilk görevi oluştur.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {tasks.map((t) => {
                        if (editingId === t.id) {
                          return (
                            <li key={t.id} className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-4">
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
                                  t.is_completed ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500'
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
                                  <h4 className={cn('font-semibold', t.is_completed && 'text-slate-500 line-through')}>
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
                                  <p className={cn('mt-1.5 text-sm leading-relaxed', t.is_completed && 'text-slate-400 line-through')}>
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
                          <LineChart data={tytData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
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
                          <LineChart data={aytData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
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
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
