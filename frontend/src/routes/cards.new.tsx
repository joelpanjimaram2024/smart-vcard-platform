import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BusinessCard } from "@/components/BusinessCard";
import { store, uid, type Card } from "@/lib/mock-store";

export const Route = createFileRoute("/cards/new")({
  head: () => ({ meta: [{ title: "New Card — Volt" }, { name: "robots", content: "noindex" }] }),
  component: NewCard,
});

const ACCENTS = ["#00F5FF", "#7C3AED", "#F59E0B", "#EF4444", "#10B981", "#F0D78C"];

function NewCard() {
  const router = useRouter();
  const [ownerId, setOwnerId] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    title: "",
    company: "",
    email: "",
    phone: "",
    website: "",
    linkedin: "",
    bio: "",
    accent: "#00F5FF",
  });

  useEffect(() => {
    const u = store.getUser();
    if (u) {
      setOwnerId(u.id);
      setForm((f) => ({ ...f, name: u.name, email: u.email }));
    }
  }, []);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    const card: Card = {
      id: uid(),
      ownerId,
      ...form,
      createdAt: Date.now(),
      stats: { views: 0, scans: 0, downloads: 0, saves: 0 },
    };
    store.saveCard(card);
    router.navigate({ to: "/cards/$id", params: { id: card.id } });
  }

  const preview: Card = {
    id: "preview",
    ownerId,
    ...form,
    name: form.name || "Your Name",
    title: form.title || "Your Title",
    company: form.company || "Company",
    email: form.email || "you@company.com",
    phone: form.phone || "+1 000 000 0000",
    createdAt: Date.now(),
    stats: { views: 0, scans: 0, downloads: 0, saves: 0 },
  };

  return (
    <AppShell>
      <div className="mb-8">
        <div className="text-[10px] font-mono uppercase tracking-widest text-brand mb-2">Create</div>
        <h1 className="text-3xl font-extrabold text-white tracking-tighter">New Business Card</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={save} className="bg-card border border-white/5 rounded-2xl p-6 sm:p-8 space-y-4">
          <Row>
            <Field label="Full name" value={form.name} onChange={(v) => update("name", v)} required />
            <Field label="Job title" value={form.title} onChange={(v) => update("title", v)} />
          </Row>
          <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
          <Row>
            <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required />
            <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
          </Row>
          <Row>
            <Field label="Website" value={form.website} onChange={(v) => update("website", v)} placeholder="example.com" />
            <Field label="LinkedIn" value={form.linkedin} onChange={(v) => update("linkedin", v)} placeholder="username" />
          </Row>
          <label className="block">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Bio</span>
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={3}
              className="mt-1.5 w-full bg-muted border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-brand/50 focus:outline-none"
            />
          </label>

          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Accent</span>
            <div className="mt-2 flex gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update("accent", c)}
                  className={`size-8 rounded-full border-2 transition ${
                    form.accent === c ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand text-brand-foreground font-bold rounded-lg hover:brightness-110 transition"
          >
            Create card
          </button>
        </form>

        <div className="lg:sticky lg:top-32 space-y-4 h-fit">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Live preview</p>
          <BusinessCard card={preview} qrValue="preview" />
        </div>
      </div>
    </AppShell>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full bg-muted border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-brand/50 focus:outline-none"
      />
    </label>
  );
}
