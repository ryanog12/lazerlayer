"use client";

import { Trash2 } from "lucide-react";
import { ActionForm } from "@/components/site/action-form";
import { SubmitButton } from "@/components/site/submit-button";
import type { ActionResult } from "@/lib/action-result";

export function ConfirmDelete({ action, label, message }: { action: () => Promise<ActionResult>; label: string; message: string }) {
  return (
    <ActionForm action={action} confirm={message}>
      <SubmitButton variant="destructive" size="sm" aria-label={label}>
        <Trash2 /> Delete
      </SubmitButton>
    </ActionForm>
  );
}
