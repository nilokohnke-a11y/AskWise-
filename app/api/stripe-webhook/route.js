import { stripe } from "../../../lib/stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return new Response("Webhook error", {
      status: 400
    });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId = session.metadata.user_id;
    const plan = session.metadata.plan;

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: session.customer_email,
      plan,
      stripe_customer_id: session.customer
    });

    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      stripe_subscription_id: session.subscription,
      plan,
      status: "active"
    });
  }

  return new Response("OK", {
    status: 200
  });
}
