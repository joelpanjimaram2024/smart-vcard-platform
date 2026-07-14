// Public-facing short URL: /c/:id
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { store, uid, type Card, type Lead } from "@/lib/mock-store";
import { QRCode } from "@/components/QRCode";
import { downloadVCard } from "@/lib/vcard";

export const Route = createFileRoute("/c/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Digital Business Card — Volt` },
      { name: "description", content: `Save contact and connect.` },
    ],
    // params reference to avoid unused warning; real per-card metadata could go here.
    ...(params.id ? {} : {}),
  }),
  component: PublicCard,
});

function MissingCard() {
  return (
    <div className="min-h-screen grid place-items-center px-6 bg-surface">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-white tracking-tighter">Card not found</h1>
        <Link to="/" className="mt-6 inline-flex px-4 py-2 bg-brand text-brand-foreground text-sm font-bold rounded-md">
          Home
        </Link>
      </div>
    </div>
  );
}

function PublicCard() {
  const { id } = Route.useParams();
  const [card, setCard] = useState<Card | null>(null);
  const [missing, setMissing] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const c = store.getCard(id);
    if (!c) {
      setMissing(true);
      return;
    }
    store.incrementStat(id, "views");
    store.incrementStat(id, "scans");
    setCard({ ...c });
  }, [id]);

  const url = useMemo(
    () => (typeof window !== "undefined" ? `${window.location.origin}/c/${id}` : `/c/${id}`),
    [id],
  );

  if (missing) return <MissingCard />;
  if (!card) return null;
  const accent = card.accent || "#00F5FF";

  return (
    <div className="min-h-screen bg-surface text-slate-200">
      <nav className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-7 bg-brand rounded-sm" />
          <span className="text-lg font-extrabold tracking-tighter text-white">VOLT.</span>
        </Link>
      </nav>

      <div className="mx-auto max-w-4xl px-6 pb-24 pt-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="bg-card border border-white/5 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            <div
              className="absolute -top-24 -right-24 size-64 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: accent }}
            />
            <div className="relative">
              <div className="text-[10px] font-mono uppercase tracking-widest mb-6" style={{ color: accent }}>
                {card.company}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tighter">{card.name}</h1>
              <p className="mt-2 text-lg text-slate-400">{card.title}</p>

              {card.bio && <p className="mt-8 text-sm text-slate-400 leading-relaxed max-w-md">{card.bio}</p>}

              <dl className="mt-10 grid sm:grid-cols-2 gap-6">
                <Detail label="Email" value={card.email} href={`mailto:${card.email}`} />
                <Detail label="Phone" value={card.phone} href={`tel:${card.phone}`} />
                {card.website && (
                  <Detail
                    label="Website"
                    value={card.website}
                    href={card.website.startsWith("http") ? card.website : `https://${card.website}`}
                  />
                )}
                {card.linkedin && (
                  <Detail label="LinkedIn" value={`/in/${card.linkedin}`} href={`https://linkedin.com/in/${card.linkedin}`} />
                )}
              </dl>

              <div className="mt-10 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    downloadVCard(card);
                    store.incrementStat(card.id, "downloads");
                    store.incrementStat(card.id, "saves");
                  }}
                  className="px-6 py-3 bg-brand text-brand-foreground font-bold rounded-lg hover:brightness-110 transition"
                >
                  Save Contact
                </button>
                <button
                  onClick={() => setShowLead((s) => !s)}
                  className="px-6 py-3 bg-muted border border-white/5 text-white font-bold rounded-lg hover:bg-white/10 transition"
                >
                  Get in touch
                </button>
              </div>

              {showLead && !sent && <LeadForm cardId={card.id} ownerId={card.ownerId} onSent={() => setSent(true)} />}
              {sent && (
                <div className="mt-6 p-4 rounded-lg bg-brand/10 border border-brand/30 text-sm text-brand">
                  Thanks — your message was sent.
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-white/5 rounded-3xl p-6 sm:p-8 h-fit lg:sticky lg:top-8">
            <div className="text-[10px] font-mono uppercase tracking-widest text-brand mb-4">Scan to share</div>
            <div className="bg-white rounded-2xl p-4 grid place-items-center">
              <QRCode value={url} size={240} />
            </div>
            <p className="mt-4 text-xs text-slate-500 text-center font-mono break-all">{url.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</dt>
      <dd className="mt-1">
        {href ? (
          <a href={href} className="text-sm text-white hover:text-brand break-all transition">{value}</a>
        ) : (
          <span className="text-sm text-white break-all">{value}</span>
        )}
      </dd>
    </div>
  );
}

function LeadForm({ cardId, ownerId, onSent }: { cardId: string; ownerId: string; onSent: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const lead: Lead = { id: uid(), ownerId, cardId, name, email, company, message, status: "new", createdAt: Date.now() };
    store.saveLead(lead);
    onSent();
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 border-t border-white/5 pt-6">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Name" value={name} onChange={setName} required />
        <Input label="Email" type="email" value={email} onChange={setEmail} required />
      </div>
      <Input label="Company" value={company} onChange={setCompany} />
      <label className="block">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="mt-1.5 w-full bg-muted border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand/50 focus:outline-none"
        />
      </label>
      <button type="submit" className="px-5 py-2.5 bg-brand text-brand-foreground font-bold rounded-lg text-sm hover:brightness-110">
        Send
      </button>
    </form>
  );
}

function Input({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full bg-muted border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:border-brand/50 focus:outline-none"
      />
    </label>
  );
}
