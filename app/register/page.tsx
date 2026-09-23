'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, GraduationCap, CheckCircle2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { registerStudent } from '@/app/actions/auth';

export default function RegisterPage() {
  const supabase = createClient();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password.length < 6) {
      setError('Şifreniz en az 6 karakter olmalıdır.');
      setLoading(false);
      return;
    }
    if (!form.phone.trim()) {
      setError('Telefon numarası zorunludur.');
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.set('fullName', form.fullName);
      fd.set('email', form.email);
      fd.set('phone', form.phone);
      fd.set('password', form.password);

      const result = await registerStudent(fd);
      if (!result.ok) {
        setError(result.error || 'Kayıt olunamadı.');
        setLoading(false);
        return;
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-hero-wash">
      <div className="grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
        <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-sky-500 via-sky-600 to-emerald-600 text-white">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-orange-400/20 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />

          <div className="relative flex items-center gap-2.5">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm">
              <GraduationCap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">
              Sigma Mentörlük
            </span>
          </div>

          <div className="relative space-y-8 z-10">
            <Badge variant="accent" size="md" className="bg-white/15 border-white/20 text-white backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" /> Ücretsiz Başlangıç
            </Badge>

            <h1 className="font-display font-bold text-4xl sm:text-5xl leading-tight text-balance">
              Yolculuğa şimdi katıl.
            </h1>
            <p className="text-white/85 text-lg max-w-md leading-relaxed">
              YKS yolculuğunda hedefine ulaşmak için hemen aramıza katıl.
            </p>

            <ul className="space-y-3.5 max-w-md">
              {[
                'Kişiselleştirilmiş öğrenme yolculuğu',
                '7/24 panel erişimi, kaybolmayan veriler',
                'Koç ile anlık iletişim ve geri bildirim',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-sky-100" strokeWidth={2.5} />
                  <span className="text-white/90 text-sm leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative text-xs text-white/70 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Kurumsal güvenlik · Şifreli iletişim
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14 animate-fade-in">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20">
                <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-900">
                Sigma <span className="gradient-text">Mentörlük</span>
              </span>
            </div>

            <div className="form-card animate-slide-up">
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-1.5">
                  Hesap oluştur ✨
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Birkaç adım ile öğrenci hesabını oluştur, koçluk deneyimine dahil ol.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  id="fullName"
                  type="text"
                  label="Ad Soyad"
                  placeholder="Örn: Ahmet Yılmaz"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  autoComplete="name"
                  required
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="email"
                    type="email"
                    label="E-posta"
                    placeholder="ornek@mail.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                    required
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  />
                  <Input
                    id="phone"
                    type="tel"
                    label="Telefon Numarası"
                    placeholder="05XX XXX XX XX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    autoComplete="tel"
                    required
                    leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="label">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pl-10 pr-12"
                      placeholder="En az 6 karakter"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Şifre görünürlüğü"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200">
                    {error}
                  </div>
                )}

                <Button variant="primary" className="w-full !py-3" loading={loading} type="submit">
                  Hesabı Oluştur
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white text-xs font-medium text-slate-400">
                      veya
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
                        },
                      });
                    } catch (e: any) {
                      setError(e?.message ?? 'Google ile kayıt olunamadı.');
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold text-sm shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow transition"
                >
                  <svg
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                    className="w-5 h-5"
                  >
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.795 2.251-2.291 4.223-4.197 5.57l6.19 5.238C37.14 37.099 44 30.636 44 24c0-1.341-.138-2.65-.389-3.917z" />
                  </svg>
                  Google ile Kayıt Ol
                </button>
              </form>

              <div className="divider-soft my-6" />

              <p className="text-center text-sm text-slate-500">
                Zaten hesabın var mı?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-4"
                >
                  Giriş yap
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Kayıtarak Kullanım Şartları & Gizlilik Politikası &apos;nı kabul etmiş olursun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
