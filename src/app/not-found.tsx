import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="text-2xl font-bold">This layer didn&apos;t print</h1>
      <p className="text-muted-foreground">We couldn&apos;t find the page you were looking for.</p>
      <div className="flex gap-3">
        <Button asChild><Link href="/">Go home</Link></Button>
        <Button asChild variant="outline"><Link href="/products">Browse catalog</Link></Button>
      </div>
    </div>
  );
}
