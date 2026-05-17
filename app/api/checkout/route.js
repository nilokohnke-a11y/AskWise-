import { stripe } from "../../../lib/stripe";
import { createSupabaseServerClient } from "../../../lib/supabaseServer";

const priceMap = {
  fast: process.env.STRIPE_FAST_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
  ultra: process.env.STRIPE_ULTRA_PRICE_ID
};

export async function POST(request) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return Response.json(
      {
        error: "Please login before choosing a plan."
      },
      {
        status: 401
      }
    );
  }

  const body = await request.json();
  const plan = body.plan;
  const priceId = priceMap[plan];

  if (!priceId) {
    return Response.json(
      {
        error: "Invalid plan."
      },
      {
        status: 400
      }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: userData.user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    subscription_data: plan === "premium" ? { trial_period_days: 7 } : {},
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}?canceled=true`,
    metadata: {
      user_id: userData.user.id,
      plan
    }
  });

  return Response.json({
    url: session.url
  });
}
