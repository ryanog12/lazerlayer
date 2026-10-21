"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/format";

export function CartView() {
  const { items, ready, subtotal, setQuantity, remove } = useCart();

  if (!ready) return <div className="h-40 animate-pulse rounded-xl bg-muted" />;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
        <Button asChild>
          <Link href="/products">Browse the catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_280px]">
      <ul className="divide-y rounded-xl border">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-4 p-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.image && <Image src={item.image} alt="" fill unoptimized className="object-cover" sizes="80px" />}
            </div>
            <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <Link href={`/products/${item.slug}`} className="font-medium hover:underline">{item.name}</Link>
                <p className="text-sm text-muted-foreground">{formatPrice(item.price)} each</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-lg border">
                  <Button variant="ghost" size="icon-sm" aria-label="Decrease" onClick={() => setQuantity(item.productId, item.quantity - 1)}>
                    <Minus />
                  </Button>
                  <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                  <Button variant="ghost" size="icon-sm" aria-label="Increase" onClick={() => setQuantity(item.productId, item.quantity + 1)}>
                    <Plus />
                  </Button>
                </div>
                <span className="w-20 text-right font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</span>
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${item.name}`} onClick={() => remove(item.productId)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Card className="h-fit">
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">Free</span>
          </div>
          <div className="flex justify-between border-t pt-4 font-semibold">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/checkout">Checkout</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
