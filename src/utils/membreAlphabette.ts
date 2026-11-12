/**
 * Inscription gratuite sur invitation (https://alphabette.fr/inscription/).
 * Elle est écrite dans un cookie de tout le domaine .alphabette.fr (+ copie locale) :
 * IA Débat ne fait que la lire. Un membre inscrit a l'accès offert (pas de quota d'essai).
 */
export interface MembreAlphabette {
  prenom: string;
  role: string;
  depuis: string;
}

export function lireMembre(): MembreAlphabette | null {
  const valide = (m: any): m is MembreAlphabette =>
    Boolean(m && typeof m.prenom === 'string' && m.prenom.trim() && typeof m.role === 'string');
  try {
    const c = document.cookie.match(/(?:^|; )ab_membre=([^;]*)/);
    if (c) {
      const m = JSON.parse(decodeURIComponent(c[1]));
      if (valide(m)) return m;
    }
  } catch {
    /* cookie illisible */
  }
  try {
    const m = JSON.parse(localStorage.getItem('alphabette.membre') || 'null');
    return valide(m) ? m : null;
  } catch {
    return null;
  }
}

export function lienInscription(): string {
  return `https://alphabette.fr/inscription/?retour=${encodeURIComponent(location.href)}`;
}
