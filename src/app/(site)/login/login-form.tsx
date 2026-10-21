"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/site/submit-button";
import { FormPendingContext, useFormAction } from "@/components/site/action-form";
import { loginAction } from "@/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const { state, pending, onSubmit } = useFormAction(loginAction, { refresh: false });
  return (
    <FormPendingContext.Provider value={pending}>
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-9" />
      </div>
      {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
      <SubmitButton size="lg" className="w-full" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
    </FormPendingContext.Provider>
  );
}
