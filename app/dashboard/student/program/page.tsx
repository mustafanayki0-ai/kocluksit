import { WeeklyProgramCard } from '@/components/student/WeeklyProgramCard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWeekDates } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudentProgramPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'student') redirect('/dashboard/coach');

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const { start, end } = getWeekDates();
  let program = null;
  if (student) {
    try {
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
    } catch (e) {
      console.error('Haftalık program hatası:', e);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-2">
          Haftalık <span className="gradient-text">Programım</span>
        </h1>
        <p className="text-slate-500">Koçun tarafından hazırlanan bu haftaki programın.</p>
      </div>
      <WeeklyProgramCard program={program ?? undefined} />
    </div>
  );
}
