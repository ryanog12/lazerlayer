import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge, TicketStatusBadge } from "@/components/site/status-badge";
import { db } from "@/lib/db";
import { formatDate, formatPrice, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "My dashboard" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [orders, tickets, openTickets] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    db.ticket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.ticket.count({ where: { userId: user.id, status: { not: "resolved" } } }),
  ]);

  const pending = orders.filter((o) => o.status === "pending_payment");
  const active = orders.filter((o) => ["paid", "in_production", "shipped"].includes(o.status));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Awaiting payment", value: pending.length },
          { label: "In progress", value: active.length },
          { label: "Open tickets", value: openTickets },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="size-5" /> Your orders</CardTitle></CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No orders yet. <Link href="/products" className="text-primary underline">Browse the catalog</Link>
            </div>
          ) : (
            <ul className="divide-y">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <Link href={`/orders/${o.reference}`} className="font-mono font-semibold hover:underline">{o.reference}</Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items · {PAYMENT_METHOD_LABEL[o.paymentMethod]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium tabular-nums">{formatPrice(o.total)}</span>
                    <OrderStatusBadge status={o.status} />
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/orders/${o.reference}`}>{o.status === "pending_payment" ? "Pay / details" : "Track"}</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/account/tickets/new?orderId=${o.id}`}>Get help</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><LifeBuoy className="size-5" /> Recent tickets</CardTitle>
          <Button asChild size="sm"><Link href="/account/tickets/new">New ticket</Link></Button>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No support tickets yet.</p>
          ) : (
            <ul className="divide-y">
              {tickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/account/tickets/${t.id}`} className="font-medium hover:underline">{t.subject}</Link>
                  <TicketStatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
