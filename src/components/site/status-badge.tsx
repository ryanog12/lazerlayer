import type { OrderStatus, TicketStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL, TICKET_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

const ORDER_COLORS: Record<OrderStatus, string> = {
  pending_payment: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  paid: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  in_production: "bg-primary/15 text-red-300 border-primary/40",
  shipped: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-white/5 text-muted-foreground border-white/10",
};

const TICKET_COLORS: Record<TicketStatus, string> = {
  open: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  in_progress: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  resolved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn(ORDER_COLORS[status])}>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={cn(TICKET_COLORS[status])}>
      {TICKET_STATUS_LABEL[status]}
    </Badge>
  );
}
