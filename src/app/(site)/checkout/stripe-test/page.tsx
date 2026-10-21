import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CreditCard, FlaskConical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/site/submit-button";
import { ActionForm } from "@/components/site/action-form";
import { simulateStripePayment } from "@/actions/checkout";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { isStripeConfigured } from "@/lib/payments";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Test payment", robots: { index: false } };

export default async function StripeTestPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: reference } = await searchParams;
  if (isStripeConfigured() || !reference) notFound();
  const user = await requireUser(`/checkout/stripe-test?order=${reference}`);
  const order = await db.order.findUnique({ where: { reference } });
  if (!order || order.userId !== user.id) notFound();
  if (order.status !== "pending_payment") redirect(`/orders/${reference}`);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
            <FlaskConical className="size-3.5" /> Stripe test mode (stubbed)
          </div>
          <CardTitle className="flex items-center gap-2"><CreditCard className="size-5" /> Pay {formatPrice(order.total)}</CardTitle>
          <CardDescription>
            Order {order.reference}. Stripe keys aren&apos;t configured, so this page simulates Stripe Checkout. Add
            <code className="mx-1">STRIPE_SECRET_KEY</code> to use real Stripe test mode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={simulateStripePayment.bind(null, order.reference)} refresh={false} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card">Card number</Label>
              <Input id="card" defaultValue="4242 4242 4242 4242" readOnly className="h-9 font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp">Expiry</Label>
                <Input id="exp" defaultValue="12 / 34" readOnly className="h-9 font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" defaultValue="123" readOnly className="h-9 font-mono" />
              </div>
            </div>
            <SubmitButton size="lg" className="w-full" pendingText="Processing…">Simulate successful payment</SubmitButton>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
