/**
 * Accès aux IA sans configuration :
 *  - Mode Découverte : relais du site d'Alphabette (3 débats gratuits par jour), rien à faire ;
 *  - Connexion OpenRouter en 1 clic (OAuth PKCE, 100 % dans le navigateur) : la clé du visiteur
 *    reste dans CE navigateur et ne sert qu'à appeler openrouter.ai.
 */

const CLE = "iadebat_openrouter_key";
const GRATUITS = "iadebat_openrouter_gratuits";
const VERIFICATEUR = "iadebat_openrouter_verifier";

export function lireCleOpenRouter(): string {
  try { return localStorage.getItem(CLE) || ""; } catch { return ""; }
}

export function enregistrerCleOpenRouter(cle: string) {
  try { cle ? localStorage.setItem(CLE, cle) : localStorage.removeItem(CLE); } catch { /* stockage indisponible */ }
}

export function lireGratuitsOpenRouter(): boolean {
  try { return localStorage.getItem(GRATUITS) === "1"; } catch { return false; }
}

export function enregistrerGratuitsOpenRouter(v: boolean) {
  try { localStorage.setItem(GRATUITS, v ? "1" : "0"); } catch { /* stockage indisponible */ }
}

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Adresse de retour : la page de l'appli, sans paramètres. */
function adresseRetour(): string {
  return window.location.origin + window.location.pathname;
}

/** Envoie le visiteur sur OpenRouter pour autoriser une clé (il revient ensuite sur l'appli). */
export async function connecterOpenRouter() {
  const verificateur = b64url(crypto.getRandomValues(new Uint8Array(32)));
  sessionStorage.setItem(VERIFICATEUR, verificateur);
  const defi = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verificateur)));
  const p = new URLSearchParams({
    callback_url: adresseRetour(),
    code_challenge: defi,
    code_challenge_method: "S256",
    key_label: "IA Débat (Alphabette)",
  });
  window.location.href = `https://openrouter.ai/auth?${p.toString()}`;
}

/** Au retour d'OpenRouter (?code=…) : échange le code contre la clé. Renvoie la clé, ou "" si rien à faire. */
export async function terminerConnexionOpenRouter(): Promise<{ cle: string; erreur?: string }> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const verificateur = sessionStorage.getItem(VERIFICATEUR);
  if (!code || !verificateur) return { cle: "" };
  params.delete("code");
  const reste = params.toString();
  history.replaceState(null, "", window.location.pathname + (reste ? `?${reste}` : "") + window.location.hash);
  sessionStorage.removeItem(VERIFICATEUR);
  try {
    const r = await fetch("https://openrouter.ai/api/v1/auth/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, code_verifier: verificateur, code_challenge_method: "S256" }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d?.key) return { cle: "", erreur: d?.error?.message || `OpenRouter a refusé la connexion (${r.status}).` };
    enregistrerCleOpenRouter(d.key);
    return { cle: d.key };
  } catch {
    return { cle: "", erreur: "Impossible de joindre OpenRouter. Réessayez." };
  }
}

export interface EtatDecouverte {
  actif: boolean;
  quota: number;
  debats_restants: number;
}

/** Le Mode Découverte du site est-il ouvert, et combien de débats gratuits reste-t-il aujourd'hui ? */
export async function lireEtatDecouverte(): Promise<EtatDecouverte | null> {
  const h = window.location.hostname;
  const base = h === "alphabette.fr" || h === "alphabette.eu" ? window.location.origin : "https://alphabette.eu";
  try {
    const r = await fetch(`${base}/api/iadebat-proxy.php?etat&t=${Date.now()}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const d = await r.json();
    return typeof d?.actif === "boolean" ? d : null;
  } catch {
    return null;
  }
}
