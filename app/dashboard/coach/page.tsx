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
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatDateTime, formatDate } from '@/lib/utils';

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
    try {
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
    } catch (e) {
      console.error('Coach dashboard veri hatası:', e);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
      <CoachWelcome
        profile={profile}
        stats={{
          students: students?.length || 0,
          meetings: upcomingMeetings.length,
          programs: recentPrograms.length,
          notes: recentNotes.length,
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
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Calendar className="w-5.5 h-5.5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">
                      <span className="gradient-text">Görüşmeler</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Gelecek {upcomingMeetings.length} randevun
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asLink href="/dashboard/coach/meetings">
                  Tümü <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-2.5 pt-2">
              {upcomingMeetings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Yaklaşan görüşme yok.
                  </p>
                </div>
              ) : (
                upcomingMeetings.slice(0, 4).map((m, i) => (
                  <Link
                    key={m.id}
                    href="#"
                    className="block rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 transition-all duration-300 p-3.5 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${
                          i === 0
                            ? 'bg-gradient-to-br from-orange-50 to-emerald-50 border border-orange-100'
                            : 'bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <Clock
                          className={`w-5 h-5 ${
                            i === 0 ? 'text-orange-500 animate-pulse-slow' : 'text-slate-500'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 truncate">
                            {(m as any).students?.full_name}
                          </span>
                          {i === 0 && (
                            <Badge variant="fire" size="sm">
                              <Sparkles className="w-2.5 h-2.5" /> Yakın
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{formatDateTime(m.meeting_date)}</span>
                          <span className="text-slate-300">·</span>
                          <span>{m.duration_minutes} dk</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                ))
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
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <FileText className="w-5.5 h-5.5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">
                      Son <span className="gradient-text">Programlar</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">Atanan haftalık planlar</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asLink href="/dashboard/coach/programs">
                  Tümü <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-2.5 pt-2">
              {recentPrograms.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Henüz program yok.
                </div>
              ) : (
                recentPrograms.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-800 truncate">
                        {(p as any).students?.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatDate(p.week_start_date)} haftası
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                    <MessageSquare className="w-5.5 h-5.5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">
                      Koç <span className="gradient-text">Notları</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">Son bıraktığın mesajlar</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-2.5 pt-2 max-h-80 overflow-y-auto pr-1">
              {recentNotes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Henüz not bırakmamışsın.
                </div>
              ) : (
                recentNotes.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50/60 via-white to-emerald-50/60 p-3.5 hover:border-orange-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">
                        {(n as any).students?.full_name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDateTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                      &quot;{n.content}&quot;
                    </p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
