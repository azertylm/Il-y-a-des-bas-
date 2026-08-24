import { DEFAULT_TOPICS } from "../constants.ts";

// ─── ROTATION TEMPORELLE ─────────────────────────────────────────────────────
export function getCurrentTopicIndex() {
  return Math.floor(new Date().getUTCHours() / 4) % DEFAULT_TOPICS.length;
}

/**
 * Horodatage absolu de la prochaine bascule de cycle (UTC).
 * On raisonne sur un instant fixe et non sur un décompte relatif : un onglet
 * mis en arrière-plan voit ses minuteries ralenties par le navigateur et
 * raterait le créneau si l'on attendait la seconde exactement égale à zéro.
 */
export function getNextCycleBoundary(from: number = Date.now()): number {
  const d = new Date(from);
  const nextSlot = (Math.floor(d.getUTCHours() / 4) + 1) * 4;
  const boundary = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
  // setUTCHours(24) bascule proprement sur minuit du jour suivant.
  boundary.setUTCHours(nextSlot);
  return boundary.getTime();
}

export function getSecondsUntilNextCycle() {
  return Math.max(0, Math.ceil((getNextCycleBoundary() - Date.now()) / 1000));
}

// ─── FORMATAGE ───────────────────────────────────────────────────────────────
export function fmtTimer(sec: number) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
