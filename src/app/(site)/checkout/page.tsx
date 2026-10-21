import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { isStripeConfigured } from "@/lib/payments";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
      <CheckoutForm defaultName={user.name ?? ""} stripeLive={isStripeConfigured()} />
    </div>
  );
}
