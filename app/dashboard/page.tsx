import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  GraduationCap,
  UserRound,
  Mail,
  LayoutDashboard,
  ChevronRight,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function DashboardRootPage() {
  const supabase = createClient();
  let user = null;
  let profile = null;
  let loadError = false;

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    user = authUser;

    if (!user) {
      redirect('/login');
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      profile = profileData;
    } catch {
      profile = null;
    }
  } catch {
    loadError = true;
    user = null;
    profile = null;
    redirect('/login');
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı';
  const displayEmail = user?.email || '—';
  const role = profile?.role || user?.user_metadata?.role || 'student';
  const isCoach = role === 'coach';
  const targetHref = isCoach ? '/dashboard/coach' : '/dashboard/student';
  const targetLabel = isCoach ? 'Koç Paneline Git' : 'Öğrenci Paneline Git';
  const roleLabel = isCoach ? 'Koç / Eğitmen' : 'Öğrenci';
  const roleVariant = isCoach ? 'brand' : 'accent';
  const RoleIcon = isCoach ? Briefcase : GraduationCap;

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-hero-wash py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <Badge variant={roleVariant} size="md" className="mb-3 gap-1.5">
              <Sparkles className="w-3 h-3" />
              {roleLabel} Paneli
            </Badge>
            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.1] text-slate-900">
              Hoş geldin,{' '}
              <span className="gradient-text">{displayName}</span>
              <span className="text-slate-900">!</span>
            </h1>
            <p className="text-slate-500 mt-3 text-base sm:text-lg leading-relaxed max-w-2xl">
              Başarıya giden yolculuğunda bugün de seninle birlikteyiz. Aşağıdan
              paneline geçiş yapabilirsin.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 shadow-md shadow-emerald-500/20 flex items-center justify-center">
              <UserRound className="w-7 h-7 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-900">{displayName}</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Mail className="w-3 h-3" />
                {displayEmail}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <Card className="md:col-span-2 relative overflow-hidden">
            <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl" />
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-display font-bold text-2xl text-slate-900">
                    Hesap Bilgilerin
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Supabase Auth & Profil tablosundan alınan güncel veriler.
                  </p>
                </div>
                <Badge variant={roleVariant} className="gap-1.5 text-xs">
                  <RoleIcon className="w-3 h-3" />
                  {roleLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-white border border-slate-200 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Ad Soyad
                  </dt>
                  <dd className="font-semibold text-slate-900 text-base">
                    {profile?.full_name || (user?.user_metadata?.full_name as string) || 'Henüz ayarlanmamış'}
                  </dd>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    E-posta
                  </dt>
                  <dd className="font-semibold text-slate-900 text-base break-all">
                    {displayEmail}
                  </dd>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Kullanıcı ID
                  </dt>
                  <dd className="font-mono text-[13px] text-slate-700 break-all">
                    {user?.id}
                  </dd>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Rol
                  </dt>
                  <dd className="inline-flex items-center gap-2 font-semibold text-slate-900 text-base">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isCoach ? 'bg-sky-500' : 'bg-emerald-500'
                      }`}
                    />
                    {roleLabel}
                  </dd>
                </div>
              </dl>

              {loadError && (
                <div className="mt-5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-3">
                  Bazı bilgiler yüklenirken bir sorun oluştu. Paneline geçiş
                  yaparak verilerinizi görüntüleyebilirsiniz.
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl" />
            <CardHeader>
              <h2 className="font-display font-bold text-xl text-slate-900">
                Kısa Yol
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Rolüne özel paneline yönlendirilirsin.
              </p>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button asLink href={targetHref} size="lg" className="w-full !py-3">
                <LayoutDashboard className="w-4 h-4" />
                {targetLabel}
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="text-xs text-slate-500 space-y-2 pt-1">
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                  <span>
                    Öğrenci: Program, görevler, denemeler, koç notları.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Briefcase className="w-3.5 h-3.5 mt-0.5 text-sky-600 flex-shrink-0" />
                  <span>
                    Koç: Öğrenciler, programlar, toplantılar takibi.
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-400">
            Bu sayfa her zaman <code className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">/dashboard</code> adresinden erişilebilir.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/"
              className="btn-ghost !px-3.5 !py-2 text-sm"
            >
              Anasayfa&apos;ya Dön
            </Link>
            <Link
              href={targetHref}
              className="btn-primary !px-3.5 !py-2 text-sm inline-flex items-center gap-1.5"
            >
              {targetLabel}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
