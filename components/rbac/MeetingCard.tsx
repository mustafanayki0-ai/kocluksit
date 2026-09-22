'use client';

import { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Video, Clock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Meeting } from '@/lib/types';
import { formatDateTime, getCountdownParts } from '@/lib/utils';

interface MeetingCardProps {
  studentId: string;
  coachId?: string;
  meetings: Meeting[];
  mode: 'student' | 'coach';
  loading?: boolean;
  onMutation?: () => Promise<void>;
}

function getNext(meetings: Meeting[]) {
  const now = Date.now();
  return meetings
    .filter((m) => new Date(m.meeting_date).getTime() >= now - 1000 * 60 * 60 * 24)
    .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())[0];
}

function Countdown({ date }: { date: string }) {
  const [now, setNow] = useState(() => Date.now());
  useMemo(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const parts = getCountdownParts(date, new Date(now).toISOString());
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {[
        { label: 'Gün', value: parts.days },
        { label: 'Saat', value: parts.hours },
        { label: 'Dakika', value: parts.minutes },
      ].map((p) => (
        <div
          key={p.label}
          className="rounded-xl bg-slate-900 text-white px-3 py-2 min-w-[60px] text-center shadow-lg shadow-slate-900/10"
        >
          <div className="font-display font-bold text-xl leading-none">{String(p.value).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase tracking-widest mt-1 opacity-70">{p.label}</div>
        </div>
      ))}
    </div>
  );
}

export function MeetingCard({ studentId, coachId, meetings, mode, loading, onMutation }: MeetingCardProps) {
  const supabase = createClient();
  const toast = useToast();

  const nextMeeting = useMemo(() => getNext(meetings ?? []), [meetings]);
  const isCoach = mode === 'coach';

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    meeting_date: nextMeeting
      ? new Date(nextMeeting.meeting_date).toISOString().slice(0, 16)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          d.setHours(19, 0, 0, 0);
          return d.toISOString().slice(0, 16);
        })(),
    duration_minutes: nextMeeting?.duration_minutes ?? 60,
    meeting_url: nextMeeting?.meeting_url ?? '',
    notes: nextMeeting?.notes ?? '',
  });

  const openEdit = () => {
    if (nextMeeting) {
      setForm({
        meeting_date: new Date(nextMeeting.meeting_date).toISOString().slice(0, 16),
        duration_minutes: nextMeeting.duration_minutes ?? 60,
        meeting_url: nextMeeting.meeting_url ?? '',
        notes: nextMeeting.notes ?? '',
      });
    }
    setEditing(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachId) {
      toast.error('Koç bilgisi eksik');
      return;
    }
    if (!form.meeting_date) {
      toast.warning('Görüşme tarihi gerekli');
      return;
    }
    setSaving(true);
    try {
      if (nextMeeting) {
        const { error } = await supabase
          .from('meetings')
          .update({
            meeting_date: new Date(form.meeting_date).toISOString(),
            duration_minutes: Number(form.duration_minutes) || 60,
            meeting_url: form.meeting_url.trim() || null,
            notes: form.notes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', nextMeeting.id);
        if (error) throw error;
        toast.success('Görüşme güncellendi', formatDateTime(new Date(form.meeting_date).toISOString()));
      } else {
        const { error } = await supabase.from('meetings').insert({
          student_id: studentId,
          coach_id: coachId,
          meeting_date: new Date(form.meeting_date).toISOString(),
          duration_minutes: Number(form.duration_minutes) || 60,
          meeting_url: form.meeting_url.trim() || null,
          notes: form.notes.trim() || null,
          status: 'scheduled',
        });
        if (error) throw error;
        toast.success('Görüşme planlandı', formatDateTime(new Date(form.meeting_date).toISOString()));
      }
      setEditing(false);
      if (onMutation) await onMutation();
    } catch (err: any) {
      toast.error('Görüşme kaydedilemedi', err?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50">
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-orange-500/15 blur-3xl" />
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-orange-500" />
              <h3 className="font-display font-bold text-lg text-slate-900">Sıradaki Görüşme</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isCoach ? 'Öğrenciyle bir sonraki planlanan birebir görüşme.' : 'Koçun ile bir sonraki birebir görüşmen.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {nextMeeting && (
              <Badge variant="fire" size="md" className="gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Planlandı
              </Badge>
            )}
            {isCoach && !loading && (
              <Button size="sm" type="button" onClick={() => (editing ? setEditing(false) : openEdit())} variant={editing ? 'ghost' : 'secondary'} className="gap-1.5">
                {editing ? 'İptal' : nextMeeting ? 'Güncelle' : 'Planla'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-64" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !nextMeeting && !editing ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-slate-800">Henüz planlanmış bir görüşme yok</p>
              <p className="text-sm text-slate-500 mt-1">
                {isCoach
                  ? 'Bu öğrenci için ilk görüşmeyi sağ üstten Planla butonu ile oluşturabilirsin.'
                  : 'Koçun bir görüşme planladığında burada bildirim olarak göreceksin. Sabırsızlanma!'}
              </p>
            </div>
          </div>
        ) : editing ? (
          <form onSubmit={save} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Görüşme Tarihi & Saati *
                </span>
                <input
                  type="datetime-local"
                  value={form.meeting_date}
                  onChange={(e) => setForm((c) => ({ ...c, meeting_date: e.target.value }))}
                  className="input mt-1.5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Süre (dk)
                </span>
                <input
                  type="number"
                  min={15}
                  step={5}
                  value={form.duration_minutes}
                  onChange={(e) => setForm((c) => ({ ...c, duration_minutes: Number(e.target.value) }))}
                  className="input mt-1.5"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Video className="w-3 h-3" /> Toplantı Linki (Zoom / Meet)
              </span>
              <input
                type="url"
                value={form.meeting_url}
                onChange={(e) => setForm((c) => ({ ...c, meeting_url: e.target.value }))}
                placeholder="https://..."
                className="input mt-1.5"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Notlar (opsiyonel)</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
                placeholder="Görüşme gündemi, beklentiler, hazırlıklar..."
                className="input mt-1.5 min-h-[80px]"
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                İptal
              </Button>
              <Button type="submit" loading={saving} size="sm" className="gap-1.5">
                <Save className="w-4 h-4" />
                {nextMeeting ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white border border-slate-200 p-5">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-500 mb-2">
                  Tarih & Saat
                </p>
                <p className="font-display font-bold text-xl text-slate-900 leading-tight">
                  {formatDateTime(nextMeeting.meeting_date)}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {nextMeeting.duration_minutes} dakika · {nextMeeting.status === 'scheduled' ? 'Planlandı' : nextMeeting.status}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-5 flex flex-col items-start">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-orange-700 mb-3">
                  Kalan Süre
                </p>
                <Countdown date={nextMeeting.meeting_date} />
              </div>
            </div>
            {nextMeeting.meeting_url && (
              <div className="rounded-xl bg-sky-50 border border-sky-100 p-4 flex items-start gap-3">
                <Video className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">Toplantı Linki</p>
                  <a
                    href={nextMeeting.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-sky-800 hover:underline break-all"
                  >
                    {nextMeeting.meeting_url}
                  </a>
                </div>
              </div>
            )}
            {nextMeeting.notes && (
              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-500 mb-2">
                  {isCoach ? 'Koç Notları' : 'Görüşme Notların'}
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{nextMeeting.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
