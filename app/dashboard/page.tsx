import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardRouterPage() {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  let role: string | null = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    role = data?.role ?? null;
  } catch {
    role = null;
  }

  if (role === 'coach') {
    redirect('/dashboard/coach');
  }
  if (role === 'student') {
    redirect('/dashboard/student');
  }

  redirect('/');
}
