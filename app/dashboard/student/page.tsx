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
  GraduationCap,
  CheckCircle2,
  Circle,
  CalendarDays,
  Award,
  BarChart3,
  Target,
  ListTodo,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

export const dynamic = 'force-dynamic';

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

export default function StudentDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Öğrenci');
  const [userId, setUserId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [examType, setExamType] = useState<'TYT' | 'AYT'>('TYT');
  const [examNet, setExamNet] = useState('');
  const [savingExam, setSavingExam] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (uErr || !user) {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle();
      setUserName(profile?.full_name || user.email?.split('@')[0] || 'Öğrenci');

      const [{ data: t }, { data: e }] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, description, task_date, is_completed, created_at')
          .eq('student_id', user.id)
          .order('task_date', { ascending: false }),
        supabase
          .from('exam_results')
          .select('id, exam_type, exam_date, net_score')
          .eq('student_id', user.id)
          .order('exam_date', { ascending: false }),
      ]);
      setTasks((t as Task[]) ?? []);
      setExams((e as Exam[]) ?? []);
    } catch (err: any) {
      toast.error('Veriler yüklenemedi', err?.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleTask(task: Task) {
    if (!userId || togglingId) return;
    setTogglingId(task.id);
    try {
      const next = !task.is_completed;
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: next })
        .eq('id', task.id);
      if (error) throw error;
      setTasks((cur) =>
        cur.map((t) => (t.id === task.id ? { ...t, is_completed: next } : t))
      );
      toast.success(next ? 'Görev tamamlandı 🎉' : 'Görev geri alındı');
    } catch (err: any) {
      toast.error('Durum güncellenemedi', err?.message);
    } finally {
      setTogglingId(null);
    }
  }

  async function addExam(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const net = Number(examNet);
    if (!examDate || isNaN(net) || net < 0) {
      toast.error('Lütfen geçerli bir tarih ve net girin');
      return;
    }
    setSavingExam(true);
    try {
      const { error } = await supabase.from('exam_results').insert([
        {
          student_id: userId,
          exam_type: examType,
          exam_date: examDate,
          net_score: net,
        },
      ]);
      if (error) throw error;
      toast.success('Deneme başarıyla eklendi');
      setExamNet('');
      setExamDate(new Date().toISOString().slice(0, 10));
      await loadAll();
      router.refresh();
    } catch (err: any) {
      toast.error('Deneme eklenemedi', err?.message);
    } finally {
      setSavingExam(false);
    }
  }

  const completed = tasks.filter((t) => t.is_completed).length;
  const tytData = useMemo(() => toChartData(exams.filter((e) => e.exam_type === 'TYT')), [exams]);
  const aytData = useMemo(() => toChartData(exams.filter((e) => e.exam_type === 'AYT')), [exams]);
  const avg = exams.length
    ? (exams.reduce((s, r) => s + Number(r.net_score ?? 0), 0) / exams.length).toFixed(1)
    : '—';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-sky-100/60 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> ÖĞRENCİ PANELİ
              </div>
              <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
                Hoş geldin,{' '}
                <span className="text-emerald-600">{userName}</span>
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl text-sm sm:text-base">
                Aşağıda koçunun atadığı görevleri ve deneme grafiğini görebilirsin.
                Başarılar dileriz!
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white">
                <GraduationCap className="w-7 h-7" strokeWidth={2.2} />
              </div>
              <div>
                <p className="font-bold text-slate-900 leading-tight">{userName}</p>
                <p className="text-xs text-slate-500 mt-0.5">Öğrenci</p>
              </div>
            </div>
          </div>
          <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Toplam Görev', value: tasks.length, icon: ListTodo, tone: 'from-sky-500 to-sky-600' },
              { label: 'Tamamlanan', value: completed, icon: CheckCircle2, tone: 'from-emerald-500 to-emerald-600' },
              { label: 'Deneme Sayısı', value: exams.length, icon: BarChart3, tone: 'from-orange-500 to-orange-600' },
              { label: 'Ortalama Net', value: avg, icon: Award, tone: 'from-indigo-500 to-violet-600' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.tone} text-white flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{s.label}</p>
                  <p className="font-extrabold text-2xl text-slate-900 leading-tight mt-1">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DENEME EKLEME FORMU (INLINE) */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">Yeni Deneme Ekle</h2>
              <p className="text-xs text-slate-500">Girdiğin her deneme grafiğine işlenir.</p>
            </div>
          </div>
          <form onSubmit={addExam} className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tarih</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sınav Tipi</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as 'TYT' | 'AYT')}
                className="w-full min-w-[140px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              >
                <option value="TYT">TYT</option>
                <option value="AYT">AYT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Net Skoru</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="örn. 85.5"
                value={examNet}
                onChange={(e) => setExamNet(e.target.value)}
                required
                className="w-full min-w-[140px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={savingExam}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-semibold text-sm shadow-sm hover:shadow-md hover:from-emerald-700 hover:to-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              <BookOpen className="w-4 h-4" />
              {savingExam ? 'Kaydediliyor...' : 'Denemeyi Kaydet'}
            </button>
          </form>
        </section>

        {/* GÖREVLER */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <Target className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">Görevlerim</h2>
                <p className="text-xs text-slate-500">
                  Sadece tamamlandı olarak işaretleyebilirsin. Ekleme, silme veya düzenleme yetkin yok.
                </p>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <ListTodo className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Henüz görev atanmamış</p>
              <p className="text-sm text-slate-500 mt-1">
                Koçun sana görev atadığında burada listelenecek.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className={`group rounded-2xl border p-4 sm:p-4.5 transition-all ${
                    t.is_completed
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => toggleTask(t)}
                      disabled={togglingId === t.id}
                      className={`mt-0.5 flex-shrink-0 transition ${
                        t.is_completed ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500'
                      }`}
                      aria-label={t.is_completed ? 'Geri al' : 'Tamamlandı olarak işaretle'}
                    >
                      {t.is_completed ? (
                        <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
                      ) : (
                        <Circle className="w-6 h-6" strokeWidth={2.5} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className={`font-semibold ${t.is_completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          {t.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(t.task_date || t.created_at)}
                        </span>
                      </div>
                      {t.description && (
                        <p className={`mt-1.5 text-sm leading-relaxed ${t.is_completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                          {t.description}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* GRAFIKLER */}
        <div className="grid lg:grid-cols-2 gap-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                TYT Gelişim Grafiği
              </h2>
              <span className="text-xs text-slate-500">{tytData.length} deneme</span>
            </div>
            <div className="h-72">
              {tytData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  Henüz TYT denemesi eklenmemiş.
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
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                AYT Gelişim Grafiği
              </h2>
              <span className="text-xs text-slate-500">{aytData.length} deneme</span>
            </div>
            <div className="h-72">
              {aytData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  Henüz AYT denemesi eklenmemiş.
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
      </div>
    </div>
  );
}
