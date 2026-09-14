import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Flame,
  TrendingUp,
  Award,
  Target,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { Profile, Student } from '@/lib/types';
import { cn, getMotivationalQuote } from '@/lib/utils';
import Link from 'next/link';

interface StudentWelcomeProps {
  profile?: Profile;
  student?: Student;
}

export function StudentWelcome({ profile, student }: StudentWelcomeProps) {
  const name = profile?.full_name || student?.full_name || 'Değerli Öğrencimiz';
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? 'Günaydın'
      : hour < 18
      ? 'İyi günler'
      : hour < 23
      ? 'İyi akşamlar'
      : 'İyi geceler';
  const quote = getMotivationalQuote();
  const target = student?.target_department
    ? `${student.target_university || ''} / ${student.target_department}`.trim()
    : null;

  return (
    <Card className="relative overflow-hidden p-0 border-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:44px_44px] opacity-40 [mask-image:radial-gradient(ellipse_at_left,black_0%,transparent_60%)]" />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-slow" />
      <div className="absolute top-10 right-20 w-24 h-24 rounded-full bg-orange-500/20 blur-3xl" />
      <CardBody className="relative p-6 md:p-8">
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="fire" size="md" className="gap-1.5">
                <Zap className="w-3 h-3" />
                {new Date().toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Badge>
              <Badge variant="brand" size="md" className="gap-1.5">
                <Flame className="w-3 h-3" />
                143. gün · Hazırlık Maratonu
              </Badge>
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-3">
              {greeting},{` `}
              <span className="gradient-text-fire">{name.split(' ')[0]}</span>
              <span className="text-slate-100">!</span>
              <br className="hidden md:block" />
              <span className="shine-text">Hedefin doğrultusunda bir gün daha.</span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed mb-5">
              <span className="text-emerald-300 font-medium">"{quote.text}"</span>{" "}
              <span className="text-slate-500">— {quote.author}</span>
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button asLink href="/dashboard/student/tasks" size="md">
                <Target className="w-4 h-4" />
                Bugünün görevleri
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button asLink href="/dashboard/student/results" variant="secondary" size="md">
                <TrendingUp className="w-4 h-4" />
                Gelişimini gör
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-1 md:w-72 gap-3">
            <Card className="p-4 !shadow-none !bg-slate-800/40 !border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    En İyi Deneme
                  </div>
                  <div className="font-display text-xl font-bold gradient-text tabular-nums">
                    98.4 <span className="text-sm text-slate-400 font-normal">net</span>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4 !shadow-none !bg-slate-800/40 !border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Aylık İlerleme
                  </div>
                  <div className="font-display text-xl font-bold text-emerald-400 tabular-nums">
                    +%24 <span className="text-sm text-slate-400 font-normal">yükseliş</span>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4 !shadow-none !bg-slate-800/40 !border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Hedef
                  </div>
                  <div className="font-display text-lg font-bold text-orange-400 truncate">
                    {target || 'Hedefini belirle'}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
