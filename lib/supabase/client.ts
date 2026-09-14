import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = "https://pddbuhqasaezonhoxuyf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bDFRBKaOPDEM-9de2PLpRA_JUUlRCL3";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
