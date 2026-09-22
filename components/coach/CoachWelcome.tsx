import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Plus,
} from 'lucide-react';
import type { Profile } from '@/lib/types';
import Link from 'next/link';

interface CoachWelcomeProps {
  profile?: Profile;
  stats?: {
    students: number;
    meetings: number;
    programs: number;
    notes: number;
  };
}

export function CoachWelcome({
  profile,
  stats = { students: 0, meetings: 0, programs: 0, notes: 0 },
}: CoachWelcomeProps) {
  const name = profile?.full_name || 'Değerli Koç';
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? 'Günaydın'
      : hour < 18
      ? 'İyi günler'
      : hour < 23
      ? 'İyi akşamlar'
      : 'İyi geceler';

  const quickStats = [
    { label: 'Aktif Öğrenci', value: stats.students, icon: Users, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    { label: 'Yaklaşan Görüşme', value: stats.meetings, icon: Calendar, color: 'from-sky-500 to-sky-600', shadow: 'shadow-sky-500/20' },
    { label: 'Atanan Program', value: stats.programs, icon: FileText, color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20' },
    { label: 'Koç Notu', value: stats.notes, icon: MessageSquare, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
  ];

  return (
    <Card className="relative overflow-hidden p-0 border border-slate-200">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:44px_44px] opacity-40 [mask-image:radial-gradient(ellipse_at_right,black_0%,transparent_60%)]" />
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-24 -right-10 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl animate-pulse-slow" />
      <CardBody className="relative p-6 md:p-8">
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="brand" size="md" className="gap-1.5">
                <Sparkles className="w-3 h-3" />
                {new Date().toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Badge>
              <Badge variant="accent" size="md" className="gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Günün ilk planını yapmaya hazır
              </Badge>
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-3">
              {greeting},{` `}
              <span className="gradient-text">{name.split(' ')[0]}</span>
              <span className="text-slate-800">!</span>
              <br className="hidden md:block" />
              <span className="shine-text">
                Öğrencilerinle birlikte büyümeye hazır mısın?
              </span>
            </h1>
            <p className="text-slate-600 text-base md:text-lg max-w-2xl leading-relaxed mb-5">
              Bugün yapacağın küçük bir geri bildirim, bir öğrencinin hayatını
              değiştirebilir. İyi ki varsın 💚
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button asLink href="/dashboard/coach/students" size="md">
                <Users className="w-4 h-4" />
                Öğrencilerimi gör
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button asLink href="/dashboard/coach/programs" variant="secondary" size="md">
                <Plus className="w-4 h-4" />
                Yeni program ata
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 w-full md:w-auto">
            {quickStats.map((s) => {
              const Icon = s.icon;
              return (
                <Card
                  key={s.label}
                  className="p-4 !shadow-none !bg-slate-50 !border-slate-200 hover:!border-slate-300 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg ${s.shadow} mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    {s.label}
                  </div>
                  <div className="font-display text-2xl font-bold gradient-text tabular-nums mt-0.5">
                    {s.value}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
