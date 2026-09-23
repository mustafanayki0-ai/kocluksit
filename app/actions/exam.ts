'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function addExamResult(formData: FormData) {
  const studentId = String(formData.get('student_id') ?? '').trim();
  const examType = String(formData.get('exam_type') ?? '').trim() as 'TYT' | 'AYT';
  const examDate = String(formData.get('exam_date') ?? '').trim() || new Date().toISOString().slice(0, 10);
  const netRaw = String(formData.get('net_score') ?? '').trim();

  if (!examType || !['TYT', 'AYT'].includes(examType)) return { ok: false, error: 'Sınav türü geçersiz' };
  if (!netRaw) return { ok: false, error: 'Net sayısı zorunlu' };
  const net = Number(netRaw);
  if (Number.isNaN(net) || net < 0) return { ok: false, error: 'Net sayısı geçersiz' };

  const maxNet = examType === 'TYT' ? 120 : 80;
  if (net > maxNet) return { ok: false, error: `${examType} için maksimum net ${maxNet} olabilir` };

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!me) return { ok: false, error: 'Profil bulunamadı' };

    let targetStudentId: string;

    if (me.role === 'student') {
      if (studentId && studentId !== user.id) return { ok: false, error: 'Kendiniz için ekleyebilirsiniz' };
      targetStudentId = user.id;
    } else if (me.role === 'coach') {
      if (!studentId) return { ok: false, error: 'Öğrenci seçmelisiniz' };
      const { data: student } = await supabase.from('profiles').select('id, coach_id').eq('id', studentId).maybeSingle();
      if (!student || student.coach_id !== user.id) return { ok: false, error: 'Bu öğrenci size ait değil' };
      targetStudentId = studentId;
    } else {
      return { ok: false, error: 'Rol tanınmadı' };
    }

    const payload: any = {
      student_id: targetStudentId,
      exam_type: examType,
      exam_date: examDate,
      net_score: net,
    };

    const { error } = await supabase.from('exam_results').insert(payload);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/dashboard/student');
    revalidatePath('/dashboard/coach');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}
