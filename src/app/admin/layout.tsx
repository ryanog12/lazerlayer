import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FolderTree, LayoutDashboard, LifeBuoy, Package, ShoppingBag, Users } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { NavLink } from "@/components/site/nav-link";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · LazerLayer" }, robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/tickets", label: "Tickets", icon: LifeBuoy },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b bg-sidebar text-sidebar-foreground md:min-h-screen md:border-r md:border-b-0">
        <div className="flex items-center justify-between p-4 md:block">
          <Logo />
          <p className="mt-1 hidden text-xs text-muted-foreground md:block">Admin · {user.email}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3">
          {NAV.map((n) => (
            <NavLink
              key={n.href}
              href={n.href}
              exact={n.href === "/admin"}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              activeClassName="border-primary/40 bg-primary/12 text-foreground shadow-[inset_3px_0_0_var(--laser),0_0_18px_-8px_var(--laser-glow)] [&_svg]:text-laser"
            >
              <n.icon className="size-4" /> {n.label}
            </NavLink>
          ))}
          <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground md:mt-6">
            <ExternalLink className="size-4" /> View store
          </Link>
        </nav>
      </aside>
      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
