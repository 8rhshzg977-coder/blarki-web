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

  // This same page is the landing spot for both a routine password reset
  // and a brand-new team-invite acceptance (see requestPasswordReset in
  // app/actions.ts and inviteTeamMember) — a generic "reset your password"
  // screen would be confusing context for someone who just clicked an
  // invite email and has never set a password here before. There's no
  // explicit "fresh invite" flag to check, so this infers it: an HR
  // Manager membership created moments ago (ensureProfileExists ran right
  // before this page loaded) is almost certainly someone claiming an
  // invite, not an existing member resetting a forgotten password.
  let welcomeToCompany: string | null = null;
  const { data: membership } = await supabase
    .from('company_members')
    .select('role, created_at, companies(name)')
    .eq('user_id', user.id)
    .maybeSingle();
  if (membership && membership.role === 'hr_manager') {
    const joinedMsAgo = Date.now() - new Date(membership.created_at).getTime();
    if (joinedMsAgo < 15 * 60 * 1000) {
      welcomeToCompany = (membership as any).companies?.name || 'your new team';
    }
  }

  return <ResetPasswordForm welcomeToCompany={welcomeToCompany} />;
}
