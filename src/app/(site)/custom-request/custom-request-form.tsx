"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/site/submit-button";
import { FormPendingContext, useFormAction } from "@/components/site/action-form";
import { submitCustomRequest } from "@/actions/tickets";

const MATERIALS = ["No preference", "PLA", "PETG", "ASA", "TPU (flexible)", "Nylon", "Carbon-fiber blend", "Resin (high detail)"];

export function CustomRequestForm({
  product,
  defaults,
}: {
  product: { slug: string; name: string } | null;
  defaults: { name: string; email: string };
}) {
  const { state, pending, onSubmit } = useFormAction(submitCustomRequest, { refresh: false });

  if (state?.success) {
    return (
      <div className="space-y-4 py-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-400" />
        <p className="text-lg font-semibold">{state.success}</p>
        <div className="flex justify-center gap-3">
          <Button asChild variant="outline"><Link href="/products">Keep browsing</Link></Button>
          {defaults.email && <Button asChild><Link href="/account/tickets">View my tickets</Link></Button>}
        </div>
      </div>
    );
  }

  return (
    <FormPendingContext.Provider value={pending}>
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      {product && (
        <div className="rounded-lg bg-muted p-3 text-sm sm:col-span-2">
          Based on: <span className="font-medium">{product.name}</span>
          <input type="hidden" name="product" value={product.slug} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaults.name} required className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={defaults.email} required className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone / other contact (optional)</Label>
        <Input id="phone" name="phone" className="h-9" />
      </div>
      <div className="grid grid-cols-[1fr_96px] gap-3">
        <div className="space-y-2">
          <Label htmlFor="preferredMaterial">Preferred material</Label>
          <select
            id="preferredMaterial"
            name="preferredMaterial"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            defaultValue="No preference"
          >
            {MATERIALS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required className="h-9" />
        </div>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">What would you like printed?</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          required
          placeholder="Describe the object, size, color, intended use, deadlines…"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="file">Model or reference file (optional)</Label>
        <Input id="file" name="file" type="file" accept=".stl,.obj,.3mf,.step,.stp,.png,.jpg,.jpeg,.pdf,.zip" />
        <p className="text-xs text-muted-foreground">STL, OBJ, 3MF, STEP, images, PDF or ZIP — max 50 MB.</p>
      </div>
      {state?.error && <p className="text-sm text-destructive sm:col-span-2" role="alert">{state.error}</p>}
      <div className="sm:col-span-2">
        <SubmitButton size="lg" className="px-6" pendingText="Sending request…">Submit request</SubmitButton>
      </div>
    </form>
    </FormPendingContext.Provider>
  );
}
