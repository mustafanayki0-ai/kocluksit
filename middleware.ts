import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const SUPABASE_URL = "https://rtqtzssavxfsdlcihigi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cXR6c3Nhdnhmc2RsY2loaWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDAxMDQsImV4cCI6MjEwNTY3NjEwNH0.pXu_0xiVxEaI2svL5CNX080ynLAOlLI9d-0YNmx0UVU";

/**
 * Middleware — Sadece auth var/yok kontrolü.
 * Rol tabanlı yönlendirme app/dashboard/* sayfalarının içinde Server Component ile yapılır.
 *
 * Kurallar:
 *  1. Oturumu YOK + /dashboard* ise => /login'e yönlendir.
 *  2. Oturumu VAR + /login veya /register ise => /dashboard'a yönlendir.
 *  3. Diğer tüm durumlarda devam et.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isDashboard = pathname.startsWith('/dashboard');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  let authenticated = false;
  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            response.cookies.set({ name, value, ...options });
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            response.cookies.set({ name, value: '', ...options });
          } catch {}
        },
      },
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const { data: { user } } = await supabase.auth.getUser();
      authenticated = !!user;
    }
  } catch {
    authenticated = false;
  }

  if (isDashboard && !authenticated) {
    const to = new URL('/login', request.url);
    return NextResponse.redirect(to);
  }

  if (authenticated && isAuthPage) {
    const to = new URL('/dashboard', request.url);
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|og-image.png|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|woff2?)$).*)',
  ],
};
