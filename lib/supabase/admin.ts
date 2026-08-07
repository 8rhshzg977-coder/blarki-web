import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client for legitimate system-level writes that cross user
// boundaries — e.g. an employer's action creating a notification for an
// applicant's account. Never expose this client or the underlying key to
// the browser; only import this file in server-only code (Server Actions,
// Route Handlers).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
