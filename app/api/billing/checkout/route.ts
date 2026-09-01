import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id, role, companies(name, billing_customer_id)')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only the company owner can manage billing.' }, { status: 403 });
  }

  const { plan } = await req.json();
  const priceId = plan === 'starter' ? process.env.STRIPE_STARTER_PRICE_ID : null;
  if (!priceId) {
    return NextResponse.json({ error: 'This plan is not configured yet — the Stripe Price ID is missing.' }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: 'Billing is not set up yet — no Stripe key is configured.' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  const origin = new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer: (membership as any).companies?.billing_customer_id || undefined,
    client_reference_id: membership.company_id,
    success_url: `${origin}/dashboard/company/billing?success=1`,
    cancel_url: `${origin}/dashboard/company/billing?cancelled=1`,
    metadata: { company_id: membership.company_id, plan },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
