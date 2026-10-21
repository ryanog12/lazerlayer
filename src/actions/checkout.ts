"use server";

import { z } from "zod";
import { Prisma, type Order } from "@prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { formatPrice, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { generateOrderReference, getStripe, isStripeConfigured } from "@/lib/payments";
import { getCurrentUser } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";
import type { ActionResult } from "@/lib/action-result";

const checkoutSchema = z.object({
  shippingName: z.string().trim().min(1, "Full name is required").max(120),
  shippingAddress: z.string().trim().min(5, "Shipping address is required").max(500),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(["stripe", "zelle", "cashapp", "venmo"]),
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(99) }))
    .min(1, "Your cart is empty"),
});

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function createStripeSession(order: Order & { items: { name: string; unitPrice: number; quantity: number }[] }, email: string) {
  const stripe = getStripe();
  if (!stripe) return `/checkout/stripe-test?order=${order.reference}`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    client_reference_id: order.id,
    metadata: { orderId: order.id, reference: order.reference },
    line_items: order.items.map((i) => ({
      quantity: i.quantity,
      price_data: { currency: "usd", unit_amount: i.unitPrice, product_data: { name: i.name } },
    })),
    success_url: `${siteUrl()}/orders/${order.reference}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/orders/${order.reference}?canceled=1`,
  });
  await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  return session.url!;
}

export async function placeOrder(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to check out." };

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Your cart could not be read. Please refresh and try again." };
  }
  const parsed = checkoutSchema.safeParse({
    shippingName: formData.get("shippingName"),
    shippingAddress: formData.get("shippingAddress"),
    phone: formData.get("phone") || undefined,
    notes: formData.get("notes") || undefined,
    paymentMethod: formData.get("paymentMethod"),
    items,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const products = await db.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) }, active: true },
  });
  const lines: { product: (typeof products)[number]; quantity: number }[] = [];
  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return { error: "An item in your cart is no longer available. Please review your cart." };
    if (!product.isCustom && product.stock !== null && product.stock < item.quantity) {
      return { error: `Only ${product.stock} × ${product.name} left in stock.` };
    }
    lines.push({ product, quantity: item.quantity });
  }
  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      for (const l of lines) {
        if (!l.product.isCustom && l.product.stock !== null) {
          const res = await tx.product.updateMany({
            where: { id: l.product.id, stock: { gte: l.quantity } },
            data: { stock: { decrement: l.quantity } },
          });
          if (res.count === 0) throw new Error(`OUT_OF_STOCK:${l.product.name}`);
        }
      }
      return tx.order.create({
        data: {
          reference: generateOrderReference(),
          userId: user.id,
          total,
          paymentMethod: data.paymentMethod,
          shippingName: data.shippingName,
          shippingAddress: data.shippingAddress,
          phone: data.phone,
          notes: data.notes,
          items: {
            create: lines.map((l) => ({
              productId: l.product.id,
              name: l.product.name,
              unitPrice: l.product.price,
              quantity: l.quantity,
            })),
          },
        },
        include: { items: true },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("OUT_OF_STOCK:")) {
      return { error: `${err.message.slice(13)} just sold out. Please update your cart.` };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Please try again — we hit a temporary reference collision." };
    }
    throw err;
  }

  await sendEmail({
    to: user.email!,
    subject: `LazerLayer order ${order.reference} received`,
    text: `Thanks for your order! Reference: ${order.reference}\nTotal: ${formatPrice(order.total)}\nPayment method: ${PAYMENT_METHOD_LABEL[order.paymentMethod]}\n\nTrack it at ${siteUrl()}/orders/${order.reference}`,
  });

  if (order.paymentMethod === "stripe") {
    try {
      return { redirectTo: await createStripeSession(order, user.email!) };
    } catch (err) {
      console.error("[stripe] session create failed", err);
      return { redirectTo: `/orders/${order.reference}?stripe_error=1` };
    }
  }
  return { redirectTo: `/orders/${order.reference}?placed=1` };
}

async function getOwnedOrder(reference: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  const order = await db.order.findUnique({ where: { reference }, include: { items: true } });
  if (!order || (order.userId !== user.id && user.role !== "admin")) throw new Error("Order not found");
  return { user, order };
}

export async function retryStripePayment(reference: string): Promise<ActionResult> {
  const { user, order } = await getOwnedOrder(reference);
  if (order.status !== "pending_payment" || order.paymentMethod !== "stripe") return { redirectTo: `/orders/${reference}` };
  try {
    return { redirectTo: await createStripeSession(order, user.email!) };
  } catch (err) {
    console.error("[stripe] session create failed", err);
    return { error: "Could not start the Stripe checkout. Please try again." };
  }
}

/** Test-mode only: used when STRIPE_SECRET_KEY is absent to simulate a successful card payment. */
export async function simulateStripePayment(reference: string): Promise<ActionResult> {
  if (isStripeConfigured()) throw new Error("Stripe is configured; use real Checkout.");
  const { order } = await getOwnedOrder(reference);
  if (order.status === "pending_payment") {
    await db.order.update({
      where: { id: order.id },
      data: { status: "paid", paidAt: new Date(), stripePaymentId: `pi_test_stub_${order.reference}` },
    });
  }
  return { redirectTo: `/orders/${reference}?paid=1` };
}

export async function markPaymentSent(formData: FormData): Promise<ActionResult> {
  const reference = String(formData.get("reference") ?? "");
  const { order } = await getOwnedOrder(reference);
  if (order.paymentMethod === "stripe" || order.status !== "pending_payment") {
    return { error: "This order is not awaiting a manual payment." };
  }
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  let proofUrl: string | null = null;
  try {
    proofUrl = await saveUpload(formData.get("proof") as File | null, "proofs");
  } catch (e) {
    return { error: (e as Error).message };
  }
  await db.order.update({
    where: { id: order.id },
    data: {
      customerMarkedPaidAt: new Date(),
      paymentNote: note || order.paymentNote,
      paymentProofUrl: proofUrl ?? order.paymentProofUrl,
    },
  });
  await sendEmail({
    to: process.env.ADMIN_NOTIFY_EMAIL ?? "admin@lazerlayer.com",
    subject: `Payment sent for ${order.reference}`,
    text: `Customer reports ${PAYMENT_METHOD_LABEL[order.paymentMethod]} payment of ${formatPrice(order.total)} for ${order.reference}.\nNote: ${note || "(none)"}`,
  });
  return { success: "Thanks! We'll confirm your payment shortly." };
}
