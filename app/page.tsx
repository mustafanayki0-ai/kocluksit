import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Flame,
  Target,
  Calendar,
  BarChart3,
  ListTodo,
  MessageSquare,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  Award,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Users2,
  Handshake,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = createClient();
  let user = null;
  let profile = null;

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      profile = profileData;
    }
  } catch {
    user = null;
    profile = null;
  }

  if (user && profile) {
    if (profile.role === 'coach') {
      redirect('/dashboard/coach');
    } else {
      redirect('/dashboard/student');
    }
  }

  const features = [
    {
      icon: Target,
      title: 'Kişiselleştirilmiş Haftalık Program',
      desc:
        'Koçun tarafından sadece sana özel hazırlanan haftalık çalışma planları, PDF ve metin desteği ile programını hiç kaçırma.',
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      softBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      icon: Calendar,
      title: 'Düzenli Birebir Görüşmeler',
      desc:
        'Belirlenen takvimde online koçluk seansları, ilerlemeni masaya yatırır, eksiklerini birlikte kapatırsın.',
      color: 'sky',
      gradient: 'from-sky-500 to-sky-600',
      softBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      border: 'border-sky-100',
    },
    {
      icon: BarChart3,
      title: 'TYT & AYT Gelişim Grafikleri',
      desc:
        'Girdiğin her denemenin netini kaydet, zaman içinde hangi derste ne kadar ilerlediğini görsel olarak takip et.',
      color: 'navy',
      gradient: 'from-slate-600 to-slate-700',
      softBg: 'bg-slate-50',
      iconColor: 'text-blue-950700',
      border: 'border-slate-100',
    },
    {
      icon: ListTodo,
      title: 'Günlük Hedefler ve Görevler',
      desc:
        'Her gün yapacağın çalışmayı küçük adımlara böl, işaretledikçe ilerle hisset. Disiplin = sonuç.',
      color: 'ember',
      gradient: 'from-orange-500 to-orange-600',
      softBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      border: 'border-orange-100',
    },
    {
      icon: MessageSquare,
      title: 'Koçundan Özel Notlar',
      desc:
        'Geribildirimler, motivasyon mesajları, önemli hatırlatmalar... Koçun her zaman seninle.',
      color: 'emerald',
      gradient: 'from-emerald-500 to-sky-500',
      softBg: 'bg-emerald-50/60',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      icon: Award,
      title: 'Hedef Odaklı İlerleme',
      desc:
        'Hayalindeki üniversite ve bölümü yaz. Her çalışma günü, seni o hedefe bir adım daha yaklaştıran plana dönüşür.',
      color: 'sky',
      gradient: 'from-sky-500 to-slate-600',
      softBg: 'bg-sky-50/80',
      iconColor: 'text-sky-700',
      border: 'border-sky-100',
    },
  ];

  const trustItems = [
    {
      icon: ShieldCheck,
      title: 'Güvenilir Takip',
      desc: 'Verilerin korunur, ilerlemen sadece sen ve koçun tarafından görülür.',
    },
    {
      icon: GraduationCap,
      title: 'Alanında Uzman Koç',
      desc: 'YKS deneyimi olan, köklü eğitim anlayışıyla hareket eden tek koçla çalışma.',
    },
    {
      icon: Handshake,
      title: 'Sürekli Geri Bildirim',
      desc: 'Her denemeden sonra analiz, her hafta plan, her gün not ile gelişim asla durmaz.',
    },
  ];

  return (
    <div>
      {/* 🌟 HERO ******************************************************************/}
      <section className="relative overflow-hidden pt-20 pb-20 md:pt-28 md:pb-28">
        {/* Subtle background: soft gradient wash instead of neon */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[520px] h-[520px] rounded-full bg-emerald-100/60 blur-[120px]" />
          <div className="absolute top-24 right-1/4 w-[420px] h-[420px] rounded-full bg-sky-100/60 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full bg-orange-50/70 blur-[110px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Eyebrow chip */}
            <div className="inline-flex items-center gap-2 chip bg-white border border-slate-200 text-blue-950700 shadow-soft mb-7">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              YKS Hazırlığında Güvenilir Koçluk Desteği
            </div>

            {/* Title */}
            <h1 className="font-display font-bold tracking-tight text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6 text-blue-950950">
              Başarmak için{' '}
              <span className="text-blue-950700">doğru rehber,</span>
              <br className="hidden sm:block" />
              <span className="gradient-text-fire">ateşle çalış.</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Köklü bir eğitim anlayışıyla hazırlanan kişiselleştirilmiş programlar,
              düzenli birebir görüşmeler ve veri odaklı takip sistemiyle YKS hedefine
              adım adım yaklaş.
            </p>

            {/* CTAs - immediately followed by features section */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asLink href="/register" size="lg">
                Ücretsiz Başla
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button asLink href="/login" variant="secondary" size="lg">
                Zaten üye misin? Giriş yap
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 TRUST ROW ************************************************************/}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          {trustItems.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft flex items-start gap-3.5"
              >
                <div className="w-11 h-11 flex-shrslate-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Icon className="w-5.5 h-5.5 text-blue-950700" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-semibold text-blue-950900 mb-1">
                    {t.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🌟 FEATURES **************************************************************/}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-24 md:pb-32">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <Badge variant="brand" size="md" className="mb-3">
            <BookOpen className="w-3 h-3" />
            PLATFORM ÖZELLİKLERİ
          </Badge>
          <h2 className="section-title text-3xl md:text-4xl">
            Sadece ders değil, <span className="gradient-text">başa çıkma</span>{' '}
            sistemi
          </h2>
          <p className="section-subtitle mt-3 text-base md:text-lg">
            Ders çalışma sürecini bir bütün olarak ele alır: plan, uygulama, ölçüm,
            motive etme. Hepsi tek paneli, tek rehber.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} hover className="p-6 md:p-7">
                <div
                  className={`w-14 h-14 rounded-2xl ${f.softBg} border ${f.border} flex items-center justify-center mb-5`}
                >
                  <Icon className={`w-7 h-7 ${f.iconColor}`} />
                </div>
                <h3 className="font-display text-xl font-semibold text-blue-950900 mb-2.5 leading-snug">
                  {f.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-[15px]">
                  {f.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 🌟 CTA *******************************************************************/}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-24 md:pb-32">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white shadow-soft p-8 md:p-14">
          {/* Decorative soft color blocks */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-100/70 blur-3xl" />

          <div className="relative grid md:grid-cols-2 gap-10 md:gap-12 items-center">
            <div>
              <Badge variant="fire" className="mb-4">
                <Clock className="w-3 h-3" />
                HEDEF: 2026 YKS
              </Badge>
              <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-blue-950950 leading-tight mb-4">
                Bugünden başla,
                <br />
                <span className="gradient-text-fire">
                  yarının başarı hikayeni yaz.
                </span>
              </h3>
              <p className="text-slate-600 leading-relaxed text-[16px] mb-6 max-w-xl">
                Tek başına çalışmak zordur. Koçun, planın, grafiklerin, günlük
                hedeflerin ve koçunun sana özel notlarının olduğu bir ekosistemde,
                motivasyonunu kaybetmeden, her gün bir adım ilerle.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <span className="chip bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Gelişimini ölç
                </span>
                <span className="chip bg-sky-50 text-sky-700 border border-sky-200">
                  <Clock className="w-3.5 h-3.5" />
                  Zamanı yönet
                </span>
                <span className="chip bg-orange-50 text-orange-700 border border-orange-200">
                  <Flame className="w-3.5 h-3.5" />
                  Motive ol
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button asLink href="/register" size="lg">
                  Ücretsiz Kaydol
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2 pl-1">
                  <Users2 className="w-5 h-5 text-blue-950500" />
                  <span className="text-sm text-slate-600">
                    Öğrenci ve koçlar{' '}
                    <span className="font-semibold text-blue-950800">
                      birlikte ilerliyor
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Visual card stack - light mode, trustworthy */}
            <div className="relative max-w-md mx-auto w-full">
              <Card className="p-5 md:p-6 !shadow-soft">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-950700" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                        Son 4 Deneme · Toplam Net
                      </div>
                      <div className="text-xs text-slate-400">TYT Gelişimi</div>
                    </div>
                  </div>
                  <Badge variant="accent" size="md" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +%14
                  </Badge>
                </div>

                <div className="font-display text-3xl font-bold text-blue-950950 mb-3 tabular-nums">
                  86.8 <span className="text-base font-normal text-slate-400">ortalama net</span>
                </div>

                {/* fake bars */}
                <div className="flex items-end gap-2 h-24 mb-5">
                  {[52, 61, 74, 82, 87, 93, 90, 96].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald-500/90 to-emerald-400/60 hover:from-emerald-600 hover:to-emerald-500 transition-colors"
                      style={{ height: `${v}%` }}
                      title={`${v / 1.5}`}
                    />
                  ))}
                </div>

                <div className="glow-divider mb-4" />

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
                      Son
                    </div>
                    <div className="font-display text-lg font-bold text-blue-950900 tabular-nums">
                      93.4
                    </div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-600 mb-0.5">
                      En iyi
                    </div>
                    <div className="font-display text-lg font-bold text-emerald-700 tabular-nums">
                      96.0
                    </div>
                  </div>
                  <div className="rounded-xl bg-sky-50 border border-sky-100 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-sky-600 mb-0.5">
                      Hedef
                    </div>
                    <div className="font-display text-lg font-bold text-sky-700 tabular-nums">
                      115+
                    </div>
                  </div>
                </div>
              </Card>

              {/* floating small card */}
              <Card className="!shadow-soft absolute -bottom-5 -left-3 w-56 p-3.5 hidden sm:flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrslate-0">
                  <Calendar className="w-4.5 h-4.5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">
                    Sıradaki
                  </div>
                  <div className="text-sm font-semibold text-blue-950900 truncate">
                    2 gün sonra · Koç görüşmesi
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
