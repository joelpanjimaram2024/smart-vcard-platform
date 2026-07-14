import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { store, type Contact } from "@/lib/mock-store";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Volt" }, { name: "robots", content: "noindex" }] }),
  component: Contacts,
});

function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");

  function refresh() {
    const u = store.getUser();
    if (u) setContacts(store.listContacts(u.id));
  }
  useEffect(refresh, []);

  const filtered = contacts.filter((c) =>
    [c.name, c.email, c.company, c.source].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-brand mb-2">Contacts</div>
          <h1 className="text-3xl font-extrabold text-white tracking-tighter">Your network</h1>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="bg-muted border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-brand/50 focus:outline-none w-full sm:w-64"
        />
      </div>

      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No contacts yet. They appear here as people save your card.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-[10px] font-mono uppercase tracking-widest text-slate-500">
              <tr>
                <Th>Name</Th>
                <Th>Company</Th>
                <Th className="hidden md:table-cell">Email</Th>
                <Th className="hidden md:table-cell">Source</Th>
                <Th>Added</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-brand/20 grid place-items-center text-brand font-bold text-xs shrink-0">
                        {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <span className="text-white font-medium">{c.name}</span>
                    </div>
                  </Td>
                  <Td>{c.company || "—"}</Td>
                  <Td className="hidden md:table-cell text-slate-400">{c.email}</Td>
                  <Td className="hidden md:table-cell text-slate-500 text-xs font-mono uppercase">{c.source || "—"}</Td>
                  <Td className="text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</Td>
                  <Td className="text-right">
                    <button
                      onClick={() => {
                        store.deleteContact(c.id);
                        refresh();
                      }}
                      className="text-xs text-slate-500 hover:text-destructive"
                    >
                      Delete
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
