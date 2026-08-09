import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureProfileExists } from '@/lib/ensureProfileExists';

// The destination the confirmation email link points to (set via
// emailRedirectTo at signup). Exchanges the confirmation code for a real
// session, finishes setting up the account, then sends the person to a
// clear "you're confirmed" page instead of dropping them back on a blank
// login screen with no feedback.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Confirmation+link+is+missing+or+invalid`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=Could+not+confirm+your+email+-+the+link+may+have+expired`);
  }

  await ensureProfileExists(supabase, data.user);

  return NextResponse.redirect(`${origin}/auth/confirmed`);
}
