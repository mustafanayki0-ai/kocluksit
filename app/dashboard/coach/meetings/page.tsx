import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, Plus, ChevronRight, Video, Clock, AlertCircle } from 'lucide-react';
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
    try {
      const now = new Date().toISOString();
      const { data: m } = await supabase
        .from('meetings')
        .select('*, students(full_name)')
        .in('student_id', studentIds)
        .gte('meeting_date', now)
        .order('meeting_date', { ascending: true });
      meetings = m || [];
    } catch (e) {
      console.error('Meetings sayfası veri hatası:', e);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">
            <span className="gradient-text">Birebir Görüşmeler</span>
          </h1>
          <p className="text-slate-500">Öğrencilerle olan randevularını yönet.</p>
        </div>
        <Button><Plus className="w-4 h-4" /> Yeni Görüşme Planla</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Calendar className="w-5.5 h-5.5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">Yaklaşan Görüşmeler</h3>
              <p className="text-sm text-slate-500 mt-0.5">{meetings.length} randevu listelendi</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-2.5 pt-2">
          {meetings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium mb-1">Henüz planlanmış görüşme yok</p>
              <p className="text-sm text-slate-400">Yeni bir görüşme planlamak için yukarıdaki butonu kullan.</p>
            </div>
          ) : (
            meetings.map(m => (
              <div key={m.id} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 transition-all duration-300 p-4 flex-wrap">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{(m as any).students?.full_name}</span>
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
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
