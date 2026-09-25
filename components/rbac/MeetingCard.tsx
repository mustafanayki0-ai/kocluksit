'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, ListSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar,
  Video,
  Clock,
  Save,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  PenLine,
  Users,
  ChevronRight,
  BellRing,
  MapPin,
} from 'lucide-react';
import type { Meeting, Student } from '@/lib/types';
import { cn, formatDateTime, formatDateTimeRange, getCountdownParts, minutesUntil } from '@/lib/utils';

interface MeetingCardProps {
  studentId?: string;
  coachId?: string;
  meetings: Meeting[];
  mode: 'student' | 'coach';
  loading?: boolean;
  onMutation?: () => Promise<void>;
  students?: Student[];
}

type MeetingWithRelative = Meeting & { minutesUntil: number };

function getSortedUpcoming(meetings: Meeting[]): MeetingWithRelative[] {
  const now = Date.now();
  return meetings
    .filter((m) => new Date(m.meeting_date).getTime() >= now - 1000 * 60 * 60 * 6)
    .map((m) => ({ ...m, minutesUntil: minutesUntil(m.meeting_date, new Date()) }))
    .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime());
}

function getPast(meetings: Meeting[]): MeetingWithRelative[] {
  const now = Date.now();
  return meetings
    .filter((m) => new Date(m.meeting_date).getTime() < now - 1000 * 60 * 60 * 6)
    .map((m) => ({ ...m, minutesUntil: minutesUntil(m.meeting_date, new Date()) }))
    .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());
}

function Countdown({ date }: { date: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const parts = getCountdownParts(new Date(date), new Date(now));
  const items = [
    { label: 'Gün', value: parts.days, hideIfZero: false },
    { label: 'Saat', value: parts.hours, hideIfZero: parts.days === 0 && parts.hours === 0 },
    { label: 'Dakika', value: parts.minutes, hideIfZero: parts.days === 0 && parts.hours === 0 && parts.minutes === 0 },
    { label: 'Saniye', value: parts.seconds, hideIfZero: false },
  ].filter((x) => !x.hideIfZero || x.value > 0);
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {items.map((p) => (
        <div
          key={p.label}
          className="rounded-xl bg-slate-900 text-white px-2.5 py-2 min-w-[48px] text-center shadow-lg shadow-slate-900/10"
        >
          <div className="font-display font-bold text-lg leading-none">{String(p.value).padStart(2, '0')}</div>
          <div className="text-[9px] uppercase tracking-widest mt-0.5 opacity-70">{p.label}</div>
        </div>
      ))}
    </div>
  );
}

function defaultLocalIso(offsetDays = 7, hour = 19, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function localDateTimeToIsoUtc(localYmdHi: string): string {
  return new Date(localYmdHi).toISOString();
}

function isoUtcToLocalYmdHi(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function UrgencyBadge({ m }: { m: MeetingWithRelative }) {
  const min = m.minutesUntil;
  if (min < -10)
    return <Badge variant="ink" size="sm">Tamamlandı</Badge>;
  if (min < 5)
    return <Badge variant="fire" size="sm" className="gap-1.5"><BellRing className="w-3 h-3" /> ÇOK YAKIN</Badge>;
  if (min < 35)
    return <Badge variant="warning" size="sm" className="gap-1.5"><BellRing className="w-3 h-3" /> Başlamak üzere</Badge>;
  if (min < 60 * 6)
    return <Badge variant="success" size="sm" className="gap-1.5"><Clock className="w-3 h-3" /> Bugün</Badge>;
  return <Badge variant="fire" size="sm" className="gap-1.5"><CheckCircle2 className="w-3 h-3" /> Planlandı</Badge>;
}

export function MeetingCard({
  studentId,
  coachId,
  meetings,
  mode,
  loading,
  onMutation,
  students = [],
}: MeetingCardProps) {
  const supabase = createClient();
  const toast = useToast();

  const isCoach = mode === 'coach';
  const upcoming = useMemo(() => getSortedUpcoming(meetings ?? []), [meetings]);
  const past = useMemo(() => getPast(meetings ?? []), [meetings]);
  const nextMeeting = upcoming[0] ?? null;

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const emptyStudent = students[0]?.id ?? studentId ?? '';
  const [form, setForm] = useState({
    title: '',
    student_id: emptyStudent,
    meeting_date: defaultLocalIso(7, 19, 0),
    duration_minutes: 60,
    meeting_url: '',
    notes: '',
  });

  useEffect(() => {
    if (!form.student_id) {
      setForm((c) => ({ ...c, student_id: students[0]?.id ?? studentId ?? '' }));
    }
  }, [students, studentId, form.student_id]);

  const resetForm = (withMeeting?: Meeting | null) => {
    setForm({
      title: withMeeting?.title ?? '',
      student_id: withMeeting?.student_id ?? students[0]?.id ?? studentId ?? '',
      meeting_date: withMeeting ? isoUtcToLocalYmdHi(withMeeting.meeting_date) : defaultLocalIso(7, 19, 0),
      duration_minutes: withMeeting?.duration_minutes ?? 60,
      meeting_url: withMeeting?.meeting_url ?? '',
      notes: withMeeting?.notes ?? '',
    });
  };

  const openCreate = () => {
    resetForm(null);
    if (!form.student_id && students[0]?.id) {
      setForm((c) => ({ ...c, student_id: students[0].id }));
    }
    if (studentId) {
      setForm((c) => ({ ...c, student_id: studentId }));
    }
    setCreating(true);
    setEditingId(null);
  };

  const openEdit = (m: Meeting) => {
    resetForm(m);
    setEditingId(m.id);
    setCreating(false);
  };

  const closeForm = () => {
    setCreating(false);
    setEditingId(null);
    setSaving(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCoach && !coachId) {
      toast.error('Koç bilgisi eksik');
      return;
    }
    if (!form.student_id) {
      toast.warning('Lütfen bir öğrenci seçin');
      return;
    }
    if (!form.meeting_date) {
      toast.warning('Görüşme tarihi gerekli');
      return;
    }
    const chosen = new Date(form.meeting_date);
    if (Number.isNaN(chosen.getTime())) {
      toast.warning('Görüşme tarihi geçersiz');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id,
        coach_id: isCoach ? coachId! : undefined,
        title: form.title.trim() || null,
        meeting_date: localDateTimeToIsoUtc(form.meeting_date),
        duration_minutes: Number(form.duration_minutes) || 60,
        meeting_url: form.meeting_url.trim() || null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase.from('meetings').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Görüşme güncellendi', formatDateTimeRange(payload.meeting_date, payload.duration_minutes));
      } else {
        const { error } = await supabase.from('meetings').insert(payload);
        if (error) throw error;
        toast.success('Görüşme planlandı 🎯', formatDateTimeRange(payload.meeting_date, payload.duration_minutes));
      }
      closeForm();
      if (onMutation) await onMutation();
    } catch (err: any) {
      toast.error('Görüşme kaydedilemedi', err?.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!isCoach) return;
    if (deletingId) return;
    if (!confirm('Bu görüşmeyi silmek istediğine emin misin?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
      toast.info('Görüşme silindi');
      if (onMutation) await onMutation();
    } catch (err: any) {
      toast.error('Görüşme silinemedi', err?.message);
    } finally {
      setDeletingId(null);
    }
  };

  const renderForm = () => {
    return (
      <form onSubmit={save} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h4 className="font-display font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              {editingId ? 'Görüşmeyi Güncelle' : 'Yeni Görüşme Planla'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarih ve saat yerel saat diliminde alınır, veritabanına ISO (UTC) olarak kaydedilir.
            </p>
          </div>
          <Badge variant="accent" size="sm" className="gap-1.5">
            <Plus className="w-3 h-3" /> {editingId ? 'Güncelleme Modu' : 'Yeni Kayıt'}
          </Badge>
        </div>

        {isCoach && (students.length > 0 || !!form.student_id) && (
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Users className="w-3 h-3" /> Öğrenci *
            </span>
            <select
              value={form.student_id}
              onChange={(e) => setForm((c) => ({ ...c, student_id: e.target.value }))}
              disabled={!!studentId && students.length === 0}
              className="input mt-1.5"
            >
              {students.length === 0 && studentId ? (
                <option value={studentId}>Seçili Öğrenci</option>
              ) : (
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || 'İsimsiz Öğrenci'}
                    {s.email ? ` · ${s.email}` : ''}
                  </option>
                ))
              )}
            </select>
          </label>
        )}

        <div className="grid sm:grid-cols-[2fr_1fr_1fr] gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Görüşme Başlığı
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
              placeholder="Haftalık Birebir · Deneme Analizi · Hedef Belirleme..."
              className="input mt-1.5"
              maxLength={120}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Tarih & Saat *
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
          <span className="text-xs font-semibold text-slate-600">Notlar (gündem, hazırlıklar)</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
            placeholder="Son deneme analizi, ders programı revizesi, aile ile gündem..."
            className="input mt-1.5 min-h-[88px]"
          />
        </label>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
            İptal
          </Button>
          <Button type="submit" loading={saving} size="sm" className="gap-1.5">
            <Save className="w-4 h-4" />
            {editingId ? 'Güncelle' : 'Planla'}
          </Button>
        </div>
      </form>
    );
  };

  const renderMeetItem = (m: MeetingWithRelative, { faded = false }: { faded?: boolean }) => {
    const editing = editingId === m.id;
    const mins = m.minutesUntil;
    const isVerySoon = mins >= 0 && mins <= 120;
    return (
      <li
        key={m.id}
        className={cn(
          'rounded-2xl border p-4 sm:p-5 transition-all',
          faded ? 'opacity-60 border-slate-200 bg-slate-50/60' : isVerySoon
            ? 'border-orange-200 bg-gradient-to-br from-orange-50/80 to-amber-50/60 shadow-sm shadow-orange-500/5'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
        )}
      >
        {editing ? (
          renderForm()
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {m.title ? (
                    <h4 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-tight">
                      {m.title}
                    </h4>
                  ) : (
                    <h4 className="font-display font-bold text-base sm:text-lg text-slate-800 leading-tight">
                      Birebir Görüşme
                    </h4>
                  )}
                  <UrgencyBadge m={m} />
                </div>
                <p className="text-sm text-slate-600 flex items-center gap-1.5 flex-wrap">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDateTimeRange(m.meeting_date, m.duration_minutes)}
                  {nextMeeting?.id === m.id && mins > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 text-white ml-1">
                      <BellRing className="w-3 h-3" />
                      Sıradaki
                    </span>
                  )}
                </p>
              </div>
              {isCoach && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(m)}
                    className="gap-1 !py-1 !px-2"
                  >
                    <PenLine className="w-3.5 h-3.5" /> Düzenle
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(m.id)}
                    loading={deletingId === m.id}
                    className="gap-1 !py-1 !px-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Sil
                  </Button>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-[1.2fr_1fr] gap-4">
              <div className="space-y-2">
                {m.meeting_url && (
                  <div className="rounded-xl bg-sky-50 border border-sky-100 p-3.5 flex items-start gap-3">
                    <Video className="w-4.5 h-4.5 text-sky-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 mb-0.5">
                        Toplantı Linki
                      </p>
                      <a
                        href={m.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-sky-800 hover:underline break-all inline-flex items-center gap-1"
                      >
                        {m.meeting_url} <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
                {m.notes && (
                  <div className="rounded-xl bg-white border border-slate-200 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      {isCoach ? 'Koç Notları' : 'Görüşme Notların'}
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {m.notes}
                    </p>
                  </div>
                )}
                {!m.meeting_url && !m.notes && !m.title && (
                  <p className="text-xs text-slate-500 italic">
                    Link ve notlar için görüşmeyi Düzenle butonu ile güncelleyebilirsin.
                  </p>
                )}
              </div>

              {nextMeeting?.id === m.id && mins > 0 ? (
                <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-4 flex flex-col items-start">
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-orange-700 mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Başlamasına Kalan
                  </p>
                  <Countdown date={m.meeting_date} />
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col items-start gap-1">
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Süre Bilgisi
                  </p>
                  <p className="font-display font-extrabold text-xl text-slate-900 leading-none">
                    {m.duration_minutes} dk
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {mins >= 0 ? `${mins} dakika sonra başlayacak` : `${Math.abs(mins)} dakika önce tamamlandı`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50">
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-orange-500/15 blur-3xl" />
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-orange-500" />
              <h3 className="font-display font-bold text-lg text-slate-900">
                {isCoach ? 'Öğrenci Görüşmeleri' : 'Yaklaşan Görüşmelerim'}
              </h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isCoach
                ? 'Öğrencilerinin planlanmış, çok yakın ve geçmiş görüşmeleri.'
                : 'Koçunun ile planladığın yaklaşan toplantılar ve hatırlatmalar.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="fire" size="md" className="gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> {upcoming.length} planlanan
            </Badge>
            {isCoach && !loading && (
              <Button
                size="sm"
                type="button"
                onClick={() => (creating || editingId ? closeForm() : openCreate())}
                variant={creating || editingId ? 'ghost' : 'secondary'}
                className="gap-1.5"
              >
                {creating || editingId ? 'İptal' : '+ Görüşme Planla'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        {(creating && !editingId) && renderForm()}

        {loading ? (
          <ListSkeleton count={3} />
        ) : upcoming.length === 0 && past.length === 0 && !creating ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-slate-800">Henüz planlanmış bir görüşme yok</p>
              <p className="text-sm text-slate-500 mt-1">
                {isCoach
                  ? 'Yukarıdaki "+ Görüşme Planla" butonu ile ilk kaydı oluşturabilirsin.'
                  : 'Koçun bir görüşme planladığında burada bildirim olarak göreceksin. Sabırsızlanma! 🎯'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {upcoming.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Gelecek Görüşmeler ({upcoming.length})
                  </h4>
                </div>
                <ul className="space-y-2.5">
                  {upcoming.map((m) => renderMeetItem(m, { faded: false }))}
                </ul>
              </div>
            )}

            {past.length > 0 && (
              <details className="group rounded-2xl border border-slate-200 bg-white/70">
                <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-2 select-none">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Geçmiş Görüşmeler ({past.length})
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-3 pb-4 pt-1">
                  <ul className="space-y-2.5">
                    {past.map((m) => renderMeetItem(m, { faded: true }))}
                  </ul>
                </div>
              </details>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
