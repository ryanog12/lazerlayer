"use client";

import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/site/submit-button";
import { ActionForm } from "@/components/site/action-form";
import { replyToTicket } from "@/actions/tickets";

export function ReplyForm({ ticketId, placeholder }: { ticketId: string; placeholder?: string }) {
  return (
    <ActionForm action={replyToTicket} resetOnSuccess className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Textarea name="body" rows={4} required placeholder={placeholder ?? "Write a reply…"} aria-label="Reply" />
      <SubmitButton pendingText="Sending…">Send reply</SubmitButton>
    </ActionForm>
  );
}
