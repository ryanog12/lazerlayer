"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/site/submit-button";
import { FormPendingContext, useFormAction } from "@/components/site/action-form";
import { createTicket } from "@/actions/tickets";

export function NewTicketForm({
  orders,
  defaultOrderId,
}: {
  orders: { id: string; reference: string }[];
  defaultOrderId?: string;
}) {
  const { state, pending, onSubmit } = useFormAction(createTicket, { refresh: false });
  return (
    <FormPendingContext.Provider value={pending}>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="orderId">Related order</Label>
        <select
          id="orderId"
          name="orderId"
          defaultValue={defaultOrderId ?? ""}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Not about a specific order</option>
          {orders.map((o) => <option key={o.id} value={o.id}>{o.reference}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">How can we help?</Label>
        <Textarea id="body" name="body" rows={6} required />
      </div>
      {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <SubmitButton pendingText="Creating…">Create ticket</SubmitButton>
    </form>
    </FormPendingContext.Provider>
  );
}
