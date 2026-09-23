import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Dashboard Router (GÜVENLİ FALLBACK)
 *
 * - Kullanıcı auth OK ise profiles.role değerine göre yönlendirir.
 * - ROLE NULL / UNDEFINED / SORGU HATASI / CATCH durumlarında:
 *     KESİNLİKLE / veya /login GERİ GÖNDERME (redirect loop yaratır!).
 *     Varsayılan olarak /dashboard/student fallback yönlendirmesi kullan.
 */
export default async function DashboardRouterPage() {
  const supabase = createClient();
  let user = null;

  try {
    const { data: { user: u } } = await supabase.auth.getUser();
    user = u;
  } catch {}

  if (!user) {
    redirect('/login');
  }

  let role: string | null = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .maybeSingle();
    role = data?.role ?? null;
  } catch {
    role = null;
  }

  if (role === 'coach') {
    redirect('/dashboard/coach');
  }

  // student, null, undefined, beklenmedik değer, hata => hep öğrenci paneli fallback
  redirect('/dashboard/student');
}
