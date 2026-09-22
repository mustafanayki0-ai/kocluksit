import type { Metadata, Viewport } from 'next';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Mail, MapPin, BookOpen, BarChart3, Users } from 'lucide-react';
import { SigmaLogo } from '@/components/ui/SigmaLogo';

export const metadata: Metadata = {
  metadataBase: new URL('https://sigmamentorluk.com'),
  title: {
    default: 'Sigma Mentörlük | YKS Koçluk Sistemi',
    template: '%s | Sigma Mentörlük',
  },
  description:
    'Sigma Mentörlük - YKS, TYT ve AYT hazırlığında öğrencilere özel koçluk ve mentörlük sistemi. Kişiselleştirilmiş haftalık programlar, birebir görüşmeler, gelişim grafikleri ve tamamen SSR destekli Next.js + Supabase altyapısı.',
  keywords: [
    'mentörlük',
    'koçluk',
    'YKS',
    'TYT',
    'AYT',
    'sınav koçluğu',
    'online eğitim',
    'öğrenci koçu',
    'deneme takibi',
    'haftalık program',
    'Sigma Mentörlük',
  ],
  authors: [{ name: 'Sigma Mentörlük', url: 'https://sigmamentorluk.com' }],
  creator: 'Sigma Mentörlük',
  publisher: 'Sigma Mentörlük',
  category: 'education',
  applicationName: 'Sigma Mentörlük',
  generator: 'Next.js',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Sigma Mentörlük | Başarıya Giden Yolculuğun Rehberi',
    description:
      'YKS hazırlığında kişiselleştirilmiş mentörlük ile hedefine ulaş. Uzman mentör, takip, program ve gelişim grafikleri.',
    url: 'https://sigmamentorluk.com',
    siteName: 'Sigma Mentörlük',
    locale: 'tr_TR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sigma Mentörlük - Sınav Koçluğu Platformu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sigma Mentörlük | Başarıya Giden Yolculuğun Rehberi',
    description:
      'YKS, TYT, AYT hazırlığında özel mentörlük desteği. Kişiselleştirilmiş programlar ve gelişim takibi.',
    creator: '@sigmamentorluk',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22><stop offset=%220%25%22 stop-color=%22%231d4ed8%22/><stop offset=%2250%25%22 stop-color=%22%230ea5e9%22/><stop offset=%22100%25%22 stop-color=%22%2310b981%22/></linearGradient></defs><rect width=%2264%22 height=%2264%22 rx=%2214%22 fill=%22white%22/><g fill=%22none%22 stroke=%22url(%23g)%22 stroke-width=%225%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M14 16 L36 16 C47 16 50 22 50 30 C50 38 47 44 36 44 L22 44%22/><path d=%22M44 48 L57 14 L60 20 L47 54 Z%22 fill=%22url(%23g)%22/></g></svg>',
        type: 'image/svg+xml',
      },
    ],
    shortcut: [
      {
        url: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22><stop offset=%220%25%22 stop-color=%22%231d4ed8%22/><stop offset=%2250%25%22 stop-color=%22%230ea5e9%22/><stop offset=%22100%25%22 stop-color=%22%2310b981%22/></linearGradient></defs><rect width=%2264%22 height=%2264%22 rx=%2214%22 fill=%22white%22/><g fill=%22none%22 stroke=%22url(%23g)%22 stroke-width=%225%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M14 16 L36 16 C47 16 50 22 50 30 C50 38 47 44 36 44 L22 44%22/><path d=%22M44 48 L57 14 L60 20 L47 54 Z%22 fill=%22url(%23g)%22/></g></svg>',
      },
    ],
    apple: [
      {
        url: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22><stop offset=%220%25%22 stop-color=%22%231d4ed8%22/><stop offset=%2250%25%22 stop-color=%22%230ea5e9%22/><stop offset=%22100%25%22 stop-color=%22%2310b981%22/></linearGradient></defs><rect width=%2264%22 height=%2264%22 rx=%2214%22 fill=%22white%22/><g fill=%22none%22 stroke=%22url(%23g)%22 stroke-width=%225%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M14 16 L36 16 C47 16 50 22 50 30 C50 38 47 44 36 44 L22 44%22/><path d=%22M44 48 L57 14 L60 20 L47 54 Z%22 fill=%22url(%23g)%22/></g></svg>',
      },
    ],
  },
  alternates: {
    canonical: 'https://sigmamentorluk.com',
    languages: {
      'tr-TR': 'https://sigmamentorluk.com',
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        .select('*')
        .eq('id', user.id)
        .single();
      profile = profileData;
    }
  } catch {
    user = null;
    profile = null;
  }

  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header user={user} profile={profile} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-slate-50/80 mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
            <div className="grid gap-10 md:grid-cols-4">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <SigmaLogo size={44} className="drop-shadow-sm" />
                  <div className="leading-tight">
                    <p className="font-display font-extrabold text-[22px] tracking-[-0.04em] text-slate-900">
                      SIGMA
                    </p>
                    <p className="text-[12px] font-semibold tracking-[0.2em] text-slate-500 -mt-0.5">
                      MENTÖRLÜK
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                  Sınav yolculuğunda öğrencinin yanında olan, güvenilir, takip odaklı bir mentörlük
                  platformu. Hedefine ulaşırken yalnız değilsin.
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                  iletisim@sigmamentorluk.com
                  <span className="mx-2 text-slate-300">•</span>
                  <MapPin className="w-3.5 h-3.5" />
                  Türkiye
                </div>
              </div>

              <div>
                <h4 className="font-display font-semibold text-slate-900 text-sm mb-4">Platform</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2 hover:text-emerald-600 transition-colors cursor-pointer">
                    <BookOpen className="w-4 h-4 text-slate-400" /> Haftalık Program
                  </li>
                  <li className="flex items-center gap-2 hover:text-emerald-600 transition-colors cursor-pointer">
                    <BarChart3 className="w-4 h-4 text-slate-400" /> Gelişim Grafikleri
                  </li>
                  <li className="flex items-center gap-2 hover:text-emerald-600 transition-colors cursor-pointer">
                    <Users className="w-4 h-4 text-slate-400" /> Birebir Görüşmeler
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-display font-semibold text-slate-900 text-sm mb-4">Kurumsal</h4>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="hover:text-emerald-600 transition-colors cursor-pointer">Hakkımızda</li>
                  <li className="hover:text-emerald-600 transition-colors cursor-pointer">Gizlilik Politikası</li>
                  <li className="hover:text-emerald-600 transition-colors cursor-pointer">Kullanım Şartları</li>
                  <li className="hover:text-emerald-600 transition-colors cursor-pointer">İletişim</li>
                </ul>
              </div>
            </div>

            <div className="divider-soft my-10" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <p>
                © {new Date().getFullYear()} <span className="font-semibold text-slate-700">Sigma Mentörlük</span> — Tüm hakları saklıdır.
              </p>
              <p className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Aktif
                </span>
                7/24 Destek
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
