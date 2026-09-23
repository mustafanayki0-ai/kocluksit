import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CoachDashboardClient } from './CoachDashboardClient';
import type { DailyTask, ExamResult, Meeting, Student } from '@/lib/types';

export const dynamic = 'force-dynamic';

type DataMap = {
  [studentId: string]: {
    tasks: DailyTask[];
    results: ExamResult[];
    meetings: Meeting[];
  };
};

export default async function CoachDashboardPage() {
  const supabase = createClient();
  let coachId: string | null = null;
  let displayName = 'Koç';
  let students: Student[] = [];
  const dataMap: DataMap = {};
  let loadError = false;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect('/login');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'coach') {
      redirect('/dashboard/student');
    }
    coachId = profile.id;
    if (profile.full_name) displayName = profile.full_name;

    const { data: studs, error: studsError } = await supabase
      .from('profiles')
      .select('id, full_name, role, coach_id, created_at, updated_at')
      .eq('coach_id', coachId)
      .eq('role', 'student')
      .order('full_name', { ascending: true, nullsFirst: false });

    if (studsError) {
      loadError = true;
    } else {
      students = ((studs ?? []).map((s) => ({
        ...s,
        full_name: s.full_name ?? 'İsimsiz Öğrenci',
        email: '',
        role: 'student' as const,
      })) as unknown) as Student[];

      await Promise.all(
        students.map(async (s) => {
          let tasks: DailyTask[] = [];
          let results: ExamResult[] = [];
          let meetings: Meeting[] = [];
          try {
            const [{ data: t }, { data: e }, { data: m }] = await Promise.all([
              supabase
                .from('tasks')
                .select('*')
                .eq('student_id', s.id)
                .order('task_date', { ascending: false }),
              supabase
                .from('exam_results')
                .select('*')
                .eq('student_id', s.id)
                .order('exam_date', { ascending: false }),
              supabase
                .from('meetings')
                .select('*')
                .eq('student_id', s.id)
                .order('meeting_date', { ascending: false }),
            ]);
            tasks = (t as DailyTask[]) ?? [];
            results = (e as ExamResult[]) ?? [];
            meetings = (m as Meeting[]) ?? [];
          } catch {}
          dataMap[s.id] = { tasks, results, meetings };
        })
      );
    }
  } catch {
    loadError = true;
    students = [];
  }

  return (
    <CoachDashboardClient
      coachId={coachId!}
      coachName={displayName}
      initialStudents={students}
      initialDataMap={dataMap}
      loadError={loadError}
    />
  );
}
