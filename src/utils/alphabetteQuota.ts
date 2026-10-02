import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

export interface QuotaStatus {
  dailyCount: number;
  maxDaily: number;
  isTrial: boolean;
  trialDaysLeft: number;
  isSubscribed: boolean;
  isByokActive: boolean;
  quotaExhausted: boolean;
  todayKey: string;
}

export async function getOrCreateFirebaseUser(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn("Firebase Anonymous Auth warning:", err);
    return null;
  }
}

export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Calcule le quota journalier et l'état d'essai pour l'utilisateur
 */
export async function checkAndUpdateQuota(
  alphabetteAccount: any | null,
  consume: boolean = false
): Promise<QuotaStatus> {
  const today = getTodayString();
  const user = await getOrCreateFirebaseUser();
  const userId = user ? user.uid : (alphabetteAccount?.alphabetteId || "anon_local");

  // Détermination de la date d'inscription (pour le calcul des 7 jours d'essai)
  let createdAt = alphabetteAccount?.createdAt ? new Date(alphabetteAccount.createdAt) : new Date();
  const now = new Date();
  const diffTime = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isTrial = diffDays < 7;
  const trialDaysLeft = Math.max(0, 7 - diffDays);

  const isSubscribed = alphabetteAccount?.status === "active" && alphabetteAccount?.plan && alphabetteAccount.plan !== "trial_7d";
  const hasByokKey = Boolean(alphabetteAccount?.mistralApiKey || localStorage.getItem("ALPHABETTE_BYOK_KEY"));
  const isByokActive = isSubscribed || hasByokKey;

  // Max daily limit: 20 req/day in trial (days 1-7), 5 req/day post-trial if unsubscribed. Unlimited if subscribed or BYOK.
  const maxDaily = isByokActive ? 999999 : (isTrial ? 20 : 5);

  let dailyCount = 0;
  const quotaDocRef = doc(db, "quotas", `${userId}_${today}`);

  try {
    const snap = await getDoc(quotaDocRef);
    if (snap.exists()) {
      dailyCount = snap.data().count || 0;
    } else {
      if (!isByokActive) {
        await setDoc(quotaDocRef, { userId, date: today, count: 0, updatedAt: new Date().toISOString() });
      }
    }
  } catch (err) {
    // Fallback LocalStorage if Firestore is offline
    const localKey = `alpha_quota_${userId}_${today}`;
    dailyCount = parseInt(localStorage.getItem(localKey) || "0", 10);
  }

  const quotaExhausted = !isByokActive && dailyCount >= maxDaily;

  if (consume && !quotaExhausted) {
    dailyCount += 1;
    try {
      const snap = await getDoc(quotaDocRef);
      if (snap.exists()) {
        await updateDoc(quotaDocRef, { count: increment(1), updatedAt: new Date().toISOString() });
      } else {
        await setDoc(quotaDocRef, { userId, date: today, count: 1, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      const localKey = `alpha_quota_${userId}_${today}`;
      localStorage.setItem(localKey, dailyCount.toString());
    }
  }

  return {
    dailyCount,
    maxDaily,
    isTrial,
    trialDaysLeft,
    isSubscribed,
    isByokActive,
    quotaExhausted: !isByokActive && dailyCount > maxDaily,
    todayKey: today
  };
}
