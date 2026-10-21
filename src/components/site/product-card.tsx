import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

export type ProductCardData = {
  slug: string;
  name: string;
  price: number;
  images: string[];
  isCustom: boolean;
  category: { name: string } | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="surface-bevel group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_0_28px_-10px_var(--laser-glow)]"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            unoptimized
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {product.isCustom && <Badge className="absolute top-3 left-3">Made to order</Badge>}
      </div>
      <div className="space-y-1 p-4">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{product.category?.name ?? "Uncategorized"}</p>
        <p className="font-medium leading-snug">{product.name}</p>
        <p className="text-sm font-semibold text-laser">
          {product.isCustom ? "From " : ""}
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
