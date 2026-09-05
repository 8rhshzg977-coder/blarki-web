import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ResetPasswordForm from './ResetPasswordForm';

// Only reachable with an active (recovery) session — someone landing here
// without one didn't come through a valid reset-email link, so send them
// back to request a fresh one instead of showing a broken form.
export default async function ResetPasswordPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/forgot-password?error=That+reset+link+has+expired+-+request+a+new+one');

  return <ResetPasswordForm />;
}
