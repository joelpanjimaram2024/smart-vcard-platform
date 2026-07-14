// Mock data store using localStorage. Swap for a real API by editing src/lib/api.ts.
export type Card = {
  id: string;
  ownerId: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  bio?: string;
  accent?: string;
  createdAt: number;
  stats: { views: number; scans: number; downloads: number; saves: number };
};

export type Contact = {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  createdAt: number;
};

export type Lead = {
  id: string;
  ownerId: string;
  cardId: string;
  name: string;
  email: string;
  message?: string;
  company?: string;
  status: "new" | "contacted" | "qualified" | "closed";
  createdAt: number;
};

export type User = { id: string; name: string; email: string };

const KEYS = {
  user: "dbc.user",
  cards: "dbc.cards",
  contacts: "dbc.contacts",
  leads: "dbc.leads",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const store = {
  // auth
  getUser(): User | null {
    return read<User | null>(KEYS.user, null);
  },
  setUser(u: User | null) {
    if (u) write(KEYS.user, u);
    else localStorage.removeItem(KEYS.user);
  },

  // cards
  listCards(ownerId?: string): Card[] {
    const all = read<Card[]>(KEYS.cards, []);
    return ownerId ? all.filter((c) => c.ownerId === ownerId) : all;
  },
  getCard(id: string): Card | undefined {
    return read<Card[]>(KEYS.cards, []).find((c) => c.id === id);
  },
  saveCard(card: Card) {
    const all = read<Card[]>(KEYS.cards, []);
    const idx = all.findIndex((c) => c.id === card.id);
    if (idx >= 0) all[idx] = card;
    else all.push(card);
    write(KEYS.cards, all);
  },
  deleteCard(id: string) {
    write(
      KEYS.cards,
      read<Card[]>(KEYS.cards, []).filter((c) => c.id !== id),
    );
  },
  incrementStat(id: string, key: keyof Card["stats"]) {
    const all = read<Card[]>(KEYS.cards, []);
    const c = all.find((x) => x.id === id);
    if (!c) return;
    c.stats[key] = (c.stats[key] || 0) + 1;
    write(KEYS.cards, all);
  },

  // contacts
  listContacts(ownerId: string): Contact[] {
    return read<Contact[]>(KEYS.contacts, []).filter((c) => c.ownerId === ownerId);
  },
  saveContact(c: Contact) {
    write(KEYS.contacts, [...read<Contact[]>(KEYS.contacts, []), c]);
  },
  deleteContact(id: string) {
    write(
      KEYS.contacts,
      read<Contact[]>(KEYS.contacts, []).filter((c) => c.id !== id),
    );
  },

  // leads
  listLeads(ownerId: string): Lead[] {
    return read<Lead[]>(KEYS.leads, []).filter((l) => l.ownerId === ownerId);
  },
  saveLead(l: Lead) {
    write(KEYS.leads, [...read<Lead[]>(KEYS.leads, []), l]);
  },
  updateLead(id: string, patch: Partial<Lead>) {
    const all = read<Lead[]>(KEYS.leads, []);
    const idx = all.findIndex((l) => l.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...patch };
      write(KEYS.leads, all);
    }
  },
};

export function seedDemoData(userId: string) {
  if (store.listCards(userId).length > 0) return;
  const card: Card = {
    id: uid(),
    ownerId: userId,
    name: "Marcus Vance",
    title: "Senior VP of Growth",
    company: "Volt Systems",
    email: "marcus@voltsystems.io",
    phone: "+1 234 567 890",
    website: "voltsystems.io",
    linkedin: "marcus-vance",
    bio: "Building the next generation of growth infrastructure.",
    accent: "#00F5FF",
    createdAt: Date.now(),
    stats: { views: 1284, scans: 842, downloads: 189, saves: 312 },
  };
  store.saveCard(card);
  const contacts: Omit<Contact, "id" | "ownerId">[] = [
    { name: "Adrian Sterling", email: "adrian@techcrunch.com", company: "TechCrunch", source: "TechCrunch Disruption", createdAt: Date.now() - 1000 * 60 * 2 },
    { name: "Lara Bennett", email: "lara@bennett.co", company: "Bennett & Co", source: "Direct Scan", createdAt: Date.now() - 1000 * 60 * 60 },
    { name: "Julian Pierce", email: "j.pierce@arclight.io", company: "Arclight", source: "Web Referral", createdAt: Date.now() - 1000 * 60 * 60 * 3 },
  ];
  contacts.forEach((c) => store.saveContact({ ...c, id: uid(), ownerId: userId }));
  const leads: Omit<Lead, "id" | "ownerId">[] = [
    { cardId: card.id, name: "Adrian Sterling", email: "adrian@techcrunch.com", company: "TechCrunch", message: "Interested in your platform for our next launch.", status: "new", createdAt: Date.now() - 1000 * 60 * 2 },
    { cardId: card.id, name: "Sarah Liao", email: "sarah@vercel.com", company: "Vercel", message: "Let's connect about partnership.", status: "contacted", createdAt: Date.now() - 1000 * 60 * 60 * 24 },
  ];
  leads.forEach((l) => store.saveLead({ ...l, id: uid(), ownerId: userId }));
}
