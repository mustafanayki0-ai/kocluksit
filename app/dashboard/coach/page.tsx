import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CoachWelcome } from '@/components/coach/CoachWelcome';
import { StudentList } from '@/components/coach/StudentList';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Clock,
  FileText,
  ChevronRight,
  Plus,
  MessageSquare,
  Users,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CoachDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'coach') {
    if (profile?.role === 'student') {
      redirect('/dashboard/student');
    }
    redirect('/');
  }

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false });

  const studentIds = (students || []).map((s) => s.id);

  const now = new Date().toISOString();
  let upcomingMeetings: any[] = [];
  let recentPrograms: any[] = [];
  let recentNotes: any[] = [];

  if (studentIds.length > 0) {
    const { data: meetings } = await supabase
      .from('meetings')
      .select('*, students(full_name)')
      .in('student_id', studentIds)
      .gte('meeting_date', now)
      .eq('status', 'scheduled')
      .order('meeting_date', { ascending: true })
      .limit(4);
    upcomingMeetings = meetings || [];

    const { data: programs } = await supabase
      .from('weekly_programs')
      .select('*, students(full_name)')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false })
      .limit(4);
    recentPrograms = programs || [];

    const { data: notes } = await supabase
      .from('coach_notes')
      .select('*, students(full_name)')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4);
    recentNotes = notes || [];
  }

  const useSynth = studentIds.length === 0;
  const synthMeetings = [
    { id: 'm1', meeting_date: new Date(Date.now() + 86400000 * 1).toISOString(), duration_minutes: 60, students: { full_name: 'Elif Demir' } },
    { id: 'm2', meeting_date: new Date(Date.now() + 86400000 * 2).toISOString(), duration_minutes: 90, students: { full_name: 'Zeynep Yılmaz' } },
    { id: 'm3', meeting_date: new Date(Date.now() + 86400000 * 3).toISOString(), duration_minutes: 60, students: { full_name: 'Ayşe Çelik' } },
    { id: 'm4', meeting_date: new Date(Date.now() + 86400000 * 5).toISOString(), duration_minutes: 60, students: { full_name: 'Mehmet Kaya' } },
  ];
  const synthPrograms = [
    { id: 'p1', week_start_date: new Date().toISOString(), students: { full_name: 'Zeynep Yılmaz' } },
    { id: 'p2', week_start_date: new Date().toISOString(), students: { full_name: 'Elif Demir' } },
    { id: 'p3', week_start_date: new Date(Date.now() - 86400000 * 5).toISOString(), students: { full_name: 'Can Öztürk' } },
    { id: 'p4', week_start_date: new Date(Date.now() - 86400000 * 6).toISOString(), students: { full_name: 'Mehmet Kaya' } },
  ];
  const synthNotes = [
    { id: 'n1', content: 'Türkçede büyük yükseliş var, devam etmelisin!', students: { full_name: 'Elif Demir' }, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'n2', content: 'Fen bölümünde 30 net hedefine 2 kaldın, odaklan!', students: { full_name: 'Zeynep Yılmaz' }, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'n3', content: 'Hedefinle gurur duyuyorum. Çalışmak için geç değil.', students: { full_name: 'Can Öztürk' }, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  ];

  const displayMeetings = useSynth ? synthMeetings : upcomingMeetings;
  const displayPrograms = useSynth ? synthPrograms : recentPrograms;
  const displayNotes = useSynth ? synthNotes : recentNotes;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
      <CoachWelcome
        profile={profile}
        stats={{
          students: students?.length || 5,
          meetings: upcomingMeetings.length || 4,
          programs: recentPrograms.length || 4,
          notes: recentNotes.length || 3,
        }}
      />

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <StudentList students={students || undefined} />
        </div>
        <div className="space-y-6 md:space-y-8">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Calendar className="w-5.5 h-5.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">
                      <span className="gradient-text">Görüşmeler</span>
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Gelecek {displayMeetings.length} randevun
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asLink href="/dashboard/coach/meetings">
                  Tümü <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-2.5 pt-2">
              {displayMeetings.slice(0, 4).map((m, i) => (
                <Link
                  key={m.id}
                  href="#"
                  className="block rounded-xl border border-slate-800 bg-slate-900/40 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 p-3.5 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex-shrslate-0 flex items-center justify-center ${
                        i === 0
                          ? 'bg-gradient-to-br from-fire-500/30 to-emerald-500/30'
                          : 'bg-slate-800'
                      }`}
                    >
                      <Clock
                        className={`w-5 h-5 ${
                          i === 0 ? 'text-fire-400 animate-pulse-slow' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100 truncate">
                          {(m as any).students?.full_name}
                        </span>
                        {i === 0 && (
                          <Badge variant="fire" size="sm">
                            <Sparkles className="w-2.5 h-2.5" /> Yakın
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{formatDateTime(m.meeting_date)}</span>
                        <span className="text-slate-600">·</span>
                        <span>{m.duration_minutes} dk</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrslate-0" />
                  </div>
                </Link>
              ))}
              {displayMeetings.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                  <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Yaklaşan görüşme yok.</p>
                </div>
              )}
              <Button
                asLink
                href="/dashboard/coach/meetings"
                variant="secondary"
                size="sm"
                className="w-full mt-1"
              >
                <Plus className="w-4 h-4" />
                Yeni görüşme planla
              </Button>
            </CardBody>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-5.5 h-5.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">
                      Son <span className="gradient-text">Programlar</span>
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">Atanan haftalık planlar</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asLink href="/dashboard/coach/programs">
                  Tümü <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-2.5 pt-2">
              {displayPrograms.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrslate-0">
                    <FileText className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-100 truncate">
                      {(p as any).students?.full_name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {formatDate(p.week_start_date)} haftası
                    </div>
                  </div>
                </div>
              ))}
              {displayPrograms.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                  Henüz program yok.
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-fire-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5.5 h-5.5 text-fire-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">
                      Koç <span className="gradient-text-fire">Notları</span>
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">Son bıraktığın mesajlar</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-2.5 pt-2 max-h-80 overflow-y-auto pr-1">
              {displayNotes.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-slate-800 bg-gradient-to-br from-fire-500/5 via-slate-900/40 to-emerald-500/5 p-3.5 hover:border-fire-500/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-200">
                      {(n as any).students?.full_name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatDateTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                    "{n.content}"
                  </p>
                </div>
              ))}
              {displayNotes.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                  Henüz not bırakmamışsın.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
