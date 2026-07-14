import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BusinessCard } from "@/components/BusinessCard";
import { store, type Card } from "@/lib/mock-store";

export const Route = createFileRoute("/cards/")({
  head: () => ({ meta: [{ title: "Cards — Volt" }, { name: "robots", content: "noindex" }] }),
  component: CardsIndex,
});

function CardsIndex() {
  const [cards, setCards] = useState<Card[]>([]);
  useEffect(() => {
    const u = store.getUser();
    if (u) setCards(store.listCards(u.id));
  }, []);

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-brand mb-2">Cards</div>
          <h1 className="text-3xl font-extrabold text-white tracking-tighter">Your Cards</h1>
        </div>
        <Link
          to="/cards/new"
          className="px-4 py-2 bg-brand text-brand-foreground text-sm font-bold rounded-md hover:brightness-110"
        >
          + New Card
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-xl p-16 text-center">
          <p className="text-sm text-slate-400 mb-4">No cards yet. Create your first digital business card.</p>
          <Link to="/cards/new" className="inline-flex px-4 py-2 bg-brand text-brand-foreground text-sm font-bold rounded-md">
            Create card
          </Link>
        </div>
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
    </AppShell>
  );
}
