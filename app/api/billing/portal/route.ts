import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

// Opens Stripe's hosted Customer Portal — this is how a company actually
// changes or cancels a paid plan (update payment method, switch plans,
// cancel — which the webhook's `customer.subscription.deleted` handler
// already flips back to the Free plan on this end). Before this route
// existed there was an "Upgrade" button but no way back down or out.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: membership } = await supabase
    .from('company_members')
    .select('role, companies(billing_customer_id)')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only the company owner can manage billing.' }, { status: 403 });
  }

  const customerId = (membership as any).companies?.billing_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: 'No billing account on file yet — upgrade first to set one up.' }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: 'Billing is not set up yet — no Stripe key is configured.' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  const origin = new URL(req.url).origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard/company/billing`,
  });

  return NextResponse.json({ portalUrl: session.url });
}
