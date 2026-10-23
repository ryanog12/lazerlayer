import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/site/product-card";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse ready-to-print figures, decor, tabletop terrain, tech accessories and functional parts.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;
  const query = q.trim();

  const where: Prisma.ProductWhereInput = { active: true };
  if (category) where.category = { slug: category };
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { description: { contains: query } },
      { materials: { contains: query } },
    ];
  }

  const [categories, products] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.product.findMany({ where, include: { category: true }, orderBy: [{ featured: "desc" }, { name: "asc" }] }),
  ]);

  const chipHref = (slug: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (slug) params.set("category", slug);
    const s = params.toString();
    return s ? `/products?${s}` : "/products";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
          <p className="text-muted-foreground">Ready-made designs, printed to order on calibrated machines.</p>
        </div>
        <form className="flex w-full gap-2 md:w-80" action="/products">
          {category && <input type="hidden" name="category" value={category} />}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={query} placeholder="Search prints…" className="h-9 pl-8" aria-label="Search products" />
          </div>
          <Button type="submit" size="lg">Search</Button>
        </form>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {[{ slug: "", name: "All" }, ...categories].map((c) => (
          <Link
            key={c.slug || "all"}
            href={chipHref(c.slug)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              category === c.slug ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">No products match your filters.</p>
          <p className="text-sm text-muted-foreground">
            Try a different search — or{" "}
            <Link href="/custom-request" className="text-primary underline">request a custom print</Link>.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
