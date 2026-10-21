import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/site/status-badge";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatPrice, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

const FILTERS: (OrderStatus | "")[] = ["", "pending_payment", "paid", "in_production", "shipped", "completed", "cancelled"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status = "" } = await searchParams;
  const valid = FILTERS.includes(status as OrderStatus) ? (status as OrderStatus | "") : "";
  const orders = await db.order.findMany({
    where: valid ? { status: valid } : undefined,
    include: { user: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f || "all"}
            href={f ? `/admin/orders?status=${f}` : "/admin/orders"}
            className={cn(
              "rounded-full border bg-background px-3 py-1 text-sm",
              valid === f && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {f ? ORDER_STATUS_LABEL[f] : "All"}
          </Link>
        ))}
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-primary hover:underline">{o.reference}</Link>
                  </TableCell>
                  <TableCell>{o.user.name ?? o.user.email}</TableCell>
                  <TableCell>
                    {PAYMENT_METHOD_LABEL[o.paymentMethod]}
                    {o.status === "pending_payment" && o.customerMarkedPaidAt && (
                      <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-300">customer says paid</span>
                    )}
                  </TableCell>
                  <TableCell>{o.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(o.total)}</TableCell>
                  <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No orders found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
