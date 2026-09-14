import { ExamChart } from '@/components/student/ExamChart';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentResultsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  let tytResults = [];
  let aytResults = [];
  if (student) {
    const { data: tyt } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', student.id)
      .eq('exam_type', 'TYT')
      .order('exam_date', { ascending: true });
    tytResults = tyt ?? [];
    const { data: ayt } = await supabase
      .from('exam_results')
      .select('*')
      .eq('student_id', student.id)
      .eq('exam_type', 'AYT')
      .order('exam_date', { ascending: true });
    aytResults = ayt ?? [];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">
          Deneme <span className="gradient-text">Sonuçlarım</span>
        </h1>
        <p className="text-slate-400">Zaman içindeki gelişimini inceleyerek güçlü ve zayıf yönlerini belirle.</p>
      </div>
      <ExamChart type="TYT" results={tytResults} targetNet={100} />
      <ExamChart type="AYT" results={aytResults} targetNet={120} />
    </div>
  );
}
