import type { Metadata } from "next";
import { FileUp, MessageSquareQuote, Ruler } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { CustomRequestForm } from "./custom-request-form";

export const metadata: Metadata = {
  title: "Custom 3D print request",
  description: "Upload an STL or describe your idea and get a quote for a custom 3D print from LazerLayer.",
};

export default async function CustomRequestPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product: productSlug } = await searchParams;
  const [user, product] = await Promise.all([
    getCurrentUser(),
    productSlug ? db.product.findUnique({ where: { slug: productSlug }, select: { slug: true, name: true } }) : null,
  ]);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_340px]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request a custom print</h1>
        <p className="mb-8 text-muted-foreground">
          Tell us what you need. We&apos;ll review it, recommend materials and send you a quote.
        </p>
        <Card>
          <CardContent>
            <CustomRequestForm
              product={product}
              defaults={{ name: user?.name ?? "", email: user?.email ?? "" }}
            />
          </CardContent>
        </Card>
      </div>
      <aside className="space-y-4">
        {[
          { icon: FileUp, title: "Files we accept", body: "STL, OBJ, 3MF, STEP — or just photos and sketches. Up to 50 MB." },
          { icon: Ruler, title: "Engineering parts", body: "Include critical dimensions and tolerances; we'll confirm before printing." },
          { icon: MessageSquareQuote, title: "What happens next", body: "Your request becomes a support ticket. You'll get a reply by email and in your dashboard." },
        ].map((t) => (
          <div key={t.title} className="flex gap-3 rounded-xl border p-4">
            <t.icon className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">{t.title}</p>
              <p className="text-sm text-muted-foreground">{t.body}</p>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}
