import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NewTicketForm } from "./new-ticket-form";

export const metadata: Metadata = { title: "New support ticket" };

export default async function NewTicketPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  const user = await requireUser("/account/tickets/new");
  const orders = await db.order.findMany({
    where: { userId: user.id },
    select: { id: true, reference: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>Open a support ticket</CardTitle></CardHeader>
      <CardContent>
        <NewTicketForm orders={orders} defaultOrderId={orders.some((o) => o.id === orderId) ? orderId : undefined} />
      </CardContent>
    </Card>
  );
}
