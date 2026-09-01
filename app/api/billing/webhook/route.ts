import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

// Never trust the frontend redirect alone — this webhook is the actual
// source of truth for whether a payment succeeded. Register this route's
// URL in Stripe Dashboard → Developers → Webhooks once deployed.
export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const companyId = session.client_reference_id || session.metadata?.company_id;
      const plan = session.metadata?.plan || 'starter';
      if (companyId) {
        await admin.from('companies').update({ plan, billing_customer_id: session.customer as string }).eq('id', companyId);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await admin.from('companies').update({ plan: 'free' }).eq('billing_customer_id', sub.customer as string);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const { data: company } = await admin.from('companies').select('id').eq('billing_customer_id', invoice.customer as string).single();
      if (company) {
        const { data: owner } = await admin.from('company_members').select('user_id').eq('company_id', company.id).eq('role', 'owner').single();
        if (owner) {
          await admin.from('notifications').insert({
            user_id: owner.user_id,
            type: 'payment_failed',
            channel: 'in_app',
            body: 'Your last payment failed — update your billing to keep your plan active.',
            read: false,
          });
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
