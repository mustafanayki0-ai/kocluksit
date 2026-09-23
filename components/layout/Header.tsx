'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  ListTodo,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  UserRound,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  user?: { id: string; email?: string } | null;
  profile?: { full_name: string; role: string } | null;
}

export function Header({ user: propUser, profile: propProfile }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(propUser ?? null);
  const [authProfile, setAuthProfile] = useState<{ full_name: string; role: string } | null>(propProfile ?? null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setAuthUser(propUser ?? null);
    setAuthProfile(propProfile ?? null);
  }, [propUser, propProfile]);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', userId)
          .maybeSingle();
        if (mounted) setAuthProfile(data);
      } catch {
        if (mounted) setAuthProfile(null);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const nextUser = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      setAuthUser(nextUser);
      if (!nextUser) {
        setAuthProfile(null);
      } else {
        if (propProfile && propProfile.full_name) {
          setAuthProfile(propProfile);
        } else {
          await fetchProfile(nextUser.id);
        }
      }
    });

    if (!propUser) {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!mounted) return;
        if (user) {
          const resolved = { id: user.id, email: user.email ?? undefined };
          setAuthUser(resolved);
          await fetchProfile(user.id);
        }
      });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, propUser, propProfile]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch {
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      setSigningOut(false);
    }
  };

  const isCoach = authProfile?.role === 'coach';

  const coachLinks = [
    { href: '/dashboard/coach', label: 'Panel', icon: LayoutDashboard },
    { href: '/dashboard/coach/students', label: 'Öğrencilerim', icon: Users },
    { href: '/dashboard/coach/programs', label: 'Programlar', icon: FileText },
    { href: '/dashboard/coach/meetings', label: 'Görüşmeler', icon: Calendar },
  ];

  const studentLinks = [
    { href: '/dashboard/student', label: 'Panelim', icon: LayoutDashboard },
    { href: '/dashboard/student/program', label: 'Programım', icon: FileText },
    { href: '/dashboard/student/results', label: 'Denemelerim', icon: BarChart3 },
    { href: '/dashboard/student/tasks', label: 'Görevlerim', icon: ListTodo },
  ];

  const links = isCoach ? coachLinks : studentLinks;

  if (!authUser) {
    return (
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.svg"
              alt="Sigma Mentörlük"
              width={150}
              height={44}
              className="h-auto w-32 sm:w-40 object-contain"
              priority
            />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost !px-4">
              Giriş Yap
            </Link>
            <Link href="/register" className="btn-primary !px-4 !py-2 text-sm">
              Başla
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.svg"
              alt="Sigma Mentörlük"
              width={150}
              height={44}
              className="h-auto w-32 sm:w-40 object-contain"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== (isCoach ? '/dashboard/coach' : '/dashboard/student') &&
                  pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-soft'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 mr-2 pl-3 border-l border-slate-200">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold text-slate-900">
                {authProfile?.full_name || authUser?.email}
              </span>
              <span className="text-xs capitalize font-medium gradient-text">
                {authProfile?.role === 'coach' ? 'Koç' : 'Öğrenci'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <UserRound className="w-5 h-5 text-slate-600" />
            </div>
          </div>

          <Link
            href="/dashboard"
            className="hidden md:inline-flex btn-secondary !px-3.5 !py-2 text-sm items-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <Button
            variant="ghost"
            onClick={handleSignOut}
            loading={signingOut}
            className="!p-2.5"
            title="Çıkış yap"
            type="button"
          >
            <LogOut className="w-4 h-4" />
          </Button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="btn-ghost !p-2.5 md:hidden"
            aria-label="Menüyü aç"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                <UserRound className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {authProfile?.full_name || authUser?.email}
                </p>
                <p className="text-xs capitalize gradient-text font-medium">
                  {authProfile?.role === 'coach' ? 'Koç' : 'Öğrenci'}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-50 to-sky-50 text-slate-800 border border-emerald-100 mb-2"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              Dashboard
              <ChevronRight className="w-3.5 h-3.5 ml-auto text-emerald-600" />
            </Link>

            {links.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== (isCoach ? '/dashboard/coach' : '/dashboard/student') &&
                  pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-soft'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            <button
              onClick={handleSignOut}
              className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-orange-700 bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
