import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardRootPage() {
  const supabase = createClient();
  let role: 'coach' | 'student' | null = null;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect('/login');
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    role = (profile?.role as 'coach' | 'student') || 'student';
  } catch {
    redirect('/login');
  }

  if (role === 'coach') {
    redirect('/dashboard/coach');
  }
  redirect('/dashboard/student');
}
