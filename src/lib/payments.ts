import type { PaymentMethod } from "@prisma/client";
import Stripe from "stripe";

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });
  return stripeClient;
}

export type ManualMethod = Exclude<PaymentMethod, "stripe">;

export const MANUAL_METHODS: ManualMethod[] = ["zelle", "cashapp", "venmo"];

export function manualPaymentInstructions(method: ManualMethod) {
  switch (method) {
    case "zelle":
      return {
        label: "Zelle",
        handle: process.env.PAYMENT_ZELLE_HANDLE ?? "payments@lazerlayer.com",
        steps: [
          "Open your banking app and choose Zelle.",
          "Send the total to the email above (recipient name: LazerLayer LLC).",
          "Put your order reference in the memo field.",
        ],
      };
    case "cashapp":
      return {
        label: "Cash App",
        handle: process.env.PAYMENT_CASHAPP_HANDLE ?? "$LazerLayer",
        steps: [
          "Open Cash App and tap Pay.",
          "Send the total to the $Cashtag above.",
          "Put your order reference in the note (“For”) field.",
        ],
      };
    case "venmo":
      return {
        label: "Venmo",
        handle: process.env.PAYMENT_VENMO_HANDLE ?? "@LazerLayer",
        steps: [
          "Open Venmo and search for the handle above.",
          "Send the total as a payment for goods & services.",
          "Put your order reference in the note.",
        ],
      };
  }
}

export function generateOrderReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `LL-${suffix}`;
}
