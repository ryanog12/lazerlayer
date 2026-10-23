import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderProgress } from "@/components/site/order-progress";
import { OrderStatusBadge } from "@/components/site/status-badge";
import { QrPlaceholder } from "@/components/site/qr-placeholder";
import { SubmitButton } from "@/components/site/submit-button";
import { ActionForm } from "@/components/site/action-form";
import { retryStripePayment } from "@/actions/checkout";
import { db } from "@/lib/db";
import { formatDate, formatPrice, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { areCardPaymentsAvailable, getStripe, manualPaymentInstructions } from "@/lib/payments";
import { requireUser } from "@/lib/session";
import { PaymentSentForm } from "./payment-sent-form";

export const metadata: Metadata = { title: "Order", robots: { index: false } };

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ session_id?: string; placed?: string; paid?: string; canceled?: string; stripe_error?: string }>;
};

async function syncStripeSession(orderId: string, sessionId: string) {
  const stripe = getStripe();
  if (!stripe) return;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.orderId === orderId && session.payment_status === "paid") {
      await db.order.updateMany({
        where: { id: orderId, status: "pending_payment" },
        data: {
          status: "paid",
          paidAt: new Date(),
          stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        },
      });
    }
  } catch (err) {
    console.error("[stripe] could not verify session", err);
  }
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { reference } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/orders/${reference}`);

  let order = await db.order.findUnique({ where: { reference }, include: { items: true } });
  if (!order || (order.userId !== user.id && user.role !== "admin")) notFound();

  if (sp.session_id && order.status === "pending_payment") {
    await syncStripeSession(order.id, sp.session_id);
    order = (await db.order.findUnique({ where: { reference }, include: { items: true } }))!;
  }

  const pending = order.status === "pending_payment";
  const manual = order.paymentMethod !== "stripe" ? manualPaymentInstructions(order.paymentMethod) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      {(sp.placed || sp.paid || sp.session_id) && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
          <CheckCircle2 className="size-5" />
          <p className="text-sm">
            {pending ? "Order placed! Complete your payment below to start production." : "Payment received — thank you! Your order is confirmed."}
          </p>
        </div>
      )}
      {(sp.canceled || sp.stripe_error) && pending && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <AlertTriangle className="size-5" />
          <p className="text-sm">
            {sp.stripe_error ? "We couldn't start the Stripe checkout." : "Payment was canceled."} Your order is saved — you can try again below.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Order reference</p>
          <h1 className="font-mono text-3xl font-bold tracking-tight">{order.reference}</h1>
          <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt)} · {PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <Card>
        <CardContent><OrderProgress status={order.status} /></CardContent>
      </Card>

      {pending && manual && (
        <Card className="glow-laser">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="size-5 text-primary" /> Pay with {manual.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="flex flex-col items-center gap-2">
                <QrPlaceholder seed={manual.handle} />
                <span className="text-xs text-muted-foreground">QR placeholder</span>
              </div>
              <div className="flex-1 space-y-4">
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted p-3">
                    <dt className="text-xs text-muted-foreground">Send to</dt>
                    <dd className="font-mono font-semibold break-all">{manual.handle}</dd>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <dt className="text-xs text-muted-foreground">Amount</dt>
                    <dd className="font-semibold">{formatPrice(order.total)}</dd>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <dt className="text-xs text-muted-foreground">Memo / note</dt>
                    <dd className="font-mono font-semibold">{order.reference}</dd>
                  </div>
                </dl>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  {manual.steps.map((s) => <li key={s}>{s}</li>)}
                </ol>
              </div>
            </div>
            <div className="border-t pt-6">
              <PaymentSentForm reference={order.reference} alreadyMarked={Boolean(order.customerMarkedPaidAt)} />
            </div>
          </CardContent>
        </Card>
      )}

      {pending && order.paymentMethod === "stripe" && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {areCardPaymentsAvailable()
                ? "This order is awaiting card payment."
                : "This order is awaiting card payment, but card payments aren't available right now. Please contact us to pay another way."}
            </p>
            {areCardPaymentsAvailable() && (
              <ActionForm action={retryStripePayment.bind(null, order.reference)} refresh={false}>
                <SubmitButton pendingText="Redirecting…">Pay {formatPrice(order.total)} now</SubmitButton>
              </ActionForm>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between py-2">
                  <span>{i.quantity} × {i.name}</span>
                  <span className="tabular-nums">{formatPrice(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t pt-3 font-semibold">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ship to</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="whitespace-pre-line">{order.shippingName}{"\n"}{order.shippingAddress}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/account/tickets/new?orderId=${order.id}`}><LifeBuoy /> Get help with this order</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
