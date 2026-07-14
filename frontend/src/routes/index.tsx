import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessCard } from "@/components/BusinessCard";
import type { Card } from "@/lib/mock-store";

export const Route = createFileRoute("/")({
  component: Landing,
});

const demoCard: Card = {
  id: "demo",
  ownerId: "demo",
  name: "Marcus Vance",
  title: "Senior VP of Growth",
  company: "Volt Systems",
  email: "marcus@voltsystems.io",
  phone: "+1 234 567 890",
  website: "voltsystems.io",
  accent: "#00F5FF",
  createdAt: 0,
  stats: { views: 1284, scans: 842, downloads: 189, saves: 312 },
};

function Landing() {
  return (
    <div className="min-h-screen bg-surface text-slate-200">
      {/* Nav */}
      <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 sm:px-8 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 bg-brand rounded-sm" />
          <span className="text-xl font-extrabold tracking-tighter text-white">VOLT.</span>
        </Link>
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-brand transition-colors">Features</a>
          <a href="#dashboard" className="hover:text-brand transition-colors">Dashboard</a>
          <a href="#leads" className="hover:text-brand transition-colors">Leads</a>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:inline text-sm font-medium text-slate-400 hover:text-white">Sign in</Link>
          <Link
            to="/auth"
            className="px-4 sm:px-5 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-brand transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 sm:px-8 pt-16 pb-24 lg:pt-20 lg:pb-32 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-mono tracking-widest uppercase">
            <span className="size-1.5 rounded-full bg-brand animate-pulse" />
            QR · vCard · Real-time analytics
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[0.9] tracking-tighter">
            DIGITAL <br />
            IDENTITY <br />
            <span className="text-brand">REWIRED.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-md leading-relaxed">
            The professional standard for high-performance networking. Generate cards, track engagement, and close leads with precision.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/auth"
              className="px-8 py-4 bg-brand text-brand-foreground font-bold rounded-xl hover:scale-105 transition-transform"
            >
              Create My Card
            </Link>
            <a
              href="#dashboard"
              className="px-8 py-4 bg-muted border border-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
            >
              Live Demo
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-20 bg-brand/10 blur-[120px] rounded-full" />
          <div className="relative">
            <BusinessCard card={demoCard} qrValue="https://volt.example/c/demo" />
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section id="features" className="mx-auto max-w-7xl px-6 sm:px-8 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { k: "01", t: "Instant QR", d: "Share your card with a scan. Works on any camera-equipped device." },
            { k: "02", t: "Live analytics", d: "See scans, saves, and downloads update in real time." },
            { k: "03", t: "Lead capture", d: "Every scan can request contact info and land in your CRM." },
            { k: "04", t: "One tap vCard", d: "Recipients save your contact with zero typing." },
          ].map((f) => (
            <div
              key={f.k}
              className="p-6 rounded-2xl bg-card border border-white/5 hover:border-brand/30 transition-colors"
            >
              <div className="text-[10px] font-mono text-brand tracking-widest mb-4">{f.k}</div>
              <div className="text-base font-bold text-white mb-2">{f.t}</div>
              <p className="text-sm text-slate-400 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview (visual) */}
      <section id="dashboard" className="mx-auto max-w-7xl px-6 sm:px-8 pb-24">
        <div className="bg-card border border-white/5 rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl">
          <div className="border-b border-white/5 px-6 sm:px-8 py-5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-6 min-w-0">
              <h2 className="text-lg font-bold text-white shrink-0">Pulse Dashboard</h2>
              <nav className="hidden sm:flex gap-4 text-xs font-mono uppercase tracking-tighter text-slate-500">
                <span className="text-brand border-b border-brand pb-1">Overview</span>
                <span>Analytics</span>
                <span>Contacts</span>
              </nav>
            </div>
            <div className="size-8 rounded-full bg-muted border border-white/10" />
          </div>

          <div className="grid lg:grid-cols-12 gap-px bg-white/5">
            <div className="lg:col-span-3 bg-card p-6 sm:p-8 space-y-8">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">Total Scans</p>
                <p className="text-4xl font-extrabold text-white tracking-tighter">1,284</p>
                <div className="mt-2 text-xs text-brand">+12.4% from last week</div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Top Sources</p>
                {[
                  { label: "LinkedIn QR", val: 42, tone: "bg-brand" },
                  { label: "Email Signature", val: 28, tone: "bg-slate-400" },
                  { label: "Direct scan", val: 18, tone: "bg-slate-600" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm">{s.label}</span>
                      <span className="text-sm font-mono">{s.val}%</span>
                    </div>
                    <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                      <div className={`${s.tone} h-full`} style={{ width: `${s.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-card p-6 sm:p-8 border-x border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest">Active Card</h3>
                <span className="text-[10px] font-mono text-brand border border-brand/20 px-2 py-1 rounded">LIVE</span>
              </div>
              <BusinessCard card={demoCard} qrValue="https://volt.example/c/demo" />
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { l: "Conversions", v: "84" },
                  { l: "Save Rate", v: "68%" },
                  { l: "Direct Tap", v: "312" },
                ].map((k) => (
                  <div key={k.l} className="p-4 rounded-xl bg-muted/50 border border-white/5 text-center">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">{k.l}</p>
                    <p className="text-xl font-bold text-white mt-1">{k.v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="leads" className="lg:col-span-3 bg-card p-6 sm:p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6">New Leads</h3>
              <div className="space-y-6">
                {[
                  { i: "AS", n: "Adrian Sterling", m: "2 mins ago · TechCrunch Disruption", hot: true },
                  { i: "LB", n: "Lara Bennett", m: "1 hour ago · Direct Scan" },
                  { i: "JP", n: "Julian Pierce", m: "3 hours ago · Web Referral" },
                ].map((l) => (
                  <div key={l.n} className="flex gap-4">
                    <div className={`size-8 rounded-full grid place-items-center text-xs font-bold shrink-0 ${l.hot ? "bg-brand/20 text-brand" : "bg-slate-800 text-slate-400"}`}>
                      {l.i}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{l.n}</p>
                      <p className="text-[10px] text-slate-500 truncate">{l.m}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/auth"
                className="w-full mt-8 py-3 bg-muted border border-white/5 text-[10px] font-mono uppercase tracking-widest hover:bg-white/5 flex items-center justify-center rounded-md"
              >
                Try the dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 sm:px-8 py-16 border-t border-white/5 text-center overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <h3 className="text-5xl sm:text-7xl md:text-8xl font-extrabold text-white/5 tracking-tighter select-none">
            NETWORK BEYOND
          </h3>
          <p className="mt-6 text-xs font-mono uppercase tracking-widest text-slate-600">
            © {new Date().getFullYear()} Volt Systems
          </p>
        </div>
      </footer>
    </div>
  );
}
