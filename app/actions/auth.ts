'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function registerStudent(formData: FormData) {
  const supabase = createClient();

  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!fullName || !email || !phone || !password) {
    return { ok: false, error: 'Tüm alanlar zorunludur' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Şifre en az 6 karakter olmalı' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role: 'student',
        },
      },
    });

    if (error) return { ok: false, error: error.message };
    if (!data?.user) return { ok: false, error: 'Kullanıcı oluşturulamadı' };

    const userId = data.user.id;

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: fullName,
          email,
          phone,
          role: 'student',
        },
        { onConflict: 'id' }
      );

    if (upsertError) {
      return { ok: false, error: upsertError.message };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Beklenmedik hata' };
  }
}
