'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton, ListSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ExamLineChart } from '@/components/rbac/ExamLineChart';
import { StudentTasks } from '@/components/rbac/StudentTasks';
import { ExamAddForm } from '@/components/rbac/ExamAddForm';
import { MeetingCard } from '@/components/rbac/MeetingCard';
import { createClient } from '@/lib/supabase/client';
import type { DailyTask, ExamResult, Meeting, Student } from '@/lib/types';
import {
  Users,
  Briefcase,
  GraduationCap,
  Target,
  Award,
  Sparkles,
  ChevronRight,
  UserRound,
  Mail,
  Phone,
  Building2,
  BarChart3,
  Search,
  Plus,
  FileText,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DataMap = {
  [studentId: string]: {
    tasks: DailyTask[];
    results: ExamResult[];
    meetings: Meeting[];
  };
};

interface Props {
  coachId: string;
  coachName: string;
  initialStudents: Student[];
  initialDataMap: DataMap;
  loadError: boolean;
}

export function CoachDashboardClient({
  coachId,
  coachName,
  initialStudents,
  initialDataMap,
  loadError,
}: Props) {
  const supabase = createClient();
  const toast = useToast();

  const [students, setStudents] = useState<Student[]>(initialStudents ?? []);
  const [dataMap, setDataMap] = useState<DataMap>(initialDataMap ?? {});
  const [selectedId, setSelectedId] = useState<string | null>(students[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.target_department ?? '').toLowerCase().includes(q) ||
        (s.target_university ?? '').toLowerCase().includes(q)
    );
  }, [students, query]);

  const selected = useMemo(() => students.find((s) => s.id === selectedId) ?? null, [students, selectedId]);
  const selectedData = selected ? dataMap[selected.id] ?? { tasks: [], results: [], meetings: [] } : null;

  const loadStudentData = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const [{ data: t }, { data: e }, { data: m }] = await Promise.all([
          supabase.from('daily_tasks').select('*').eq('student_id', id).order('task_date', { ascending: false }),
          supabase.from('exam_results').select('*').eq('student_id', id).order('exam_date', { ascending: false }),
          supabase.from('meetings').select('*').eq('student_id', id).order('meeting_date', { ascending: false }),
        ]);
        setDataMap((cur) => ({
          ...cur,
          [id]: {
            tasks: (t as DailyTask[]) ?? [],
            results: (e as ExamResult[]) ?? [],
            meetings: (m as Meeting[]) ?? [],
          },
        }));
      } catch (err: any) {
        toast.error('Öğrenci verileri alınamadı', err?.message);
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  const refreshStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase
        .from('students')
        .select('*')
        .eq('coach_id', coachId)
        .order('full_name', { ascending: true });
      const next = (s as Student[]) ?? [];
      setStudents(next);
      if (next.length === 0) {
        setSelectedId(null);
      } else if (!next.find((x) => x.id === selectedId)) {
        setSelectedId(next[0].id);
      }
      await Promise.all(next.map((st) => loadStudentData(st.id)));
      toast.info('Öğrenci listesi yenilendi');
    } catch (err: any) {
      toast.error('Liste yenilenemedi', err?.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, coachId, selectedId, loadStudentData, toast]);

  useEffect(() => {
    if (selected && !dataMap[selected.id]) {
      loadStudentData(selected.id);
    }
  }, [selected, dataMap, loadStudentData]);

  const stats = useMemo(() => {
    const totalTasks = students.reduce(
      (sum, s) => sum + (dataMap[s.id]?.tasks.length ?? 0),
      0
    );
    const completedTasks = students.reduce((sum, s) => {
      return sum + (dataMap[s.id]?.tasks.filter((t) => t.is_completed).length ?? 0);
    }, 0);
    const totalExams = students.reduce(
      (sum, s) => sum + (dataMap[s.id]?.results.length ?? 0),
      0
    );
    const avgNet =
      totalExams > 0
        ? (
            students.reduce((sum, s) => {
              const r = dataMap[s.id]?.results ?? [];
              return sum + r.reduce((ss, x) => ss + Number(x.total_net), 0);
            }, 0) / totalExams
          ).toFixed(1)
        : '—';
    return {
      ogrenci: students.length,
      gorev: `${completedTasks} / ${totalTasks}`,
      deneme: totalExams,
      ort: avgNet,
    };
  }, [students, dataMap]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-hero-wash py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-sky-50/60 border border-slate-200 p-6 sm:p-8 shadow-soft">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="relative grid lg:grid-cols-[1fr_auto] items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="brand" size="md" className="gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Koç Paneli
                </Badge>
                <Badge variant="fire" size="md" className="gap-1.5">
                  <Briefcase className="w-3 h-3" />
                  Sigma Mentörlük
                </Badge>
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.05] text-slate-900">
                Tekrar hoş geldin,{' '}
                <span className="gradient-text">{coachName}</span>!
              </h1>
              <p className="mt-3 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                Aşağıdaki listeden bir öğrenci seçerek haftalık programını yönetebilir, deneme
                grafiklerini inceleyebilir ve bir sonraki görüşme tarihini planlayabilirsin.
              </p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
                <Briefcase className="w-8 h-8 text-white" strokeWidth={2.1} />
              </div>
              <div>
                <p className="font-display font-bold text-lg text-slate-900 leading-tight">{coachName}</p>
                <p className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {students.length} aktif öğrenci
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Öğrenci', value: stats.ogrenci, unit: 'aktif', icon: Users, tone: 'from-sky-500 to-sky-600' },
              { label: 'Tamamlanan', value: stats.gorev, unit: 'görev', icon: Target, tone: 'from-emerald-500 to-emerald-600' },
              { label: 'Toplam Deneme', value: stats.deneme, unit: 'kayıt', icon: Award, tone: 'from-orange-500 to-orange-600' },
              { label: 'Ortalama Net', value: stats.ort, unit: 'genel', icon: BarChart3, tone: 'from-indigo-500 to-violet-600' },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white border border-slate-200 p-4 flex items-start gap-3 hover:shadow-soft transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.tone} text-white flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{s.label}</p>
                  <p className="font-display font-bold text-2xl text-slate-900 leading-tight mt-1 break-all">{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {loadError && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50/80 text-orange-800 p-5">
            <p className="font-semibold">Öğrenci listesi yüklenirken bir sorun oluştu</p>
            <p className="text-sm opacity-90 mt-1">
              Lütfen bağlantını kontrol edip alttaki Yenile butonuna bas.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-[320px_1fr] gap-5 items-start">
          <aside className="sticky top-[88px]">
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                      <Users className="w-4.5 h-4.5 text-sky-600" />
                      Öğrencilerim
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">{students.length} kayıtlı öğrenci</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="!p-2"
                    onClick={refreshStudents}
                    title="Yenile"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-3 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="İsim, email, hedef ara..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="input pl-9"
                  />
                </div>
              </CardHeader>
              <CardBody className="!p-2">
                {loading && students.length === 0 ? (
                  <ListSkeleton count={5} />
                ) : filteredStudents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center space-y-2">
                    <div className="w-11 h-11 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">Henüz öğrenci bulunmuyor</p>
                    <p className="text-xs text-slate-500">
                      Sistem yöneticisiyle iletişime geçerek ilk öğrenciyi ekletebilirsin.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto pr-1">
                    {filteredStudents.map((s) => {
                      const active = s.id === selectedId;
                      const sData = dataMap[s.id];
                      const taskCount = sData?.tasks.length ?? 0;
                      const doneCount = sData?.tasks.filter((t) => t.is_completed).length ?? 0;
                      const progress = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(s.id)}
                            className={cn(
                              'w-full text-left rounded-xl border p-3 transition-all flex items-start gap-3 group',
                              active
                                ? 'bg-gradient-to-br from-sky-50 to-emerald-50 border-sky-200 shadow-soft'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            )}
                          >
                            <div
                              className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                active
                                  ? 'bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                              )}
                            >
                              <UserRound className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-slate-800 text-sm leading-tight truncate">
                                  {s.full_name}
                                </p>
                                <ChevronRight
                                  className={cn(
                                    'w-4 h-4 flex-shrink-0 transition-transform',
                                    active && 'text-sky-600 translate-x-0.5'
                                  )}
                                />
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{s.email}</span>
                              </p>
                              {s.target_department && (
                                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                                  <GraduationCap className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{s.target_department}</span>
                                </p>
                              )}
                              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="mt-1 text-[10px] font-medium text-slate-500">
                                %{progress} · {doneCount}/{taskCount} görev
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-4 space-y-2">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Kısayollar
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a href="/dashboard/coach/meetings" className="btn-secondary !py-2 !px-3 text-xs text-center flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Görüşmeler
                </a>
                <a href="/dashboard/coach/programs" className="btn-secondary !py-2 !px-3 text-xs text-center flex items-center justify-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Programlar
                </a>
              </div>
            </div>
          </aside>

          <main className="space-y-5 min-w-0">
            {!selected ? (
              <Card>
                <CardBody className="p-10 sm:p-14 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-2xl text-slate-900">Bir öğrenci seç</h2>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                      Soldaki listeden bir öğrenci seçerek onun programını, deneme grafiğini ve
                      bir sonraki görüşmesini yönetebilirsin.
                    </p>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <>
                <Card className="relative overflow-hidden">
                  <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-sky-500/15 blur-3xl" />
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                          <UserRound className="w-7 h-7" strokeWidth={2.1} />
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-2xl text-slate-900">
                            {selected.full_name}
                          </h2>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" /> {selected.email}
                            </span>
                            {selected.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" /> {selected.phone}
                              </span>
                            )}
                            {selected.target_university && (
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" /> {selected.target_university}
                              </span>
                            )}
                            {selected.target_department && (
                              <Badge variant="accent" size="sm" className="gap-1">
                                <Target className="w-3 h-3" /> {selected.target_department}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="success" size="md" className="gap-1.5">
                          <GraduationCap className="w-3 h-3" />
                          Aktif Öğrenci
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => loadStudentData(selected.id)}
                          loading={loading}
                        >
                          <Sparkles className="w-4 h-4" />
                          Yenile
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <ExamAddForm studentId={selected.id} onAdded={() => loadStudentData(selected.id)} mode="coach" />

                <div className="grid lg:grid-cols-5 gap-5 items-start">
                  <div className="lg:col-span-3 space-y-5">
                    {loading ? (
                      <CardSkeleton />
                    ) : selectedData ? (
                      <StudentTasks
                        tasks={selectedData.tasks}
                        studentId={selected.id}
                        coachId={coachId}
                        mode="coach"
                        onMutation={() => loadStudentData(selected.id)}
                      />
                    ) : (
                      <Skeleton className="h-64 w-full" />
                    )}
                  </div>
                  <div className="lg:col-span-2 space-y-5">
                    {loading && !selectedData ? (
                      <CardSkeleton />
                    ) : selectedData ? (
                      <MeetingCard
                        meetings={selectedData.meetings}
                        studentId={selected.id}
                        coachId={coachId}
                        mode="coach"
                        onMutation={() => loadStudentData(selected.id)}
                      />
                    ) : null}
                  </div>
                </div>

                {loading && !selectedData ? (
                  <div className="grid gap-5">
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : selectedData ? (
                  <ExamLineChart results={selectedData.results} loading={loading} />
                ) : null}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
