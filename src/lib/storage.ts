import { API_KEYS_STORAGE_KEY, CLIENT_ID_STORAGE_KEY, EMPTY_API_KEYS } from "../constants.ts";


/**
 * Les clés API vivent en `sessionStorage` : elles disparaissent à la fermeture
 * de l'onglet au lieu de rester indéfiniment sur le disque. Les clés déjà
 * présentes dans `localStorage` sont reprises une dernière fois puis effacées.
 */
export function loadApiKeys(): { [key: string]: string } {
  try {
    const fromSession = sessionStorage.getItem(API_KEYS_STORAGE_KEY);
    if (fromSession) return { ...EMPTY_API_KEYS, ...JSON.parse(fromSession) };

    const legacy = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (legacy) {
      localStorage.removeItem(API_KEYS_STORAGE_KEY);
      sessionStorage.setItem(API_KEYS_STORAGE_KEY, legacy);
      return { ...EMPTY_API_KEYS, ...JSON.parse(legacy) };
    }
  } catch {
    /* stockage indisponible : on repart à vide */
  }
  return { ...EMPTY_API_KEYS };
}

export function persistApiKeys(keys: { [key: string]: string }) {
  try {
    sessionStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* stockage indisponible : les clés restent valables pour la session en cours */
  }
}

/**
 * Identifiant de navigateur stable, envoyé en `x-client-id`. Il cloisonne les
 * archives côté serveur : chaque visiteur ne voit que ses propres séances.
 * Contrairement aux clés API, il doit survivre à la fermeture de l'onglet.
 */
export function resolveClientId(): string {
  const mint = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  try {
    const existing = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing) return existing;
    const generated = mint();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return mint();
  }
}
