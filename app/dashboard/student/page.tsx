import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type {
  Profile,
  Student,
  WeeklyProgram,
  Meeting,
  ExamResult,
  DailyTask,
  CoachNote,
} from '@/lib/types';
import { StudentWelcome } from '@/components/student/StudentWelcome';
import { MeetingCountdown } from '@/components/student/MeetingCountdown';
import { ExamChart } from '@/components/student/ExamChart';
import { DailyTasks } from '@/components/student/DailyTasks';
import { CoachNotes } from '@/components/student/CoachNotes';
import { WeeklyProgramCard } from '@/components/student/WeeklyProgramCard';
import { getWeekDates } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'student') {
    if (profile?.role === 'coach') {
      redirect('/dashboard/coach');
    }
    redirect('/');
  }

  const { data: studentData } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const { start, end } = getWeekDates();
  const startStr = start.toISOString();
  const endStr = end.toISOString();

  let student: Student | null = studentData;
  let weeklyProgram: WeeklyProgram | null = null;
  let nextMeeting: Meeting | null = null;
  let tytResults: ExamResult[] = [];
  let aytResults: ExamResult[] = [];
  let todayTasks: DailyTask[] = [];
  let coachNotes: CoachNote[] = [];
  let coachName = 'Koçun';

  if (student) {
    try {
      const { data: wp } = await supabase
        .from('weekly_programs')
        .select('*')
        .eq('student_id', student.id)
        .lte('week_start_date', endStr)
        .gte('week_end_date', startStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      weeklyProgram = wp ?? null;
    } catch (e) {
      console.error('Weekly program hatası:', e);
    }

    try {
      const now = new Date().toISOString();
      const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .eq('student_id', student.id)
        .gte('meeting_date', now)
        .eq('status', 'scheduled')
        .order('meeting_date', { ascending: true })
        .limit(1);
      nextMeeting = meetings && meetings.length > 0 ? meetings[0] : null;
    } catch (e) {
      console.error('Toplantı hatası:', e);
    }

    try {
      const { data: tyt } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', student.id)
        .eq('exam_type', 'TYT')
        .order('exam_date', { ascending: true });
      tytResults = tyt ?? [];
    } catch (e) {
      console.error('TYT sonuç hatası:', e);
    }

    try {
      const { data: ayt } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', student.id)
        .eq('exam_type', 'AYT')
        .order('exam_date', { ascending: true });
      aytResults = ayt ?? [];
    } catch (e) {
      console.error('AYT sonuç hatası:', e);
    }

    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const { data: tasks } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('student_id', student.id)
        .gte('task_date', todayStr)
        .order('task_date', { ascending: false });
      todayTasks = tasks ?? [];
    } catch (e) {
      console.error('Günlük görev hatası:', e);
    }

    try {
      const { data: notes } = await supabase
        .from('coach_notes')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(5);
      coachNotes = notes ?? [];
    } catch (e) {
      console.error('Koç notu hatası:', e);
    }

    if (student.coach_id) {
      try {
        const { data: coachProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', student.coach_id)
          .maybeSingle();
        if (coachProfile?.full_name) coachName = coachProfile.full_name;
      } catch (e) {
        console.error('Koç bilgisi hatası:', e);
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
      <StudentWelcome profile={profile} student={student ?? undefined} />

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <WeeklyProgramCard program={weeklyProgram ?? undefined} />
          <ExamChart
            type="TYT"
            results={tytResults}
            targetNet={100}
          />
          <ExamChart
            type="AYT"
            results={aytResults}
            targetNet={120}
          />
        </div>
        <div className="space-y-6 md:space-y-8">
          <MeetingCountdown meeting={nextMeeting ?? undefined} />
          <DailyTasks
            tasks={todayTasks.length > 0 ? todayTasks : undefined}
            studentId={student?.id}
          />
          <CoachNotes
            notes={coachNotes.length > 0 ? coachNotes : undefined}
            coachName={coachName}
          />
        </div>
      </div>
    </div>
  );
}
