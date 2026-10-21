import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, FileUp, Layers, PackageCheck, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { LogoMark } from "@/components/site/logo-mark";
import { Wordmark } from "@/components/site/logo";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: FileUp, title: "Pick or upload", body: "Choose a ready-made design from the catalog, or send us an STL, sketch or idea." },
  { icon: Ruler, title: "We quote & tune", body: "We pick the right material, layer height and orientation — and confirm a price for custom work." },
  { icon: Layers, title: "Print & finish", body: "Your part is printed on calibrated machines, then cleaned, inspected and finished by hand." },
  { icon: PackageCheck, title: "Ship to you", body: "Tracked shipping with status updates in your dashboard from payment to delivery." },
];

export default async function HomePage() {
  const featured = await db.product.findMany({
    where: { featured: true, active: true },
    include: { category: true },
    take: 4,
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_75%_40%,oklch(0.32_0.01_265),transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(0deg,transparent_0_11px,rgba(255,255,255,.035)_11px_12px)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div className="space-y-6">
            <span className="surface-bevel inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-laser" /> FDM · Resin · Engineering filaments
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Precision prints,
              <br />
              <span className="text-laser text-glow">layer by layer.</span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              <Wordmark /> turns digital designs into durable, beautifully finished parts — from desk toys and
              tabletop terrain to functional prototypes built to spec.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5">
                <Link href="/products">
                  Shop the catalog <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5">
                <Link href="/custom-request">Request a custom print</Link>
              </Button>
            </div>
            <dl className="grid max-w-md grid-cols-3 gap-4 pt-4 text-sm">
              {[
                ["Layer height", "0.05 mm"],
                ["Materials", "12+"],
                ["Turnaround", "3–5 days"],
              ].map(([k, v]) => (
                <div key={k} className="border-l-2 border-primary/60 pl-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-xl font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden>
            <div className="absolute inset-[12%] rounded-full bg-primary/10 blur-3xl" />
            <LogoMark laser={false} className="absolute inset-[6%] size-[88%] drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
            <Image
              src="/brand/laser-beam.png"
              alt=""
              width={572}
              height={371}
              priority
              className="absolute top-[12%] -left-[8%] w-[116%] max-w-none mix-blend-screen drop-shadow-[0_0_18px_rgba(224,30,43,0.7)]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Featured prints</h2>
            <p className="text-muted-foreground">Customer favorites, ready to print and ship.</p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/products">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-y bg-black/15">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mb-10 text-muted-foreground">From file to finished part in four steps.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="surface-bevel rounded-xl border bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-laser shadow-[0_0_16px_-6px_var(--laser-glow)]">
                    <s.icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">STEP 0{i + 1}</span>
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">About LazerLayer</h2>
          <p className="text-muted-foreground">
            We&apos;re a small fabrication studio running a farm of tuned FDM and resin printers. Every order
            is sliced by a person, not a script — so you get the right material, strength and finish for the
            job.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><ShieldCheck className="size-5 text-primary" /> Quality-checked before it ships</li>
            <li className="flex gap-3"><Boxes className="size-5 text-primary" /> PLA, PETG, ASA, Nylon, CF blends and resin</li>
            <li className="flex gap-3"><Ruler className="size-5 text-primary" /> Tolerances to ±0.1 mm for functional parts</li>
          </ul>
        </div>
        <div className="surface-bevel glow-laser relative flex flex-col justify-center gap-4 overflow-hidden rounded-2xl border p-8">
          <div aria-hidden className="laser-line absolute top-0 right-0 left-0" />
          <h3 className="text-2xl font-semibold">Have something specific in mind?</h3>
          <p className="text-muted-foreground">
            Upload an STL or describe your idea. We&apos;ll reply with material recommendations and a quote —
            usually within one business day.
          </p>
          <div>
            <Button asChild size="lg" className="h-11 px-5">
              <Link href="/custom-request">
                Start a custom request <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
