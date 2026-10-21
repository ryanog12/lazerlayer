"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "./cart-provider";

export function AddToCart({
  product,
  disabled,
}: {
  product: Omit<CartItem, "quantity">;
  disabled?: boolean;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border">
        <Button variant="ghost" size="icon" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          <Minus />
        </Button>
        <span className="w-8 text-center text-sm tabular-nums" data-testid="qty">
          {qty}
        </span>
        <Button variant="ghost" size="icon" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(99, q + 1))}>
          <Plus />
        </Button>
      </div>
      <Button
        size="lg"
        className="px-6"
        disabled={disabled}
        onClick={() => {
          add(product, qty);
          toast.success(`Added ${qty} × ${product.name} to your cart`);
        }}
      >
        <ShoppingCart /> {disabled ? "Out of stock" : "Add to cart"}
      </Button>
    </div>
  );
}
