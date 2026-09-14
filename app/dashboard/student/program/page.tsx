import { WeeklyProgramCard } from '@/components/student/WeeklyProgramCard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWeekDates } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudentProgramPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const { start, end } = getWeekDates();
  let program = null;
  if (student) {
    const { data: wp } = await supabase
      .from('weekly_programs')
      .select('*')
      .eq('student_id', student.id)
      .lte('week_start_date', end.toISOString())
      .gte('week_end_date', start.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    program = wp;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <WeeklyProgramCard program={program ?? undefined} />
    </div>
  );
}
