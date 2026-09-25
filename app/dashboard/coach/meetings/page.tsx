'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Users, Sparkles, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { MeetingCard } from '@/components/rbac/MeetingCard';
import { useMeetingNotifications } from '@/hooks/useMeetingNotifications';
import type { Meeting, Student } from '@/lib/types';

export default function CoachMeetingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useMeetingNotifications({
    userId: coachId,
    mode: 'coach',
    enabled: !!coachId,
    requestPermission: true,
  });

  async function loadAll() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setCoachId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role !== 'coach') {
        router.replace('/dashboard/student');
        return;
      }

      const { data: studs, error: sErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, coach_id, role, phone, target_university, target_department, created_at, updated_at')
        .eq('coach_id', user.id)
        .eq('role', 'student')
        .order('full_name', { ascending: true, nullsFirst: false });

      if (sErr) throw sErr;
      const list = ((studs ?? []).map((r) => ({
        ...r,
        full_name: r.full_name ?? 'İsimsiz Öğrenci',
        email: r.email ?? '',
        role: 'student' as const,
      })) as unknown) as Student[];
      setStudents(list);

      const ids = list.map((s) => s.id);
      if (ids.length > 0) {
        const { data: m, error: mErr } = await supabase
          .from('meetings')
          .select('*')
          .in('student_id', ids)
          .order('meeting_date', { ascending: false });
        if (mErr) throw mErr;
        setMeetings((m as Meeting[]) ?? []);
      } else {
        setMeetings([]);
      }
    } catch (err: any) {
      toast.error('Veriler yüklenemedi', err?.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-sky-50/40 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-emerald-100/50 blur-3xl" />
          <div className="relative space-y-5">
            <button
              type="button"
              onClick={() => router.push('/dashboard/coach')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Ana Panöle Dön
            </button>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="brand" size="md" className="gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    KOÇ PANELİ
                  </Badge>
                  <Badge variant="fire" size="md" className="gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Görüşme Yönetimi
                  </Badge>
                </div>
                <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
                  Birebir <span className="gradient-text">Görüşmeler</span>
                </h1>
                <p className="mt-2 text-slate-600 max-w-2xl text-sm sm:text-base">
                  Tüm öğrencilerinin planlanmış görüşmelerini buradan yönetebilir,
                  yeni toplantı planlayabilir ve tarih yaklaşırken bildirim alabilirsin.
                </p>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white">
                  <Calendar className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 leading-tight">
                    {meetings.filter((m) => new Date(m.meeting_date).getTime() >= Date.now() - 6 * 60 * 60 * 1000).length}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Yaklaşan görüşme
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <MeetingCard
          meetings={meetings}
          mode="coach"
          coachId={coachId ?? undefined}
          students={students}
          loading={loading}
          onMutation={loadAll}
        />
      </div>
    </div>
  );
}
