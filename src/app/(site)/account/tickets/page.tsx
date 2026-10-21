import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/site/status-badge";
import { db } from "@/lib/db";
import { formatDate, TICKET_TYPE_LABEL } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Support tickets" };

export default async function TicketsPage() {
  const user = await requireUser("/account/tickets");
  const tickets = await db.ticket.findMany({
    where: { userId: user.id },
    include: { order: { select: { reference: true } }, _count: { select: { messages: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Support tickets</h2>
        <Button asChild><Link href="/account/tickets/new">New ticket</Link></Button>
      </div>
      <Card>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">You haven&apos;t opened any tickets.</p>
          ) : (
            <ul className="divide-y">
              {tickets.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <Link href={`/account/tickets/${t.id}`} className="font-medium hover:underline">{t.subject}</Link>
                    <p className="text-sm text-muted-foreground">
                      {TICKET_TYPE_LABEL[t.type]}
                      {t.order && ` · Order ${t.order.reference}`} · {t._count.messages} messages · updated {formatDate(t.updatedAt)}
                    </p>
                  </div>
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
