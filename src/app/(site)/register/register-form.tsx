"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/site/submit-button";
import { FormPendingContext, useFormAction } from "@/components/site/action-form";
import { registerAction } from "@/actions/auth";

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const { state, pending, onSubmit } = useFormAction(registerAction, { refresh: false });
  return (
    <FormPendingContext.Provider value={pending}>
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="h-9" />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <SubmitButton size="lg" className="w-full" pendingText="Creating account…">Create account</SubmitButton>
    </form>
    </FormPendingContext.Provider>
  );
}
