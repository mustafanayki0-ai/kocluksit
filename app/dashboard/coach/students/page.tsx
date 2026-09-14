import { StudentList } from '@/components/coach/StudentList';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CoachStudentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'coach') redirect('/dashboard/student');

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-2">
          <span className="gradient-text">Öğrencilerim</span>
        </h1>
        <p className="text-slate-400">Öğrencilerini yönet, program ata, görüşme planla ve notlar bırak.</p>
      </div>
      <StudentList students={students || undefined} />
    </div>
  );
}
