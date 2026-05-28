import { createClient } from "@supabase/supabase-js";

// Using dummy values to not break in preview, but giving instructions setup
let rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";

// Santize url - remove /rest/v1 and trailing slashes to prevent PGRST125
if (rawUrl.endsWith('/rest/v1')) {
  rawUrl = rawUrl.replace('/rest/v1', '');
} else if (rawUrl.endsWith('/rest/v1/')) {
  rawUrl = rawUrl.replace('/rest/v1/', '');
}
const supabaseUrl = rawUrl.replace(/\/+$/, "");

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
