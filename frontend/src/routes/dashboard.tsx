import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BusinessCard } from "@/components/BusinessCard";
import { store, type Card, type Lead } from "@/lib/mock-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Volt" }, { name: "robots", content: "noindex" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const u = store.getUser();
    if (!u) return;
    setCards(store.listCards(u.id));
    setLeads(store.listLeads(u.id));
  }, []);

  const active = cards[0];
  const totals = useMemo(() => {
    return cards.reduce(
      (acc, c) => ({
        views: acc.views + c.stats.views,
        scans: acc.scans + c.stats.scans,
        downloads: acc.downloads + c.stats.downloads,
        saves: acc.saves + c.stats.saves,
      }),
      { views: 0, scans: 0, downloads: 0, saves: 0 },
    );
  }, [cards]);

  const cardUrl = active
    ? typeof window !== "undefined"
      ? `${window.location.origin}/c/${active.id}`
      : `/c/${active.id}`
    : "";

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-brand mb-2">Overview</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter">Pulse Dashboard</h1>
        </div>
        <Link
          to="/cards/new"
          className="hidden sm:inline-flex px-4 py-2 bg-brand text-brand-foreground text-sm font-bold rounded-md hover:brightness-110 transition"
        >
          + New Card
        </Link>
      </div>

      {/* Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Stats column */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <StatTile label="Total Scans" value={totals.scans} delta="+12.4%" />
          <StatTile label="Total Views" value={totals.views} delta="+8.1%" />
          <StatTile label="Saves" value={totals.saves} delta="+22%" />
          <StatTile label="Downloads" value={totals.downloads} delta="+3%" />
        </div>

        {/* Active card */}
        <div className="lg:col-span-6 bg-card border border-white/5 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest">Active Card</h3>
            {active && (
              <Link
                to="/cards/$id"
                params={{ id: active.id }}
                className="text-[10px] font-mono text-brand border border-brand/20 px-2 py-1 rounded hover:bg-brand/10"
              >
                VIEW PUBLIC
              </Link>
            )}
          </div>
          {active ? (
            <>
              <BusinessCard card={active} qrValue={cardUrl} />
              <div className="mt-6 grid grid-cols-3 gap-3">
                <MiniTile label="Conversions" value={active.stats.saves} />
                <MiniTile label="Save Rate" value={`${Math.round((active.stats.saves / Math.max(active.stats.scans, 1)) * 100)}%`} />
                <MiniTile label="Direct Tap" value={active.stats.views} />
              </div>
            </>
          ) : (
            <EmptyCards />
          )}
        </div>

        {/* Recent leads */}
        <div className="lg:col-span-3 bg-card border border-white/5 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest">New Leads</h3>
            <Link to="/leads" className="text-[10px] font-mono text-brand hover:underline">ALL →</Link>
          </div>
          {leads.length === 0 ? (
            <p className="text-xs text-slate-500">Share your card to start capturing leads.</p>
          ) : (
            <div className="space-y-5">
              {leads.slice(0, 5).map((l) => (
                <div key={l.id} className="flex gap-4">
                  <div className="size-8 rounded-full bg-brand/20 grid place-items-center text-brand font-bold text-xs shrink-0">
                    {l.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{l.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{new Date(l.createdAt).toLocaleString()} · {l.company || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All cards list */}
        <div className="lg:col-span-12 bg-card border border-white/5 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest">Your Cards</h3>
            <Link to="/cards" className="text-[10px] font-mono text-brand hover:underline">MANAGE →</Link>
          </div>
          {cards.length === 0 ? (
            <EmptyCards />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((c) => {
                const url = typeof window !== "undefined" ? `${window.location.origin}/c/${c.id}` : `/c/${c.id}`;
                return (
                  <Link
                    key={c.id}
                    to="/cards/$id"
                    params={{ id: c.id }}
                    className="block hover:-translate-y-0.5 transition-transform"
                  >
                    <BusinessCard card={c} qrValue={url} compact />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatTile({ label, value, delta }: { label: string; value: number; delta: string }) {
  return (
    <div className="bg-card border border-white/5 rounded-2xl p-5">
      <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">{label}</p>
      <p className="text-3xl font-extrabold text-white tracking-tighter">
        {value.toLocaleString()}
      </p>
      <div className="mt-2 text-xs text-brand">{delta} vs last week</div>
    </div>
  );
}

function MiniTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-white/5 text-center">
      <p className="text-[10px] font-mono text-slate-500 uppercase">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function EmptyCards() {
  return (
    <div className="border border-dashed border-white/10 rounded-xl p-10 text-center">
      <p className="text-sm text-slate-400 mb-4">You don't have any cards yet.</p>
      <Link
        to="/cards/new"
        className="inline-flex px-4 py-2 bg-brand text-brand-foreground text-sm font-bold rounded-md hover:brightness-110"
      >
        Create your first card
      </Link>
    </div>
  );
}
