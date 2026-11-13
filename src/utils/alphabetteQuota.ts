import { lireMembre } from "./membreAlphabette";

/**
 * Compteur d'utilisation, gardé SUR CET APPAREIL uniquement.
 *
 * Données personnelles : plus de connexion Firebase anonyme ni de compteur
 * envoyé à Google à chaque visite (rien n'était dit au visiteur et Alphabette
 * ne fournit aucune clé IA à économiser). Avec sa propre clé IA, le visiteur
 * paie lui-même son fournisseur : aucune limite n'est imposée.
 */
export interface QuotaStatus {
  dailyCount: number;
  maxDaily: number;
  isTrial: boolean;
  trialDaysLeft: number;
  isSubscribed: boolean;
  isByokActive: boolean;
  /** Inscrit avec un code d'invitation alphabette : accès offert. */
  isMembre: boolean;
  quotaExhausted: boolean;
  todayKey: string;
}

export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Calcule le quota journalier et l'état d'essai pour l'utilisateur.
 * @param aDesClesIA le visiteur a enregistré au moins une clé IA personnelle.
 */
export async function checkAndUpdateQuota(
  alphabetteAccount: any | null,
  consume: boolean = false,
  aDesClesIA: boolean = false
): Promise<QuotaStatus> {
  const today = getTodayString();
  // Membre inscrit avec un code d'invitation : accès offert, pas de quota à compter.
  if (lireMembre()) {
    return { dailyCount: 0, maxDaily: 999999, isTrial: false, trialDaysLeft: 0, isSubscribed: true, isByokActive: true, isMembre: true, quotaExhausted: false, todayKey: today };
  }

  // Date d'inscription (pour le calcul des 7 jours d'essai)
  const createdAt = alphabetteAccount?.createdAt ? new Date(alphabetteAccount.createdAt) : new Date();
  const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const isTrial = diffDays < 7;
  const trialDaysLeft = Math.max(0, 7 - diffDays);

  // Aucun paiement n'existe encore : un compte local ne vaut jamais abonnement.
  const isSubscribed = false;
  let hasByokKey = aDesClesIA || Boolean(alphabetteAccount?.mistralApiKey);
  try {
    hasByokKey = hasByokKey || Boolean(localStorage.getItem("ALPHABETTE_BYOK_KEY"));
  } catch {
    /* stockage indisponible */
  }
  const isByokActive = hasByokKey;

  // 20 demandes / jour pendant l'essai, 5 ensuite. Illimité avec sa propre clé.
  const maxDaily = isByokActive ? 999999 : isTrial ? 20 : 5;

  const localKey = `alpha_quota_local_${today}`;
  let dailyCount = 0;
  try {
    dailyCount = parseInt(localStorage.getItem(localKey) || "0", 10) || 0;
  } catch {
    dailyCount = 0;
  }

  const quotaExhausted = !isByokActive && dailyCount >= maxDaily;

  if (consume && !quotaExhausted && !isByokActive) {
    dailyCount += 1;
    try {
      localStorage.setItem(localKey, dailyCount.toString());
    } catch {
      /* stockage indisponible */
    }
  }

  return {
    dailyCount,
    maxDaily,
    isTrial,
    trialDaysLeft,
    isSubscribed,
    isByokActive,
    isMembre: false,
    quotaExhausted,
    todayKey: today,
  };
}
