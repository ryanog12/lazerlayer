import Link from "next/link";
import type { TicketStatus, TicketType } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TicketStatusBadge } from "@/components/site/status-badge";
import { db } from "@/lib/db";
import { formatDate, TICKET_STATUS_LABEL, TICKET_TYPE_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Tickets" };

const STATUS_FILTERS: (TicketStatus | "")[] = ["", "open", "in_progress", "resolved"];
const TYPE_FILTERS: (TicketType | "")[] = ["", "custom_request", "order_issue", "general"];

export default async function AdminTicketsPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  const sp = await searchParams;
  const status = STATUS_FILTERS.includes(sp.status as TicketStatus) ? (sp.status as TicketStatus) : "";
  const type = TYPE_FILTERS.includes(sp.type as TicketType) ? (sp.type as TicketType) : "";

  const tickets = await db.ticket.findMany({
    where: { ...(status && { status }), ...(type && { type }) },
    include: { order: { select: { reference: true } }, _count: { select: { messages: true } } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const href = (next: { status?: string; type?: string }) => {
    const p = new URLSearchParams();
    const s = next.status ?? status;
    const t = next.type ?? type;
    if (s) p.set("status", s);
    if (t) p.set("type", t);
    return `/admin/tickets${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <Link key={s || "all"} href={href({ status: s })} className={cn("rounded-full border bg-background px-3 py-1 text-sm", status === s && "border-primary bg-primary text-primary-foreground")}>
              {s ? TICKET_STATUS_LABEL[s] : "All statuses"}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((t) => (
            <Link key={t || "all"} href={href({ type: t })} className={cn("rounded-full border bg-background px-3 py-1 text-sm", type === t && "border-primary bg-primary text-primary-foreground")}>
              {t ? TICKET_TYPE_LABEL[t] : "All types"}
            </Link>
          ))}
        </div>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Msgs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-72 truncate">
                    <Link href={`/admin/tickets/${t.id}`} className="font-medium text-primary hover:underline">{t.subject}</Link>
                  </TableCell>
                  <TableCell>{TICKET_TYPE_LABEL[t.type]}</TableCell>
                  <TableCell>{t.contactEmail ?? "—"}</TableCell>
                  <TableCell className="font-mono">{t.order?.reference ?? "—"}</TableCell>
                  <TableCell>{t._count.messages}</TableCell>
                  <TableCell><TicketStatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(t.updatedAt)}</TableCell>
                </TableRow>
              ))}
              {tickets.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No tickets found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
