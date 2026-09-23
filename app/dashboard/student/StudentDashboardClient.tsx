'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ExamLineChart } from '@/components/rbac/ExamLineChart';
import { StudentTasks } from '@/components/rbac/StudentTasks';
import { ExamAddForm } from '@/components/rbac/ExamAddForm';
import { MeetingCard } from '@/components/rbac/MeetingCard';
import { createClient } from '@/lib/supabase/client';
import type { DailyTask, ExamResult, Meeting, Student } from '@/lib/types';
import {
  GraduationCap,
  UserRound,
  Award,
  Target,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface Props {
  student: Student;
  displayName: string;
  coachName: string;
  initialTasks: DailyTask[];
  initialResults: ExamResult[];
  initialMeetings: Meeting[];
}

export function StudentDashboardClient({
  student,
  displayName,
  coachName,
  initialTasks,
  initialResults,
  initialMeetings,
}: Props) {
  const toast = useToast();
  const supabase = createClient();

  const [tasks, setTasks] = useState<DailyTask[]>(initialTasks ?? []);
  const [results, setResults] = useState<ExamResult[]>(initialResults ?? []);
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings ?? []);
  const [loading, setLoading] = useState(false);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: t }, { data: e }, { data: m }] = await Promise.all([
        supabase.from('tasks').select('*').eq('student_id', student.id).order('task_date', { ascending: false }),
        supabase.from('exam_results').select('*').eq('student_id', student.id).order('exam_date', { ascending: false }),
        supabase.from('meetings').select('*').eq('student_id', student.id).order('meeting_date', { ascending: false }),
      ]);
      setTasks((t as DailyTask[]) ?? []);
      setResults((e as ExamResult[]) ?? []);
      setMeetings((m as Meeting[]) ?? []);
    } catch (err: any) {
      toast.error('Veriler yenilenemedi', err?.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, student.id, toast]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((e) => {
      if (e === 'SIGNED_OUT') {
        setTasks([]);
        setResults([]);
        setMeetings([]);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const totalTasks = tasks.length;
  const avgNet = results.length
    ? (results.reduce((s, r) => s + Number(r.net_score ?? r.total_net ?? 0), 0) / results.length).toFixed(1)
    : '—';

  const nextMeeting = meetings
    .filter((m) => new Date(m.meeting_date).getTime() >= Date.now() - 1000 * 60 * 60 * 24)
    .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-hero-wash py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/60 border border-slate-200 p-6 sm:p-8 shadow-soft">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="relative grid lg:grid-cols-[1fr_auto] items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="accent" size="md" className="gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Öğrenci Paneli
                </Badge>
                <Badge variant="brand" size="md" className="gap-1.5">
                  <GraduationCap className="w-3 h-3" />
                  {student.target_department || 'YKS Hedefin'}
                </Badge>
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.05] text-slate-900">
                Tekrar hoş geldin,{' '}
                <span className="gradient-text">{displayName}</span>!
              </h1>
              <p className="mt-3 text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
                Bugün de hedefine bir adım daha yaklaşıyorsun. Aşağıda koçun <b className="font-semibold text-slate-800">{coachName}</b>{' '}
                tarafından hazırlanan görevlerini, deneme grafiğini ve bir sonraki görüşmeni görebilirsin.
              </p>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <UserRound className="w-8 h-8 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <p className="font-display font-bold text-lg text-slate-900 leading-tight">{displayName}</p>
                <p className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {student.target_university || 'Hedef Üniversiten'}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: 'Tamamlanan',
                value: completedTasks,
                unit: `/ ${totalTasks} görev`,
                icon: Target,
                tone: 'from-emerald-500 to-emerald-600',
              },
              {
                label: 'Ortalama Net',
                value: avgNet,
                unit: 'genel',
                icon: Award,
                tone: 'from-sky-500 to-sky-600',
              },
              {
                label: 'Deneme Sayısı',
                value: results.length,
                unit: 'kayıt',
                icon: BookOpen,
                tone: 'from-orange-500 to-orange-600',
              },
              {
                label: 'Sonraki',
                value: nextMeeting
                  ? new Date(nextMeeting.meeting_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
                  : '—',
                unit: nextMeeting
                  ? `${new Date(nextMeeting.meeting_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} görüşme`
                  : 'görüşme yok',
                icon: GraduationCap,
                tone: 'from-indigo-500 to-violet-600',
              },
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
                  <p className="font-display font-bold text-2xl text-slate-900 leading-tight mt-1">{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <ExamAddForm studentId={student.id} onAdded={refreshAll} mode="student" />

        <div className="grid lg:grid-cols-5 gap-5 items-start">
          <div className="lg:col-span-3 space-y-5">
            {loading ? <CardSkeleton /> : <StudentTasks tasks={tasks} studentId={student.id} mode="student" onMutation={refreshAll} />}
          </div>
          <div className="lg:col-span-2 space-y-5">
            <MeetingCard
              meetings={meetings}
              studentId={student.id}
              mode="student"
              loading={loading}
              onMutation={refreshAll}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <ExamLineChart results={results} />
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <p className="text-xs text-slate-500">
            Görevleri tamamladıkça, yeni denemeler girdikçe grafiğin güncellenir. Başarılar dileriz!
          </p>
          <button
            onClick={refreshAll}
            disabled={loading}
            className="btn-ghost !px-3.5 !py-2 text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Skeleton className="w-3 h-3 bg-transparent border-0 animate-spin" />}
            Yenile
          </button>
        </div>
      </div>
    </div>
  );
}
