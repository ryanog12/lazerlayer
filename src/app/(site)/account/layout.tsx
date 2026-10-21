import Link from "next/link";
import { NavLink } from "@/components/site/nav-link";
import { requireUser } from "@/lib/session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
          <h1 className="text-3xl font-bold tracking-tight">Hi, {user.name?.split(" ")[0] ?? "there"}</h1>
        </div>
        <nav className="flex gap-2 text-sm">
          <NavLink href="/account" exact className="rounded-full border px-3 py-1.5 hover:bg-muted" activeClassName="border-primary bg-primary text-primary-foreground hover:bg-primary">Orders</NavLink>
          <NavLink href="/account/tickets" className="rounded-full border px-3 py-1.5 hover:bg-muted" activeClassName="border-primary bg-primary text-primary-foreground hover:bg-primary">Support tickets</NavLink>
          {user.role === "admin" && (
            <Link href="/admin" className="rounded-full border border-primary px-3 py-1.5 text-primary hover:bg-primary/5">Admin panel</Link>
          )}
        </nav>
      </div>
      {children}
    </div>
  );
}
