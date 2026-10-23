"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import type { Category, Product } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/site/submit-button";
import { saveProduct } from "@/actions/admin";
import { FormPendingContext, useFormAction } from "@/components/site/action-form";
import { productImages } from "@/lib/format";

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const { state, pending, onSubmit } = useFormAction(saveProduct, { toastSuccess: true });
  const [images, setImages] = useState<string[]>(product ? productImages(product) : []);

  return (
    <FormPendingContext.Provider value={pending}>
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      {product && <input type="hidden" name="id" value={product.id} />}
      {images.map((src) => <input key={src} type="hidden" name="keepImages" value={src} />)}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={product?.name} required className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug (optional)</Label>
        <Input id="slug" name="slug" defaultValue={product?.slug} placeholder="auto-generated from name" className="h-9" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={product?.description} rows={5} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Price (USD)</Label>
        <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product ? (product.price / 100).toFixed(2) : ""} required className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
          <option value="">Uncategorized</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="stock">Stock (blank = unlimited / made to order)</Label>
        <Input id="stock" name="stock" type="number" min="0" defaultValue={product?.stock ?? ""} className="h-9" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="materials">Materials / specs</Label>
        <Input id="materials" name="materials" defaultValue={product?.materials ?? ""} className="h-9" />
      </div>
      <div className="flex flex-wrap gap-6 sm:col-span-2">
        {[
          { name: "isCustom", label: "Made to order (custom)", checked: product?.isCustom ?? false },
          { name: "featured", label: "Featured on homepage", checked: product?.featured ?? false },
          { name: "active", label: "Visible in store", checked: product?.active ?? true },
        ].map((f) => (
          <label key={f.name} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={f.name} defaultChecked={f.checked} className="size-4 accent-[var(--primary)]" /> {f.label}
          </label>
        ))}
      </div>
      <div className="space-y-3 sm:col-span-2">
        <Label htmlFor="images">Images</Label>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((src) => (
              <div key={src} className="relative size-24 overflow-hidden rounded-lg border bg-muted">
                <Image src={src} alt="" fill unoptimized className="object-cover" sizes="96px" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => setImages((imgs) => imgs.filter((i) => i !== src))}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Input id="images" name="images" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" />
      </div>
      {state?.error && <p className="text-sm text-destructive sm:col-span-2" role="alert">{state.error}</p>}
      <div className="flex gap-3 sm:col-span-2">
        <SubmitButton pendingText="Saving…">{product ? "Save changes" : "Create product"}</SubmitButton>
        <Button asChild variant="ghost"><Link href="/admin/products">Cancel</Link></Button>
      </div>
    </form>
    </FormPendingContext.Provider>
  );
}
