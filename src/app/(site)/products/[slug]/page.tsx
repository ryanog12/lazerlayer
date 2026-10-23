import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Layers, PencilRuler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCart } from "@/components/cart/add-to-cart";
import { db } from "@/lib/db";
import { formatPrice, productImages } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  return db.product.findFirst({ where: { slug, active: true }, include: { category: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { images: productImages(product).slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const images = productImages(product);
  const outOfStock = !product.isCustom && product.stock !== null && product.stock <= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">Catalog</Link>
        {product.category && (
          <>
            <ChevronRight className="size-4" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
            {images[0] && (
              <Image src={images[0]} alt={product.name} fill unoptimized priority className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1).map((src) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <Image src={src} alt="" fill unoptimized className="object-cover" sizes="12vw" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            {product.isCustom ? <Badge>Made to order</Badge> : <Badge variant="secondary">Ready to print</Badge>}
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-2xl font-semibold text-primary">
              {product.isCustom && <span className="text-base font-normal text-muted-foreground">From </span>}
              {formatPrice(product.price)}
            </p>
          </div>
          <p className="leading-relaxed text-muted-foreground">{product.description}</p>
          {product.materials && (
            <div className="flex gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
              <Layers className="size-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Materials &amp; specs</p>
                <p className="text-muted-foreground">{product.materials}</p>
              </div>
            </div>
          )}
          {!product.isCustom && product.stock !== null && (
            <p className="text-sm text-muted-foreground">
              {outOfStock ? "Currently out of stock" : `${product.stock} available`}
            </p>
          )}
          <AddToCart
            disabled={outOfStock}
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: images[0],
            }}
          />
          <div className="rounded-xl border border-dashed p-4">
            <p className="text-sm font-medium">Want it in a different size, color or material?</p>
            <p className="mb-3 text-sm text-muted-foreground">Send a custom request based on this product.</p>
            <Button asChild variant="outline">
              <Link href={`/custom-request?product=${product.slug}`}>
                <PencilRuler /> Request a custom version
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
