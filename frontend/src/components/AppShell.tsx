import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { store, seedDemoData } from "@/lib/mock-store";
import { useEffect, useState, type ReactNode } from "react";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/cards", label: "Cards" },
  { to: "/contacts", label: "Contacts" },
  { to: "/leads", label: "Leads" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState(() => store.getUser());

  useEffect(() => {
    const u = store.getUser();
    if (!u) {
      router.navigate({ to: "/auth" });
      return;
    }
    seedDemoData(u.id);
    setUser(u);
  }, [router]);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-white/5 bg-surface/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <div className="flex min-w-0 items-center gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="size-7 bg-brand rounded-sm" />
              <span className="text-lg font-extrabold tracking-tighter text-white">VOLT.</span>
            </Link>
            <nav className="hidden md:flex gap-1 text-xs font-mono uppercase tracking-tighter">
              {navItems.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      active ? "text-brand bg-brand/10" : "text-slate-500 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/cards/new"
              className="hidden sm:inline-flex px-3 py-1.5 bg-brand text-brand-foreground text-xs font-bold rounded-md hover:brightness-110 transition"
            >
              + New Card
            </Link>
            <button
              onClick={() => {
                store.setUser(null);
                router.navigate({ to: "/auth" });
              }}
              className="size-9 rounded-full bg-elevated border border-white/10 grid place-items-center text-xs font-bold text-slate-300 hover:border-brand/40"
              title={user.email}
            >
              {initials}
            </button>
          </div>
        </div>
        {/* mobile nav */}
        <nav className="md:hidden border-t border-white/5 flex gap-1 px-4 py-2 overflow-x-auto text-xs font-mono uppercase">
          {navItems.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
                  active ? "text-brand bg-brand/10" : "text-slate-500"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
