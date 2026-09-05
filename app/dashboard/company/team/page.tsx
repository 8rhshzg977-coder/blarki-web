import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureCompanyMembership } from '@/lib/ensureCompanyMembership';
import InviteForm from './InviteForm';
import RemoveMemberButton from './RemoveMemberButton';
import RevokeInviteButton from './RevokeInviteButton';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const membership = await ensureCompanyMembership(supabase, user.id, user.email || 'you@example.com');

  const { data: members } = await supabase
    .from('company_members')
    .select('id, user_id, role, created_at')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: true });

  // company_members has no direct FK to profiles (both reference auth.users
  // independently), so PostgREST can't auto-embed it — fetched separately
  // and merged here instead.
  const userIds = (members || []).map((m) => m.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, email').in('id', userIds)
    : { data: [] as any[] };
  const emailByUserId = new Map((profiles || []).map((p) => [p.id, p.email]));

  const { data: invites } = await supabase
    .from('company_invites')
    .select('id, email, role, created_at')
    .eq('company_id', membership.company_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const isOwner = membership.role === 'owner';

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="eyebrow" style={{ color: 'var(--gold)' }}>YOUR COMPANY</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 20px' }}>Team</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>MEMBERS</div>
        {(members || []).map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
            <div>
              <div style={{ fontSize: 13.5 }}>{emailByUserId.get(m.user_id) || 'Unknown'}</div>
              <div style={{ fontSize: 11.5, color: 'var(--slate)', textTransform: 'capitalize' }}>{m.role.replace('_', ' ')}</div>
            </div>
            {isOwner && m.role !== 'owner' && <RemoveMemberButton memberId={m.id} />}
          </div>
        ))}
      </div>

      {(invites || []).length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>PENDING INVITES</div>
          {(invites || []).map((inv) => (
            <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontSize: 13.5 }}>{inv.email}</div>
                <div style={{ fontSize: 11.5, color: 'var(--slate)' }}>Invited {new Date(inv.created_at).toLocaleDateString()} — awaiting response</div>
              </div>
              <RevokeInviteButton inviteId={inv.id} />
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 10 }}>INVITE A TEAMMATE</div>
        <p style={{ fontSize: 12.5, color: 'var(--slate)', marginBottom: 12 }}>
          They'll get an email to set up their account as an HR Manager — able to post jobs, review applicants, and manage the hiring pipeline alongside you.
        </p>
        <InviteForm />
      </div>
    </div>
  );
}
