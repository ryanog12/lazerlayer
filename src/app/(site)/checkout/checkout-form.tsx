"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/site/submit-button";
import { FormPendingContext, useFormAction } from "@/components/site/action-form";
import { useCart } from "@/components/cart/cart-provider";
import { placeOrder } from "@/actions/checkout";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "stripe", label: "Card / Apple Pay / Google Pay", hint: "Instant confirmation via Stripe", icon: CreditCard },
  { value: "zelle", label: "Zelle", hint: "Send from your bank app", icon: Smartphone },
  { value: "cashapp", label: "Cash App", hint: "Pay our $Cashtag", icon: Smartphone },
  { value: "venmo", label: "Venmo", hint: "Pay our Venmo handle", icon: Smartphone },
] as const;

export function CheckoutForm({ defaultName, stripeLive }: { defaultName: string; stripeLive: boolean }) {
  const { items, ready, subtotal, clear } = useCart();
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("stripe");
  const { state, pending, onSubmit } = useFormAction(placeOrder, { refresh: false });

  useEffect(() => {
    if (state?.redirectTo) clear();
  }, [state, clear]);

  if (!ready) return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  if (items.length === 0 && !state?.redirectTo) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
        <Button asChild><Link href="/products">Browse the catalog</Link></Button>
      </div>
    );
  }

  return (
    <FormPendingContext.Provider value={pending}>
    <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-[1fr_320px]">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity })))}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Shipping details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shippingName">Full name</Label>
              <Input id="shippingName" name="shippingName" defaultValue={defaultName} required className="h-9" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" name="phone" type="tel" className="h-9" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="shippingAddress">Shipping address</Label>
              <Textarea id="shippingAddress" name="shippingAddress" rows={3} required placeholder={"Street\nCity, State ZIP"} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Order notes (color preferences, etc.)</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment method</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
              {METHODS.map((m) => (
                <label
                  key={m.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    method === m.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m.value}
                    checked={method === m.value}
                    onChange={() => setMethod(m.value)}
                    className="mt-1 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-medium"><m.icon className="size-4" /> {m.label}</span>
                    <span className="text-sm text-muted-foreground">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {method === "stripe" ? (
              <p className="text-sm text-muted-foreground">
                You&apos;ll be redirected to Stripe&apos;s secure checkout.
                {!stripeLive && " (Test mode: Stripe keys are not configured, so a simulated payment page is used.)"}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                After placing your order you&apos;ll get a unique order reference and payment instructions. Your
                order stays <strong>pending payment</strong> until we confirm receipt.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{i.quantity} × {i.name}</span>
                <span className="tabular-nums">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t pt-4 font-semibold">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
          <SubmitButton size="lg" className="w-full" pendingText="Placing order…">
            {method === "stripe" ? "Continue to payment" : "Place order"}
          </SubmitButton>
        </CardContent>
      </Card>
    </form>
    </FormPendingContext.Provider>
  );
}
