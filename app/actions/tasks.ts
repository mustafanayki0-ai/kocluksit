'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function toggleTaskStudent(formData: FormData) {
  const taskId = String(formData.get('task_id') ?? '').trim();
  const completedRaw = String(formData.get('is_completed') ?? 'false').toLowerCase();
  const isCompleted = completedRaw === '1' || completedRaw === 'true' || completedRaw === 'on';

  if (!taskId) {
    return { ok: false, error: 'Görev eksik' };
  }

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/login');
    }

    // Güvenlik: Görev bu öğrenciye ait mi? (RLS zaten engelliyor ama double check)
    const { data: task } = await supabase
      .from('tasks')
      .select('id, student_id')
      .eq('id', taskId)
      .maybeSingle();
    if (!task || task.student_id !== user.id) {
      return { ok: false, error: 'Bu görev size ait değil' };
    }

    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
      .eq('id', taskId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/dashboard/student');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Bilinmeyen hata' };
  }
}

export async function createTaskCoach(formData: FormData) {
  const studentId = String(formData.get('student_id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const taskDate = String(formData.get('task_date') ?? '').trim() || new Date().toISOString().slice(0, 10);

  if (!studentId || !title) return { ok: false, error: 'Öğrenci ve görev başlığı zorunlu' };

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Koç rolünde ve bu öğrenci onun altında mı?
    const { data: coachRow } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!coachRow || coachRow.role !== 'coach') return { ok: false, error: 'Yetkisiz' };

    const { data: studentRow } = await supabase
      .from('profiles')
      .select('id, coach_id')
      .eq('id', studentId)
      .maybeSingle();
    if (!studentRow || studentRow.coach_id !== user.id) {
      return { ok: false, error: 'Öğrenci size ait değil' };
    }

    const { error } = await supabase.from('tasks').insert({
      student_id: studentId,
      coach_id: user.id,
      title,
      description,
      task_date: taskDate,
      is_completed: false,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath('/dashboard/coach');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

export async function updateTaskCoach(formData: FormData) {
  const taskId = String(formData.get('task_id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const taskDate = String(formData.get('task_date') ?? '').trim() || null;
  const isCompleted = ['1', 'true', 'on'].includes(String(formData.get('is_completed') ?? '').toLowerCase());

  if (!taskId || !title) return { ok: false, error: 'Eksik alan' };

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: coach } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!coach || coach.role !== 'coach') return { ok: false, error: 'Yetkisiz' };

    const { data: task } = await supabase.from('tasks').select('coach_id').eq('id', taskId).maybeSingle();
    if (!task || task.coach_id !== user.id) return { ok: false, error: 'Görev size ait değil' };

    const payload: any = { title, description, updated_at: new Date().toISOString(), is_completed: isCompleted };
    if (taskDate) payload.task_date = taskDate;
    const { error } = await supabase.from('tasks').update(payload).eq('id', taskId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/dashboard/coach');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

export async function deleteTaskCoach(formData: FormData) {
  const taskId = String(formData.get('task_id') ?? '').trim();
  if (!taskId) return { ok: false, error: 'Task id eksik' };
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: coach } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!coach || coach.role !== 'coach') return { ok: false, error: 'Yetkisiz' };

    const { data: task } = await supabase.from('tasks').select('coach_id').eq('id', taskId).maybeSingle();
    if (!task || task.coach_id !== user.id) return { ok: false, error: 'Görev size ait değil' };

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/dashboard/coach');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}
