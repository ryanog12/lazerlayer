"use client";

import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/site/submit-button";
import { FormPendingContext, useFormAction } from "@/components/site/action-form";
import { markPaymentSent } from "@/actions/checkout";

export function PaymentSentForm({ reference, alreadyMarked }: { reference: string; alreadyMarked: boolean }) {
  const { state, pending, onSubmit } = useFormAction(markPaymentSent);

  if (state?.success || alreadyMarked) {
    return (
      <div className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        <CheckCircle2 className="size-5 shrink-0" />
        <div>
          <p className="font-medium">Payment reported</p>
          <p>{state?.success ?? "You've told us this order is paid. We'll confirm it shortly and start production."}</p>
        </div>
      </div>
    );
  }

  return (
    <FormPendingContext.Provider value={pending}>
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="reference" value={reference} />
      <div className="space-y-2">
        <Label htmlFor="note">Payment note (optional)</Label>
        <Textarea id="note" name="note" rows={2} placeholder="e.g. Sent from Jane D., 2:15pm, confirmation #1234" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="proof">Upload proof (screenshot, optional)</Label>
        <Input id="proof" name="proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
      </div>
      {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <SubmitButton size="lg" pendingText="Submitting…">I&apos;ve sent the payment</SubmitButton>
    </form>
    </FormPendingContext.Provider>
  );
}
