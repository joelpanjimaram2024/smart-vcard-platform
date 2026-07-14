import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { store, uid, seedDemoData } from "@/lib/mock-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Volt" },
      { name: "description", content: "Sign in to manage your digital business cards." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Email and password required.");
    if (mode === "signup" && !name) return setError("Please enter your name.");
    // Mock auth: any credentials work. Wire your MERN /api/auth here.
    const user = {
      id: uid(),
      name: mode === "signup" ? name : email.split("@")[0],
      email,
    };
    store.setUser(user);
    seedDemoData(user.id);
    router.navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-surface grid place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="size-8 bg-brand rounded-sm" />
          <span className="text-xl font-extrabold tracking-tighter text-white">VOLT.</span>
        </div>

        <div className="bg-card border border-white/5 rounded-2xl p-8">
          <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6 text-xs font-mono uppercase tracking-widest">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-md transition ${
                  mode === m ? "bg-brand text-brand-foreground" : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Full name" value={name} onChange={setName} placeholder="Marcus Vance" />
            )}
            <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@company.com" />
            <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-brand text-brand-foreground font-bold rounded-lg hover:brightness-110 transition"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest">
            Demo auth · no password checked
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full bg-muted border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-brand/50 focus:outline-none transition"
      />
    </label>
  );
}
