import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { store, type Lead } from "@/lib/mock-store";

const STATUSES: Lead["status"][] = ["new", "contacted", "qualified", "closed"];

const statusTone: Record<Lead["status"], string> = {
  new: "text-brand bg-brand/10 border-brand/30",
  contacted: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  qualified: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  closed: "text-slate-400 bg-white/5 border-white/10",
};

export const Route = createFileRoute("/leads")({
  head: () => ({ meta: [{ title: "Leads — Volt" }, { name: "robots", content: "noindex" }] }),
  component: Leads,
});

function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<Lead["status"] | "all">("all");

  function refresh() {
    const u = store.getUser();
    if (u) setLeads(store.listLeads(u.id).sort((a, b) => b.createdAt - a.createdAt));
  }
  useEffect(refresh, []);

  const visible = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  return (
    <AppShell>
      <div className="mb-8">
        <div className="text-[10px] font-mono uppercase tracking-widest text-brand mb-2">Pipeline</div>
        <h1 className="text-3xl font-extrabold text-white tracking-tighter">Leads</h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto text-xs font-mono uppercase tracking-widest">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
              filter === s ? "bg-brand text-brand-foreground" : "bg-muted text-slate-400 hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-card border border-white/5 rounded-2xl p-12 text-center text-sm text-slate-500">
          No leads {filter !== "all" && `with status "${filter}"`} yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((l) => (
            <div key={l.id} className="bg-card border border-white/5 rounded-xl p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-bold text-white truncate">{l.name}</h3>
                    <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${statusTone[l.status]}`}>
                      {l.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {l.email} {l.company && `· ${l.company}`}
                  </p>
                  {l.message && <p className="mt-3 text-sm text-slate-400 leading-relaxed">{l.message}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-slate-600 uppercase">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </span>
                  <select
                    value={l.status}
                    onChange={(e) => {
                      store.updateLead(l.id, { status: e.target.value as Lead["status"] });
                      refresh();
                    }}
                    className="bg-muted border border-white/5 rounded-md px-2 py-1 text-xs text-white focus:border-brand/50 focus:outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
