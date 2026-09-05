import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UpgradeButton from './UpgradeButton';
import ManageBillingButton from './ManageBillingButton';

export const dynamic = 'force-dynamic';

const PLANS = [
  {
    key: 'free', name: 'Free', price: '$0/mo',
    features: [
      '1 active job posting',
      'AI job description generator — 3 per day',
      'Applicants shown in the order they applied',
      'Basic dashboard',
    ],
  },
  {
    key: 'starter', name: 'Starter', price: '$39/mo',
    features: [
      'Up to 5 active jobs',
      'Unlimited AI job description & screening-question generation',
      'AI applicant ranking — every applicant scored & explained',
      'AI resume-fit summary for every applicant',
      'Email support',
    ],
  },
];

export default async function BillingPage({ searchParams }: { searchParams: { success?: string; cancelled?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('company_members')
    .select('role, companies(plan, billing_customer_id)')
    .eq('user_id', user.id)
    .maybeSingle();

  const currentPlan = (membership as any)?.companies?.plan || 'free';
  const hasBillingAccount = Boolean((membership as any)?.companies?.billing_customer_id);
  const isOwner = membership?.role === 'owner';

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="eyebrow">PLAN &amp; BILLING</div>
      <h1 style={{ fontSize: 26, margin: '8px 0 20px' }}>Your plan</h1>

      {searchParams.success && (
        <div className="error-box" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
          Payment successful — your plan will update shortly (usually within a few seconds).
        </div>
      )}
      {searchParams.cancelled && (
        <div className="error-box">Checkout was cancelled — no changes were made.</div>
      )}
      {!isOwner && (
        <div className="error-box">Only the company owner can change the plan. You can still view current usage below.</div>
      )}

      {PLANS.map((plan) => (
        <div key={plan.key} className="card" style={{ borderColor: currentPlan === plan.key ? 'var(--gold)' : undefined, borderWidth: currentPlan === plan.key ? 2 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{plan.name}</div>
              <div className="num" style={{ fontSize: 20, color: 'var(--gold-deep)', marginTop: 4 }}>{plan.price}</div>
            </div>
            {currentPlan === plan.key ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <span className="tagpill" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>Current plan</span>
                {plan.key !== 'free' && isOwner && hasBillingAccount && <ManageBillingButton />}
              </div>
            ) : plan.key !== 'free' && isOwner ? (
              <UpgradeButton plan={plan.key} />
            ) : null}
          </div>
          <ul style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 12, paddingLeft: 18, lineHeight: 1.8 }}>
            {plan.features.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
      ))}

      <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: 16 }}>
        Payments are processed securely by Stripe. Once you&apos;ve upgraded, use &quot;Manage billing / cancel&quot;
        above to update your payment method, downgrade, or cancel anytime — no need to contact support.
      </p>
    </div>
  );
}
