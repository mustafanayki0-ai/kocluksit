import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const SUPABASE_URL = "https://rtqtzssavxfsdlcihigi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cXR6c3Nhdnhmc2RsY2loaWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDAxMDQsImV4cCI6MjEwNTY3NjEwNH0.pXu_0xiVxEaI2svL5CNX080ynLAOlLI9d-0YNmx0UVU";

/**
 * Middleware (ADIM 2 - SIFIRDAN YAZILDI)
 *
 * Kurallar:
 *  1. Oturumu YOK ve /dashboard* altında => /login'e YÖNLENDİR (query.next ile dönüş yolu korunur)
 *  2. Oturumu VAR ve /login, /register VEYA / (anasayfa) => /dashboard'a YÖNLENDİR
 *
 * EN ÖNEMLİ: Sadece request üzerinden cookie okunur, hiçbir şekilde Response okunmaz
 * -> Bu sebeple yönlendirme sonrası middleware'i "kendisi tekrar çağırdığında" YENİDEN AYNI yönlendirmeyi yapmama garantisi sağlanır:
 *    Eğer auth VARSA ve yönlendirmek istediğimiz rota zaten hedef (dashboard*) ise bir şey yapma -> Sonsuz döngü BLOKE
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * Request ONLY cookie üzerinden supabase user alınır.
   * set/remove ile response cookie dokunmadığımız için bu çağrı redirect loop yaratmaz.
   */
  let authenticated = false;
  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) {
          // Session refresh ihtiyacı olursa response cookie'yi güncellemek için
          // response üzerinden set edilecek, ama döngü yaratmamak için set edilenleri
          // MUTLAKA response nesnesi üzerinden yazacağız.
        },
        remove(_name: string, _options: CookieOptions) {},
      },
    });

    // Önce session'ı refresh et (cookie set edilirse response içine yerleşir)
    let response = NextResponse.next({ request: { headers: request.headers } });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try { response.cookies.set({ name, value, ...options }); } catch {}
          },
          remove(name: string, options: CookieOptions) {
            try { response.cookies.set({ name, value: '', ...options }); } catch {}
          },
        },
      });
      // Auth state doğrula: getUser JWT'yi doğrular
      const { data: { user } } = await client.auth.getUser();
      authenticated = !!user;
      // Response'u cookie yenilenmiş olarak taşı
    }

    const isDashboard = pathname.startsWith('/dashboard');
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isHome = pathname === '/' || pathname === '';

    // ---------- KURAL 1 ----------
    // dashboard* altında ve oturum yok => /login'e
    if (isDashboard && !authenticated) {
      const to = request.nextUrl.clone();
      to.pathname = '/login';
      to.searchParams.set('next', pathname);
      to.searchParams.set('r', '1'); // bir kerelik flag
      return NextResponse.redirect(to);
    }

    // ---------- KURAL 2 ----------
    // anasayfa / login / register'da ve oturum VAR => /dashboard'a
    // Burada ZATEN dashboard altında isek yönlendirme YAPMA -> redirect loop BLOKE
    if (authenticated && !isDashboard && (isAuthPage || isHome)) {
      const to = request.nextUrl.clone();
      to.pathname = '/dashboard';
      to.search = '';
      return NextResponse.redirect(to);
    }

    // Hiçbir yönlendirme yoksa orijinal response'u (cookie'leri yenilenmiş halde) döndür
    return response;
  } catch (e) {
    // Hata durumunda "en güvenli" davranış: yönlendirme YAPMA, devam et (sayfada server-side auth tekrar bakar)
    return NextResponse.next({ request: { headers: request.headers } });
  }
}

export const config = {
  matcher: [
    // Statik dosyaları hariç tut
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|og-image.png|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|woff2?)$).*)',
  ],
};
