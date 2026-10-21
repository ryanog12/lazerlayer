import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/payments";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return Response.json({ received: false, reason: "Stripe webhook not configured" }, { status: 501 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId && session.payment_status === "paid") {
        await db.order.updateMany({
          where: { id: orderId, status: "pending_payment" },
          data: {
            status: "paid",
            paidAt: new Date(),
            stripeSessionId: session.id,
            stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
          },
        });
      }
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
