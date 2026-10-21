import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge, TicketStatusBadge } from "@/components/site/status-badge";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatPrice, PAYMENT_METHOD_LABEL, TICKET_TYPE_LABEL } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requireAdmin();
  const [pendingCount, productionCount, openTickets, revenue, recentOrders, tickets] = await Promise.all([
    db.order.count({ where: { status: "pending_payment" } }),
    db.order.count({ where: { status: { in: ["paid", "in_production"] } } }),
    db.ticket.count({ where: { status: { not: "resolved" } } }),
    db.order.aggregate({ _sum: { total: true }, where: { status: { in: ["paid", "in_production", "shipped", "completed"] } } }),
    db.order.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.ticket.findMany({ where: { status: { not: "resolved" } }, orderBy: { updatedAt: "desc" }, take: 6 }),
  ]);

  const stats = [
    { label: "Awaiting payment", value: pendingCount, href: "/admin/orders?status=pending_payment" },
    { label: "To produce", value: productionCount, href: "/admin/orders?status=paid" },
    { label: "Open tickets", value: openTickets, href: "/admin/tickets" },
    { label: "Paid revenue", value: formatPrice(revenue._sum.total ?? 0), href: "/admin/orders" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent orders</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold hover:underline">{o.reference}</Link>
                    <p className="text-muted-foreground">{o.user.email} · {PAYMENT_METHOD_LABEL[o.paymentMethod]} · {formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">{formatPrice(o.total)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </li>
              ))}
              {recentOrders.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No orders yet.</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Open tickets</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {tickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <Link href={`/admin/tickets/${t.id}`} className="font-medium hover:underline">{t.subject}</Link>
                    <p className="text-muted-foreground">{TICKET_TYPE_LABEL[t.type]} · {t.contactEmail ?? "—"}</p>
                  </div>
                  <TicketStatusBadge status={t.status} />
                </li>
              ))}
              {tickets.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Inbox zero.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
