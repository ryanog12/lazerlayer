"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { count } = useCart();
  return (
    <Button asChild variant="ghost" size="icon" className="relative" aria-label={`Cart (${count} items)`}>
      <Link href="/cart">
        <ShoppingCart className="size-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {count}
          </span>
        )}
      </Link>
    </Button>
  );
}
