'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function upsertMeetingCoach(formData: FormData) {
  const studentId = String(formData.get('student_id') ?? '').trim();
  const meetingDateRaw = String(formData.get('meeting_date') ?? '').trim();
  const durationRaw = String(formData.get('duration_minutes') ?? '60').trim();
  const meetingUrl = String(formData.get('meeting_url') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!studentId || !meetingDateRaw) return { ok: false, error: 'Öğrenci ve tarih zorunlu' };

  const duration = Number(durationRaw) || 60;
  const meetingDate = new Date(meetingDateRaw).toISOString();

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: coach } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!coach || coach.role !== 'coach') return { ok: false, error: 'Yetkisiz' };

    const { data: student } = await supabase.from('profiles').select('id, coach_id').eq('id', studentId).maybeSingle();
    if (!student || student.coach_id !== user.id) return { ok: false, error: 'Öğrenci size ait değil' };

    // student_id UNIQUE olduğu için upsert yapalım:
    const { data: existing } = await supabase
      .from('meetings')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('meetings')
        .update({
          coach_id: user.id,
          meeting_date: meetingDate,
          duration_minutes: duration,
          meeting_url: meetingUrl,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('meetings')
        .insert({
          student_id: studentId,
          coach_id: user.id,
          meeting_date: meetingDate,
          duration_minutes: duration,
          meeting_url: meetingUrl,
          notes,
        });
      if (error) return { ok: false, error: error.message };
    }
    revalidatePath('/dashboard/coach');
    revalidatePath('/dashboard/student');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}
