import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { updateSession } from './lib/supabase/middleware';

const SUPABASE_URL = "https://rtqtzssavxfsdlcihigi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cXR6c3Nhdnhmc2RsY2loaWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDAxMDQsImV4cCI6MjEwNTY3NjEwNH0.pXu_0xiVxEaI2svL5CNX080ynLAOlLI9d-0YNmx0UVU";

export async function middleware(request: NextRequest) {
  let response = await updateSession(request);

  const { pathname } = request.nextUrl;

  let supabaseUser = null;
  try {
    const cookieStoreClient = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    const { data } = await cookieStoreClient.auth.getUser();
    supabaseUser = data?.user ?? null;
  } catch {
    supabaseUser = null;
  }

  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isPublicAuthRoute = pathname === '/login' || pathname === '/register';
  const isHomeRoute = pathname === '/' || pathname === '';

  if (isDashboardRoute && !supabaseUser) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if ((isPublicAuthRoute || isHomeRoute) && supabaseUser) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|og-image.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)',
  ],
};
