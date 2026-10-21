import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/site/status-badge";
import { SubmitButton } from "@/components/site/submit-button";
import { ActionForm } from "@/components/site/action-form";
import { ReplyForm } from "@/components/tickets/reply-form";
import { TicketThread } from "@/components/tickets/ticket-thread";
import { setTicketStatus } from "@/actions/admin";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDate, TICKET_STATUS_LABEL, TICKET_TYPE_LABEL } from "@/lib/format";

export const metadata = { title: "Ticket" };

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      user: true,
      order: true,
      messages: { include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/tickets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All tickets
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{ticket.subject}</CardTitle>
              <p className="text-sm text-muted-foreground">{TICKET_TYPE_LABEL[ticket.type]} · opened {formatDate(ticket.createdAt)}</p>
            </div>
            <TicketStatusBadge status={ticket.status} />
          </CardHeader>
          <CardContent className="space-y-6">
            <TicketThread messages={ticket.messages} viewer="admin" />
            <div className="border-t pt-6">
              <ReplyForm ticketId={ticket.id} placeholder="Reply to the customer (they'll get an email)…" />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Contact:</span> {ticket.contactName ?? ticket.user?.name ?? "—"}</p>
              <p className="break-all"><span className="text-muted-foreground">Email:</span> {ticket.contactEmail ?? ticket.user?.email ?? "—"}</p>
              {ticket.contactPhone && <p><span className="text-muted-foreground">Phone:</span> {ticket.contactPhone}</p>}
              <p><span className="text-muted-foreground">Account:</span> {ticket.user ? "Registered customer" : "Guest"}</p>
              {ticket.preferredMaterial && <p><span className="text-muted-foreground">Material:</span> {ticket.preferredMaterial}</p>}
              {ticket.quantity && <p><span className="text-muted-foreground">Quantity:</span> {ticket.quantity}</p>}
              {ticket.order && (
                <p>
                  <span className="text-muted-foreground">Order:</span>{" "}
                  <Link href={`/admin/orders/${ticket.order.id}`} className="font-mono text-primary underline">{ticket.order.reference}</Link>
                </p>
              )}
              {ticket.attachmentUrl && (
                <a href={ticket.attachmentUrl} className="inline-flex items-center gap-1 text-primary underline">
                  <Paperclip className="size-4" /> Download attachment
                </a>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ActionForm action={setTicketStatus.bind(null, ticket.id)} className="space-y-3">
                <select name="status" defaultValue={ticket.status} aria-label="Ticket status" className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                  {Object.entries(TICKET_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <SubmitButton variant="outline" className="w-full">Update status</SubmitButton>
              </ActionForm>
              {ticket.status !== "resolved" && (
                <ActionForm action={setTicketStatus.bind(null, ticket.id)}>
                  <input type="hidden" name="status" value="resolved" />
                  <SubmitButton className="w-full">Mark resolved</SubmitButton>
                </ActionForm>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
