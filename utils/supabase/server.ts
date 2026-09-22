import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = "https://rtqtzssavxfsdlcihigi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cXR6c3Nhdnhmc2RsY2loaWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDAxMDQsImV4cCI6MjEwNTY3NjEwNH0.pXu_0xiVxEaI2svL5CNX080ynLAOlLI9d-0YNmx0UVU";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
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

export const SUPABASE = { URL: SUPABASE_URL, ANON_KEY: SUPABASE_ANON_KEY };
