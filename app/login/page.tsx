'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, GraduationCap, CheckCircle2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
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
        <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-sky-600 text-white">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-orange-400/20 blur-3xl" />
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
              <Sparkles className="w-3 h-3 mr-1" /> Güvenli Giriş
            </Badge>

            <h1 className="font-display font-bold text-4xl sm:text-5xl leading-tight text-balance">
              Başarmak için doğru adımı at.
            </h1>
            <p className="text-white/85 text-lg max-w-md leading-relaxed">
              Koçunla, programınla ve gelişiminle her zaman iletişimde kal. Panelin senin bekliyor.
            </p>

            <ul className="space-y-3.5 max-w-md">
              {[
                'Kişisel koçunla birebir görüşmeler',
                'Haftalık programın ve görevlerin tek ekranda',
                'TYT & AYT gelişim grafikleri ile net takip',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-100" strokeWidth={2.5} />
                  <span className="text-white/90 text-sm leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative text-xs text-white/70 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            SSL ile güvenli bağlantı · KVKK uyumlu veri işleme
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16 animate-fade-in">
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
              <div className="mb-7">
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mb-1.5">
                  Tekrar hoş geldin 👋
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Paneline girmek için e-posta ve şifreni gir. Eğer yeniysen aşağıdan hesap oluştur.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4.5">
                <Input
                  id="email"
                  type="email"
                  label="E-posta Adresi"
                  placeholder="ornek@sigmamentorluk.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="label !mb-0">Şifre</label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Şifremi unuttum
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pl-10 pr-12"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
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
                  Giriş Yap
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
                      setError(e?.message ?? 'Google ile giriş yapılamadı.');
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
                  Google ile Giriş Yap
                </button>
              </form>

              <div className="divider-soft my-6" />

              <p className="text-center text-sm text-slate-500">
                Henüz hesabın yok mu?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-4"
                >
                  Ücretsiz kayıt ol
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Giriş yaparak Kullanım Şartları &apos;nı kabul etmiş olursun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
