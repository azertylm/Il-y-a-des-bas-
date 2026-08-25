import { ShieldAlert } from "lucide-react";

// ─── COMPONENT: DEGRADED BADGE ───────────────────────────────────────────────
/** Marque explicitement un contenu qui n'est pas issu d'une génération réelle. */
export function DegradedBadge({ reason, className = "" }: { reason?: string; className?: string }) {
  return (
    <span
      title={reason || undefined}
      className={`inline-flex items-center gap-1 shrink-0 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded px-1.5 py-0.5 text-[9px] font-condensed font-bold uppercase tracking-wider select-none ${className}`}
    >
      <ShieldAlert className="w-2.5 h-2.5" />
      Secours local
    </span>
  );
}
