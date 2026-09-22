import { DailyTasks } from '@/components/student/DailyTasks';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentTasksPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  let tasks = [];
  if (student) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: t } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('student_id', student.id)
        .gte('task_date', today)
        .order('task_date', { ascending: false });
      tasks = t ?? [];
    } catch (e) {
      console.error('Student tasks veri hatası:', e);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-2">
          Günlük <span className="gradient-text">Görevlerim</span>
        </h1>
        <p className="text-slate-500">Bugün neler yapacaksın? İlerlemeni takip etmek için işaretle.</p>
      </div>
      <DailyTasks tasks={tasks.length > 0 ? tasks : undefined} studentId={student?.id} />
    </div>
  );
}
