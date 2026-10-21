import Link from "next/link";
import { Menu, User } from "lucide-react";
import { auth } from "@/auth";
import { logoutAction } from "@/actions/auth";
import { ActionForm } from "./action-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CartButton } from "@/components/cart/cart-button";
import { Logo } from "./logo";
import { NavLink } from "./nav-link";

const NAV = [
  { href: "/products", label: "Catalog" },
  { href: "/custom-request", label: "Custom prints" },
  { href: "/#how-it-works", label: "How it works" },
];

export async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.href}
              href={n.href}
              className="relative py-5 transition-colors hover:text-foreground"
              activeClassName="text-foreground after:absolute after:inset-x-0 after:bottom-0 after:laser-line"
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <CartButton />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">My dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/tickets">Support tickets</Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <ActionForm action={logoutAction} refresh={false} toastSuccess={false}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </ActionForm>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-6">
              <SheetTitle>Menu</SheetTitle>
              <nav className="mt-4 flex flex-col gap-4">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href}>
                    {n.label}
                  </Link>
                ))}
                <Link href="/cart">Cart</Link>
                {user ? <Link href="/account">My dashboard</Link> : <Link href="/login">Sign in</Link>}
                {user?.role === "admin" && <Link href="/admin">Admin panel</Link>}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
