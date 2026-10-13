import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Calendar,
  Car,
  CircleDollarSign,
  Flag,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Star,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/luxy/bits";
import { landing } from "@/lib/luxy/pricing";
import { useLuxy, useHydrated, useUser } from "@/lib/luxy/store";
import type { Role } from "@/lib/luxy/types";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof Car; fuzzy?: boolean };

const NAV: Record<Role, { tag: string; items: Item[] }> = {
  customer: {
    tag: "Customer",
    items: [
      { to: "/customer", label: "Dashboard", icon: LayoutDashboard },
      { to: "/customer/cars", label: "Browse Cars", icon: Car },
      { to: "/customer/bookings", label: "My Bookings", icon: Calendar },
      { to: "/customer/favorites", label: "Favorites", icon: Heart },
      { to: "/customer/wallet", label: "Wallet", icon: Wallet },
      { to: "/customer/messages", label: "Messages", icon: MessageSquare },
      { to: "/customer/reviews", label: "Reviews", icon: Star },
      { to: "/customer/support", label: "Support", icon: LifeBuoy },
      { to: "/customer/notifications", label: "Notifications", icon: Bell },
      { to: "/customer/settings", label: "Settings", icon: Settings },
    ],
  },
  owner: {
    tag: "Car owner",
    items: [
      { to: "/owner", label: "Dashboard", icon: LayoutDashboard },
      { to: "/owner/cars", label: "My Cars", icon: Car },
      { to: "/owner/bookings", label: "Bookings", icon: Calendar },
      { to: "/owner/earnings", label: "Earnings", icon: CircleDollarSign },
      { to: "/owner/calendar", label: "Calendar", icon: Calendar },
      { to: "/owner/wallet", label: "Wallet", icon: Wallet },
      { to: "/owner/drivers", label: "Drivers", icon: Users },
      { to: "/owner/reviews", label: "Reviews", icon: Star },
      { to: "/owner/messages", label: "Messages", icon: MessageSquare },
      { to: "/owner/reports", label: "Reports", icon: Flag },
      { to: "/owner/settings", label: "Settings", icon: Settings },
    ],
  },
  driver: {
    tag: "Driver",
    items: [
      { to: "/driver", label: "Dashboard", icon: LayoutDashboard },
      { to: "/driver/trips", label: "My Trips", icon: Car },
      { to: "/driver/calendar", label: "Calendar", icon: Calendar },
      { to: "/driver/vehicles", label: "Vehicles", icon: Car },
      { to: "/driver/wallet", label: "Wallet", icon: Wallet },
      { to: "/driver/messages", label: "Messages", icon: MessageSquare },
      { to: "/driver/reviews", label: "Ratings & Reviews", icon: Star },
      { to: "/driver/support", label: "Support", icon: LifeBuoy },
      { to: "/driver/settings", label: "Settings", icon: Settings },
    ],
  },
  admin: {
    tag: "Super admin",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/users/customers", label: "Customers", icon: Users },
      { to: "/admin/users/owners", label: "Car Owners", icon: Users },
      { to: "/admin/users/drivers", label: "Drivers", icon: Users },
      { to: "/admin/users/admins", label: "Admins", icon: Users },
      { to: "/admin/vehicles", label: "Vehicles", icon: Car },
      { to: "/admin/bookings", label: "Bookings", icon: Calendar },
      { to: "/admin/payments", label: "Payments", icon: CircleDollarSign },
      { to: "/admin/earnings", label: "Earnings", icon: Wallet },
      { to: "/admin/reviews", label: "Reviews", icon: Star },
      { to: "/admin/disputes", label: "Disputes", icon: Flag },
      { to: "/admin/reports", label: "Reports", icon: Flag },
      { to: "/admin/analytics", label: "Analytics", icon: LayoutDashboard },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
      { to: "/admin/promotions", label: "Promotions", icon: Star },
      { to: "/admin/locations", label: "Locations", icon: Car },
      { to: "/admin/documents", label: "Documents", icon: Flag },
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/audit-logs", label: "Audit Logs", icon: Flag },
    ],
  },
};

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const user = useUser();
  const ready = useHydrated();
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });
  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", search: { next: href } });
    else if (user.role !== role) navigate({ to: landing(user.role) });
  }, [ready, user, role, href, navigate]);
  if (!ready || !user || user.role !== role) {
    return <p className="p-8 text-sm text-muted">Taking you to the right place…</p>;
  }
  return children;
}

export function DashShell({ role, children }: { role: Role; children: ReactNode }) {
  const user = useUser();
  const signOut = useLuxy((s) => s.signOut);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const cfg = NAV[role];

  function leave() {
    signOut();
    navigate({ to: "/" });
  }

  const side = (
    <div className="flex h-full flex-col bg-sidebar text-side">
      <div className="px-5 pt-6 pb-4">
        <Wordmark light />
        <p className="mt-2 text-xs tracking-widest text-side-muted uppercase">{cfg.tag}</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {cfg.items.map((item) => {
          const active = item.to === `/${role}` ? path === item.to : path === item.to || path.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm",
                active ? "bg-accent font-medium text-card" : "text-side hover:bg-white/5",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl bg-accent-deep p-4 text-card">
        <p className="font-serif text-lg leading-tight">List more, earn more.</p>
        <p className="mt-1 text-xs text-tint">Approved cars only. One price for the guest.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-page md:flex">
      <aside className="hidden w-64 shrink-0 md:block">{side}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 max-w-[80vw]">{side}</div>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-card px-4 py-4 md:px-8">
          <button className="min-h-11 min-w-11 rounded-lg border border-line md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="mx-auto size-5" />
          </button>
          <p className="truncate text-sm text-body">
            Hello, <span className="font-medium text-ink">{user?.full_name}</span>
          </p>
          <div className="flex items-center gap-2">
            {role === "owner" ? (
              <Link to="/owner/cars/new" className="hidden min-h-11 items-center rounded-lg bg-accent px-3 text-sm font-medium text-card sm:inline-flex">
                Add New Car
              </Link>
            ) : null}
            <button onClick={leave} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-body hover:bg-page">
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
      {role === "customer" ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-card md:hidden">
          {[
            ["/customer", "Home"],
            ["/customer/cars", "Browse"],
            ["/customer/bookings", "Trips"],
            ["/customer/wallet", "Wallet"],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="flex min-h-12 flex-1 items-center justify-center text-xs font-medium text-body">
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
      {role === "customer" ? <div className="h-14 md:hidden" /> : null}
    </div>
  );
}

export function StoreShell({ children }: { children: ReactNode }) {
  const user = useUser();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: "Home" },
    { to: "/#browse", label: "Browse Cars" },
    { to: user ? "/customer/bookings" : "/login", label: "My Bookings" },
    { to: "/support", label: "Support" },
  ];
  return (
    <div className="min-h-screen bg-page md:flex">
      <aside className="hidden w-64 shrink-0 bg-sidebar md:block">
        <div className="px-5 pt-6">
          <Wordmark light />
          <p className="mt-2 text-xs tracking-widest text-side-muted uppercase">Marketplace</p>
        </div>
        <nav className="mt-6 space-y-1 px-3">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              className={cn(
                "flex min-h-11 items-center rounded-lg px-3 text-sm",
                path === l.to ? "bg-accent text-card" : "text-side hover:bg-white/5",
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 bg-sidebar p-5">
            <div className="flex items-center justify-between">
              <Wordmark light />
              <button aria-label="Close" onClick={() => setOpen(false)} className="text-side">
                <X />
              </button>
            </div>
            <nav className="mt-6 space-y-2">
              {links.map((l) => (
                <a key={l.label} href={l.to} className="block py-2 text-side" onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-card px-4 py-3 md:px-8">
          <button className="min-h-11 min-w-11 md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <Link to="/" className="md:hidden">
            <Wordmark />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Link to={landing(user.role)} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-sm font-medium text-card">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-ink">
                  Sign in
                </Link>
                <Link to="/signup" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-sm font-medium text-card">
                  Create account
                </Link>
              </>
            )}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

export function FlowHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/">
          <Wordmark />
        </Link>
        <p className="text-xs tracking-widest text-muted uppercase">Booking</p>
      </div>
    </header>
  );
}
