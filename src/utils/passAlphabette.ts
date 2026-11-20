/**
 * Pass Alphabette et crédits IA Débat (service du site : /api/paiement.php).
 *
 * Même stockage que les pages du Laboratoire (alphabette.eu/pass/, /merci/) — même adresse que l'appli sur .eu :
 *   alphabette_pass             { jeton, offre, app, app_nom, debut, fin }   Pass 12 mois (achat ou cadeau)
 *   alphabette_decouverte       { jeton, debut, fin }   Pass Découverte 48 h (gardé après la fin : pas de remise à zéro)
 *   alphabette_credits_iadebat  { porte_monnaie, solde, maj }   1 crédit = 1 débat Premium lancé
 * Le relais (api/iadebat-proxy.php) vérifie le jeton signé et décompte les crédits : rien ne se décide ici.
 */

const SITE = (() => {
  try {
    const h = window.location.hostname;
    return h === "alphabette.eu" || h === "alphabette.fr" ? window.location.origin : "https://alphabette.eu";
  } catch {
    return "https://alphabette.eu";
  }
})();

/** Pages du Laboratoire (toujours sur alphabette.eu : c'est là que vivent les Pass). */
export const PAGE_PASS = "https://alphabette.eu/pass/";
export const PAGE_CREDITS = "https://alphabette.eu/pass/#credits";

function lire(cle: string): any {
  try {
    const v = JSON.parse(localStorage.getItem(cle) || "null");
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

export interface PassLocal {
  type: "pass" | "decouverte";
  fin: number;
  jeton: string;
  offre?: string;
  app?: string | null;
}

/** Pass utile à IA Débat : Pass 12 mois (Écosystème ou IA Débat), sinon Pass Découverte actif. */
export function passPourIADebat(): PassLocal | null {
  const now = Date.now();
  const p = lire("alphabette_pass");
  if (p?.jeton && p.fin > now && (p.offre === "ecosysteme" || p.app === "iadebat")) return { type: "pass", fin: p.fin, jeton: p.jeton, offre: p.offre, app: p.app };
  const d = lire("alphabette_decouverte");
  if (d?.jeton && d.fin > now) return { type: "decouverte", fin: d.fin, jeton: d.jeton };
  return null;
}

/** Le Pass Découverte a déjà servi sur cet appareil (terminé ou en cours). */
export function decouverteDejaOuverte(): boolean {
  return Boolean(lire("alphabette_decouverte")?.jeton);
}
export function decouverteTerminee(): boolean {
  const d = lire("alphabette_decouverte");
  return Boolean(d?.jeton && d.fin <= Date.now()) && !passPourIADebat();
}

export function porteMonnaie(): string {
  const c = lire("alphabette_credits_iadebat");
  return typeof c?.porte_monnaie === "string" ? c.porte_monnaie : "";
}
export function soldeLocal(): number | null {
  const c = lire("alphabette_credits_iadebat");
  return c?.porte_monnaie && typeof c.solde === "number" ? c.solde : null;
}
export function enregistrerSolde(solde: number): void {
  const c = lire("alphabette_credits_iadebat");
  if (!c?.porte_monnaie) return;
  try {
    localStorage.setItem("alphabette_credits_iadebat", JSON.stringify({ ...c, solde, maj: Date.now() }));
    window.dispatchEvent(new CustomEvent("alphabette-credits", { detail: solde }));
  } catch { /* stockage indisponible */ }
}

/** Jetons à joindre aux appels Premium du relais (en-têtes pour ?etat, corps pour « debut »). */
export function jetonsPremium(): { pass?: string; credits?: string } {
  const p = passPourIADebat();
  const c = porteMonnaie();
  return { ...(p ? { pass: p.jeton } : {}), ...(c ? { credits: c } : {}) };
}

/** Ouvre le Pass Découverte (48 h, sans carte bancaire). Un 2e clic ne remet jamais le compteur à zéro. */
export async function lancerDecouverte(): Promise<{ ok: boolean; message?: string }> {
  if (decouverteDejaOuverte()) return { ok: Boolean(passPourIADebat()), message: "Le Pass Découverte a déjà été ouvert sur cet appareil." };
  try {
    const r = await fetch(`${SITE}/api/paiement.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "decouverte" }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d?.jeton) return { ok: false, message: d?.erreur || "Ouverture impossible pour le moment." };
    localStorage.setItem("alphabette_decouverte", JSON.stringify({ jeton: d.jeton, debut: d.debut, fin: d.fin }));
    return { ok: true };
  } catch {
    return { ok: false, message: "Pas de connexion : réessayez." };
  }
}

/** « 47 h 12 min » */
export function tempsRestant(fin: number): string {
  const ms = Math.max(0, fin - Date.now());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 72) return `${Math.floor(h / 24)} jours`;
  return h >= 1 ? `${h} h ${String(m).padStart(2, "0")} min` : `${Math.max(1, m)} min`;
}
