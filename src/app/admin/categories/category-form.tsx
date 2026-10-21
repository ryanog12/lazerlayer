"use client";

import type { Category } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/site/submit-button";
import { saveCategory } from "@/actions/admin";
import { ActionForm } from "@/components/site/action-form";

export function CategoryForm({ category }: { category?: Category }) {
  return (
    <ActionForm action={saveCategory} resetOnSuccess={!category} className="flex flex-wrap items-center gap-2">
      {category && <input type="hidden" name="id" value={category.id} />}
      <Input name="name" defaultValue={category?.name} placeholder="Name" required className="h-8 w-48" aria-label="Category name" />
      <Input name="slug" defaultValue={category?.slug} placeholder="slug (optional)" className="h-8 w-48 font-mono" aria-label="Category slug" />
      <SubmitButton size="sm" variant={category ? "outline" : "default"}>{category ? "Save" : "Add"}</SubmitButton>
    </ActionForm>
  );
}
