import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-tight", className)}>
      <span className="text-laser text-glow">Lazer</span>
      <span className="text-steel">Layer</span>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} aria-label="LazerLayer home">
      <LogoMark className="size-8" />
      <Wordmark className="text-xl" />
    </Link>
  );
}
