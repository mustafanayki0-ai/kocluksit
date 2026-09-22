'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, GraduationCap, CheckCircle2, UserRound, Briefcase, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'student' as 'student' | 'coach',
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

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone,
            role: form.role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Kayıt olunamadı, lütfen tekrar deneyin.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
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
              İster öğrenci, ister koç olun; başarı odaklı bir platformda yerinizi hemen alın.
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
                  Birkaç adım ile hesabını oluştur, koçluk deneyimine dahil ol.
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
                    label="Telefon (opsiyonel)"
                    placeholder="05XX XXX XX XX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    autoComplete="tel"
                    leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                  />
                </div>

                <Select
                  id="role"
                  label="Hesap Türü"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'student' | 'coach' })}
                  options={[
                    { value: 'student', label: 'Öğrenci' },
                    { value: 'coach', label: 'Koç / Eğitmen' },
                  ]}
                >
                </Select>

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

                <div className="flex items-center justify-center gap-4 pt-1">
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    form.role === 'student'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'text-slate-500 border-transparent'
                  }`}>
                    <UserRound className="w-3.5 h-3.5" />
                    Öğrenci
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    form.role === 'coach'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'text-slate-500 border-transparent'
                  }`}>
                    <Briefcase className="w-3.5 h-3.5" />
                    Koç
                  </span>
                </div>
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
