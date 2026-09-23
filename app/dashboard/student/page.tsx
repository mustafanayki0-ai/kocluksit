import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentPanelClient } from '@/components/student/StudentPanelClient';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  let role: string | null = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name, phone')
      .eq('id', user.id)
      .maybeSingle();
    role = data?.role ?? null;
  } catch {
    role = null;
  }

  if (role === 'coach') {
    redirect('/dashboard/coach');
  }

  return <StudentPanelClient userId={user.id} />;
}
