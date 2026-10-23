import Link from "next/link";
import { isStripeConfigured } from "@/lib/payments";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t bg-black/20">
      <div aria-hidden className="laser-line absolute inset-x-0 -top-px opacity-60" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Precision FDM &amp; resin printing for makers, gamers and engineers.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Shop</p>
          <Link href="/products" className="block text-muted-foreground hover:text-foreground">Catalog</Link>
          <Link href="/custom-request" className="block text-muted-foreground hover:text-foreground">Custom request</Link>
          <Link href="/cart" className="block text-muted-foreground hover:text-foreground">Cart</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Account</p>
          <Link href="/account" className="block text-muted-foreground hover:text-foreground">Dashboard</Link>
          <Link href="/account/tickets" className="block text-muted-foreground hover:text-foreground">Support</Link>
          <Link href="/register" className="block text-muted-foreground hover:text-foreground">Create account</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">We accept</p>
          <p className="text-muted-foreground">
            {isStripeConfigured() && <>Cards, Apple Pay &amp; Google Pay via Stripe · </>}Zelle · Cash App · Venmo
          </p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LazerLayer. All rights reserved.
      </div>
    </footer>
  );
}
