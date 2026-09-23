import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * ADIM 3: Dashboard KÖPRÜSÜ (Router)
 * Server Component, role değerini profiles tablosundan alır ve yönlendirir.
 * - role === 'coach'   -> /dashboard/coach
 * - role === 'student' -> /dashboard/student
 * - hiçbiri / hata     -> /login (auth kontrol)
 */
export default async function DashboardRouterPage() {
  const supabase = createClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      redirect('/login');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, coach_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      // Henüz profil oluşturulmadıysa (trigger beklemedeyse) öğrenci kabul et
      redirect('/dashboard/student');
    }

    if (profile.role === 'coach') {
      redirect('/dashboard/coach');
    }
    // 'student' VEYA beklenmedik bir değer => öğrenci paneli
    redirect('/dashboard/student');
  } catch {
    // Herhangi bir beklenmedik hata => güvenli yönlendirme login
    redirect('/login');
  }
}
