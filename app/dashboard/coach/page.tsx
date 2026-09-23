import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CoachPanelClient } from '@/components/coach/CoachPanelClient';

export const dynamic = 'force-dynamic';

export default async function CoachDashboardPage() {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  let role: string | null = null;
  let fullName = 'Koç';
  let students: any[] = [];

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    role = profile?.role ?? null;
    fullName = profile?.full_name || user.email?.split('@')[0] || 'Koç';

    if (role === 'coach') {
      const { data: studs } = await supabase
        .from('profiles')
        .select('id, full_name, email, coach_id')
        .eq('coach_id', user.id)
        .eq('role', 'student')
        .order('full_name', { ascending: true, nullsFirst: false });

      students =
        (studs ?? []).map((s: any) => ({
          id: s.id,
          full_name: s.full_name || 'İsimsiz Öğrenci',
          email: s.email || '',
          coach_id: s.coach_id,
        })) || [];
    }
  } catch {
    role = null;
  }

  if (role !== 'coach') {
    redirect('/dashboard/student');
  }

  return (
    <CoachPanelClient
      coachId={user.id}
      coachName={fullName}
      initialStudents={students}
    />
  );
}
