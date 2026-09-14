import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = "https://pddbuhqasaezonhoxuyf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bDFRBKaOPDEM-9de2PLpRA_JUUlRCL3";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as CookieOptions)
          );
        } catch {
        }
      },
    },
  });
}
