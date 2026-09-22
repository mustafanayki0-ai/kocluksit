import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentDashboardClient } from './StudentDashboardClient';
import type { DailyTask, ExamResult, Meeting, Student } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = createClient();
  let student: (Student & { coach_id: string }) | null = null;
  let tasks: DailyTask[] = [];
  let results: ExamResult[] = [];
  let meetings: Meeting[] = [];
  let displayName = 'Öğrenci';
  let coachName = 'Koçun';
  let loadError = false;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect('/login');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role && profile.role !== 'student') {
      redirect('/dashboard/coach');
    }
    if (profile?.full_name) displayName = profile.full_name;

    const { data: studentRow } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    student = (studentRow as (Student & { coach_id: string }) | null) ?? null;

    if (student) {
      displayName = student.full_name || displayName;
      if (student.coach_id) {
        const { data: coachRow } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', student.coach_id)
          .maybeSingle();
        if (coachRow?.full_name) coachName = coachRow.full_name;
      }

      try {
        const { data: tData } = await supabase
          .from('daily_tasks')
          .select('*')
          .eq('student_id', student.id)
          .order('task_date', { ascending: false });
        tasks = (tData ?? []) as DailyTask[];
      } catch {}

      try {
        const { data: eData } = await supabase
          .from('exam_results')
          .select('*')
          .eq('student_id', student.id)
          .order('exam_date', { ascending: false });
        results = (eData ?? []) as ExamResult[];
      } catch {}

      try {
        const { data: mData } = await supabase
          .from('meetings')
          .select('*')
          .eq('student_id', student.id)
          .order('meeting_date', { ascending: false });
        meetings = (mData ?? []) as Meeting[];
      } catch {}
    }
  } catch (e) {
    loadError = true;
    student = null;
  }

  if (!student) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-hero-wash py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-orange-200 bg-orange-50/80 text-orange-800 p-6 sm:p-8">
            <h1 className="font-display font-bold text-2xl sm:text-3xl mb-2">Henüz bir koç ile eşleştirilmemişsin</h1>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed">
              Sigma Mentörlük&apos;te öğrenci paneline erişebilmen için önce bir koç tarafından sisteme eklenmen
              gerekiyor. Lütfen koçun ile iletişime geç veya yöneticiye bildir.
              {loadError && <span className="block mt-2 text-orange-700">Bir veri erişim sorunu oluştu.</span>}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudentDashboardClient
      student={student}
      displayName={displayName}
      coachName={coachName}
      initialTasks={tasks}
      initialResults={results}
      initialMeetings={meetings}
    />
  );
}
