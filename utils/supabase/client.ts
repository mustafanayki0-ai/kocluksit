'use client';

import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = "https://rtqtzssavxfsdlcihigi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0cXR6c3Nhdnhmc2RsY2loaWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDAxMDQsImV4cCI6MjEwNTY3NjEwNH0.pXu_0xiVxEaI2svL5CNX080ynLAOlLI9d-0YNmx0UVU";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const SUPABASE = { URL: SUPABASE_URL, ANON_KEY: SUPABASE_ANON_KEY };
