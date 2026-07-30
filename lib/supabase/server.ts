import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Use this in Server Components, Server Actions, and Route Handlers.
// It reads/writes the auth cookie so the user's session carries through SSR.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component sometimes — safe to ignore,
            // middleware.ts below handles the actual refresh in that case.
          }
        },
      },
    }
  );
}
