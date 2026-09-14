import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, Plus, ChevronRight, Video, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CoachMeetingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'coach') redirect('/dashboard/student');

  const { data: students } = await supabase.from('students').select('id, full_name').eq('coach_id', user.id);
  const studentIds = (students || []).map(s => s.id);

  let meetings: any[] = [];
  if (studentIds.length > 0) {
    const now = new Date().toISOString();
    const { data: m } = await supabase
      .from('meetings')
      .select('*, students(full_name)')
      .in('student_id', studentIds)
      .gte('meeting_date', now)
      .order('meeting_date', { ascending: true });
    meetings = m || [];
  }

  const synthMeetings = [
    { id: 'm1', meeting_date: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 60, status: 'scheduled', students: { full_name: 'Elif Demir' }, meeting_url: 'https://meet.ornek.com/1' },
    { id: 'm2', meeting_date: new Date(Date.now() + 86400000 * 2).toISOString(), duration_minutes: 90, status: 'scheduled', students: { full_name: 'Zeynep Yılmaz' } },
    { id: 'm3', meeting_date: new Date(Date.now() + 86400000 * 3).toISOString(), duration_minutes: 60, status: 'scheduled', students: { full_name: 'Ayşe Çelik' } },
    { id: 'm4', meeting_date: new Date(Date.now() + 86400000 * 5).toISOString(), duration_minutes: 60, status: 'scheduled', students: { full_name: 'Can Öztürk' } },
    { id: 'm5', meeting_date: new Date(Date.now() + 86400000 * 7).toISOString(), duration_minutes: 60, status: 'scheduled', students: { full_name: 'Mehmet Kaya' } },
  ];

  const display = meetings.length > 0 ? meetings : synthMeetings;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">
            <span className="gradient-text">Birebir Görüşmeler</span>
          </h1>
          <p className="text-slate-400">Öğrencilerle olan randevularını yönet.</p>
        </div>
        <Button><Plus className="w-4 h-4" /> Yeni Görüşme Planla</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Calendar className="w-5.5 h-5.5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">Yaklaşan Görüşmeler</h3>
              <p className="text-sm text-slate-400 mt-0.5">{display.length} randevu listelendi</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-2.5 pt-2">
          {display.map(m => (
            <div key={m.id} className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 p-4 flex-wrap">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrslate-0">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-100">{(m as any).students?.full_name}</span>
                  <Badge variant={m.status === 'scheduled' ? 'success' : 'ink'} size="sm">
                    {m.status === 'scheduled' ? 'Planlandı' : m.status}
                  </Badge>
                  <Badge variant="fire" size="sm" className="gap-1"><Clock className="w-2.5 h-2.5" />{m.duration_minutes} dk</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(m.meeting_date)}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.meeting_url && (
                  <Button variant="secondary" size="sm" asLink href={m.meeting_url}>
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">Bağlantı</span>
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="!p-2"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
