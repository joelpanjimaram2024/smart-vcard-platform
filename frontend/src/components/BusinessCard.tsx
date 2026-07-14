import type { Card } from "@/lib/mock-store";
import { QRCode } from "./QRCode";

export function BusinessCard({
  card,
  qrValue,
  compact = false,
}: {
  card: Card;
  qrValue?: string;
  compact?: boolean;
}) {
  const accent = card.accent || "#00F5FF";
  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 sm:p-8 shadow-2xl group"
      style={{
        boxShadow: `0 30px 60px -20px ${accent}20, 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
    >
      <div
        className="absolute top-4 right-4 font-mono text-3xl sm:text-4xl uppercase tracking-tighter transition-colors"
        style={{ color: `${accent}33` }}
      >
        {card.company.slice(0, 4)}
      </div>
      <div className="flex h-full flex-col justify-between relative">
        <div className="min-w-0">
          <h4 className={`truncate font-bold text-white tracking-tight ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>
            {card.name}
          </h4>
          <p className="text-sm text-slate-400 truncate">{card.title}</p>
          {!compact && (
            <p className="mt-1 text-xs text-slate-500 truncate">{card.company}</p>
          )}
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 text-[10px] font-mono text-slate-500 leading-relaxed">
            <div className="truncate">{card.email}</div>
            <div className="truncate">{card.phone}</div>
          </div>
          {qrValue && (
            <div className="size-14 sm:size-16 shrink-0 rounded-lg bg-white p-1">
              <QRCode value={qrValue} size={56} dark="#0A0A0A" light="#FFFFFF" className="h-full w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
