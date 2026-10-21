import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderProgress } from "@/components/site/order-progress";
import { OrderStatusBadge, TicketStatusBadge } from "@/components/site/status-badge";
import { SubmitButton } from "@/components/site/submit-button";
import { ActionForm } from "@/components/site/action-form";
import { confirmManualPayment, updateOrderStatus } from "@/actions/admin";
import { db } from "@/lib/db";
import { formatDate, formatPrice, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/format";

export const metadata = { title: "Order details" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { user: true, items: true, tickets: true },
  });
  if (!order) notFound();

  const manual = order.paymentMethod !== "stripe";

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold">{order.reference}</h1>
          <p className="text-sm text-muted-foreground">
            {order.user.name} ({order.user.email}) · placed {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <Card><CardContent><OrderProgress status={order.status} /></CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {order.items.map((i) => (
                  <li key={i.id} className="flex justify-between py-2">
                    <span>{i.quantity} × {i.name} <span className="text-muted-foreground">@ {formatPrice(i.unitPrice)}</span></span>
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
            <CardHeader><CardTitle>Shipping &amp; notes</CardTitle></CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Ship to</p>
                <p className="whitespace-pre-line">{order.shippingName}{"\n"}{order.shippingAddress}</p>
                {order.phone && <p>{order.phone}</p>}
              </div>
              <div>
                <p className="text-muted-foreground">Customer notes</p>
                <p className="whitespace-pre-line">{order.notes || "—"}</p>
              </div>
            </CardContent>
          </Card>
          {order.tickets.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Related tickets</CardTitle></CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {order.tickets.map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2">
                      <Link href={`/admin/tickets/${t.id}`} className="hover:underline">{t.subject}</Link>
                      <TicketStatusBadge status={t.status} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Method:</span> {PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
              {order.stripePaymentId && <p className="break-all"><span className="text-muted-foreground">Stripe ID:</span> {order.stripePaymentId}</p>}
              {order.paidAt && <p><span className="text-muted-foreground">Paid:</span> {formatDate(order.paidAt)}</p>}
              {manual && (
                <>
                  <p>
                    <span className="text-muted-foreground">Customer reported paid:</span>{" "}
                    {order.customerMarkedPaidAt ? formatDate(order.customerMarkedPaidAt) : "Not yet"}
                  </p>
                  {order.paymentNote && <p className="rounded bg-muted p-2 whitespace-pre-line">{order.paymentNote}</p>}
                  {order.paymentProofUrl && (
                    <a href={order.paymentProofUrl} target="_blank" className="text-primary underline" rel="noreferrer">View payment proof</a>
                  )}
                  {order.status === "pending_payment" && (
                    <ActionForm action={confirmManualPayment.bind(null, order.id)}>
                      <SubmitButton className="w-full" size="lg" pendingText="Confirming…">
                        <BadgeCheck /> Confirm {PAYMENT_METHOD_LABEL[order.paymentMethod]} payment
                      </SubmitButton>
                    </ActionForm>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Update status</CardTitle></CardHeader>
            <CardContent>
              <ActionForm action={updateOrderStatus.bind(null, order.id)} className="space-y-3">
                <select
                  name="status"
                  defaultValue={order.status}
                  aria-label="Order status"
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <SubmitButton variant="outline" className="w-full" pendingText="Saving…">Save status</SubmitButton>
              </ActionForm>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
