'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Sparkles,
  UserRound,
  Flame,
} from 'lucide-react';
import { SigmaLogo } from '@/components/ui/SigmaLogo';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  user: { id: string; email?: string } | null;
  profile: { full_name: string; role: string } | null;
}

export function Header({ user, profile }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  const isCoach = profile?.role === 'coach';

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

  if (!user) {
    return (
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <SigmaLogo size={38} className="drop-shadow-sm" />
            <div className="leading-tight">
              <p className="font-display font-extrabold text-[20px] tracking-[-0.04em] text-slate-900">
                SIGMA
              </p>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 -mt-0.5">
                MENTÖRLÜK
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost !px-4">
              Giriş
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900 hidden sm:inline">
              LMS<span className="gradient-text">Koçluk</span>
            </span>
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
                {profile?.full_name || user?.email}
              </span>
              <span className="text-xs capitalize font-medium gradient-text">
                {profile?.role === 'coach' ? 'Koç' : 'Öğrenci'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <UserRound className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-ghost !p-2.5"
            title="Çıkış yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="btn-ghost !p-2.5 md:hidden"
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
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs capitalize gradient-text font-medium">
                  {profile?.role === 'coach' ? 'Koç' : 'Öğrenci'}
                </p>
              </div>
            </div>
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
          </div>
        </div>
      )}
    </header>
  );
}
