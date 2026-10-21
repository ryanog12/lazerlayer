import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/site/status-badge";
import { ReplyForm } from "@/components/tickets/reply-form";
import { TicketThread } from "@/components/tickets/ticket-thread";
import { db } from "@/lib/db";
import { formatDate, TICKET_TYPE_LABEL } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Ticket" };

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/account/tickets/${id}`);
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      order: { select: { reference: true } },
      messages: { include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket || ticket.userId !== user.id) notFound();

  return (
    <div className="space-y-4">
      <Link href="/account/tickets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All tickets
      </Link>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{ticket.subject}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {TICKET_TYPE_LABEL[ticket.type]}
              {ticket.order && (
                <> · Order <Link href={`/orders/${ticket.order.reference}`} className="font-mono underline">{ticket.order.reference}</Link></>
              )}{" "}
              · opened {formatDate(ticket.createdAt)}
            </p>
          </div>
          <TicketStatusBadge status={ticket.status} />
        </CardHeader>
        <CardContent className="space-y-6">
          <TicketThread messages={ticket.messages} viewer="customer" />
          <div className="border-t pt-6">
            {ticket.status === "resolved" && (
              <p className="mb-3 text-sm text-muted-foreground">This ticket is resolved. Replying will reopen it.</p>
            )}
            <ReplyForm ticketId={ticket.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
