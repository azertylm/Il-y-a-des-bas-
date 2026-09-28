import { AlphabetteAccount, AlphabettePlanType } from "../types";

export const ALPHABETTE_STORAGE_KEY = "ALPHABETTE_UNIFIED_ACCOUNT_V1";
export const ALPHABETTE_SYNC_CHANNEL = "alphabette_ecosystem_sync";
export const ALPHABETTE_HUB_URL = "http://alphabette.fr";
export const ALPHABETTE_FOOTER_TEXT = "Découvrir toutes les applications de la suite sur http://alphabette.fr";

export interface AlphabettePlanInfo {
  id: AlphabettePlanType;
  category: "individual" | "bouquet";
  mode: "byok" | "confort";
  title: string;
  badge: string;
  priceAnnualEur: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export const ALPHABETTE_PLANS: AlphabettePlanInfo[] = [
  {
    id: "individual_byok",
    category: "individual",
    mode: "byok",
    title: "Application Individuelle — BYOK",
    badge: "Clé Client",
    priceAnnualEur: 39,
    description: "Accès illimité aux fonctionnalités de l'application, l'utilisateur gère sa propre clé API Mistral.",
    features: [
      "Accès complet à IADébat pendant 1 an",
      "Vous utilisez votre propre clé API Mistral AI",
      "Zéro surcoût d'intermédiation IA",
      "Exports autonomes & archives illimitées"
    ]
  },
  {
    id: "individual_confort",
    category: "individual",
    mode: "confort",
    title: "Application Individuelle — Confort",
    badge: "Clé Alphabette Incluse",
    priceAnnualEur: 59,
    description: "Accès complet clé en main, consommation d'IA managée par nos soins (après les 7 jours d'essai).",
    features: [
      "Accès complet clé en main à IADébat",
      "Clés API Mistral AI gérées et incluses par Alphabette",
      "Aucune inscription requise chez Mistral",
      "Maintenance & résilience garanties"
    ]
  },
  {
    id: "bouquet_byok",
    category: "bouquet",
    mode: "byok",
    title: "Pass Bouquet BYOK",
    badge: "Toute la Suite (Clé Client)",
    priceAnnualEur: 99,
    description: "Accès illimité à l'intégralité de la suite logicielle Alphabette avec sa propre clé API Mistral.",
    features: [
      "Accès illimité à IADébat, Infos Perso, L'Œil de l'Atelier",
      "Toutes les futures applications du Bouquet incluses",
      "Vous renseignez une seule fois votre clé Mistral AI",
      "Interopérabilité totale des données"
    ]
  },
  {
    id: "bouquet_integral",
    category: "bouquet",
    mode: "confort",
    title: "Pass Bouquet Intégral",
    badge: "Toute la Suite (Clés Incluses)",
    priceAnnualEur: 199,
    description: "Accès illimité à l'intégralité de la suite logicielle Alphabette avec les clés d'API Mistral gérées et incluses.",
    recommended: true,
    features: [
      "Accès illimité à l'intégralité de la suite Alphabette",
      "Clés Mistral AI 100% gérées et fournies par Alphabette",
      "Aucune gestion de tokens ou de cartes chez Mistral",
      "Mises à jour majeures & support prioritaire"
    ]
  }
];

export const ALPHABETTE_APPS = [
  {
    id: "iadebat",
    name: "IADébat",
    desc: "Arène souveraine de confrontation dialectique et d'arbitrage éthique propulsée par Mistral AI.",
    badge: "Débat & Vérité",
    icon: "MessageSquare",
    active: true,
  },
  {
    id: "infosperso",
    name: "Infos Perso",
    desc: "Coffre-fort souverain et bouclier de protection et gestion des données personnelles et d'identité.",
    badge: "Protection & RGPD",
    icon: "Shield",
    active: true,
  },
  {
    id: "loeildelatelier",
    name: "L'Œil de l'Atelier",
    desc: "Outil souverain de pilotage, supervision d'atelier, monitoring visuel et optimisation artisanale/industrielle.",
    badge: "Pilotage & Atelier",
    icon: "Eye",
    active: true,
  },
  {
    id: "futures_apps",
    name: "Futures Applications du Bouquet",
    desc: "Toute nouvelle solution logicielle souveraine éditée par ALPHABETTE SASU incluse d'office dans le Bouquet.",
    badge: "Écosystème Évolutif",
    icon: "Sparkles",
    active: true,
  }
];

/**
 * PROMPT GLOBAL OFFICIEL ALPHABETTE
 * Ce prompt maître est conçu pour être injecté dans TOUTES les applications
 * de l'écosystème Alphabette (IADébat, Infos Perso, L'Œil de l'Atelier, etc.)
 */
export const ALPHABETTE_GLOBAL_MASTER_PROMPT = `# INSTRUCTIONS SYSTÈME — ÉCOSYSTÈME LOGICIEL ALPHABETTE

## 1. Contexte & Identité
Tu agis en tant qu'assistant de conception, d'ingénierie et de développement pour les applications de l'écosystème **Alphabette**. 
Chaque application de la suite fonctionne comme une brique autonome mais interconnectée, conçue pour valoriser l'ensemble du catalogue et diriger les utilisateurs vers le hub central : **http://alphabette.fr**.

## 2. Souveraineté & Engagement RGPD (Mistral AI Exclusif)
Toutes les applications de la suite Alphabette reposent rigoureusement et exclusivement sur la technologie **Mistral AI** :
* **Conformité RGPD native :** Mistral AI étant une entreprise française hébergeant ses infrastructures en Europe, les données traitées ne quittent pas le cadre juridique de l'Union européenne.
* **Confidentialité absolue :** Les modèles commerciaux de Mistral garantissent que les requêtes et données de nos utilisateurs ne sont jamais réutilisées pour l'entraînement public des modèles.
* **Argument commercial :** Mets en avant cette souveraineté européenne et la protection des données professionnelles dans toutes les communications et interfaces de configuration.
* **Environnements :** Développement local sous Mac (Ollama / Metal) et production via l'API Cloud officielle de Mistral (\`https://api.mistral.ai/v1\`). Ne suggérer aucun autre fournisseur d'IA.

## 3. Architecture Technique & Clés API
Toute application doit implémenter une logique d'accès IA à trois niveaux :
1. **Période d'essai (7 jours offerts) :** Tout nouvel inscrit bénéficie d'un accès complet et immédiat à l'application, alimenté par la clé API Mistral propriétaire fournie par Alphabette.
2. **Mode BYOK (Bring Your Own Key) :** Une interface dédiée permet à l'utilisateur de renseigner sa propre clé API Mistral pour consommer son quota personnel.
3. **Mode managé (Clé Alphabette) :** L'utilisateur souscrit à l'offre incluant nos clés pour ne pas avoir à créer de compte développeur chez Mistral.
* **Standardisation du code :** Les appels API doivent systématiquement s'appuyer sur des variables d'environnement (\`AI_BASE_URL\`, \`AI_API_KEY\`, \`MISTRAL_MODEL\`) pour basculer facilement entre la clé utilisateur, la clé Alphabette ou l'environnement de test local.

## 4. Grille Tarifaire Officielle (Abonnements Annuels)
Toute interface de facturation, modale d'expiration ou page tarifaire doit présenter exactement cette grille :

### Application Individuelle
* **Formule BYOK (Clé client) :** 39 € / an
  * Accès illimité aux fonctionnalités de l'application, l'utilisateur gère sa propre clé API Mistral.
* **Formule Confort (Clé Alphabette incluse) :** 59 € / an
  * Accès complet clé en main, consommation d'IA managée par nos soins (après les 7 jours d'essai).

### Le Bouquet Alphabette (Accès à TOUTES les applications)
* **Pass Bouquet BYOK :** 99 € / an
  * Accès illimité à l'intégralité de la suite logicielle Alphabette avec sa propre clé API.
* **Pass Bouquet Intégral :** 199 € / an
  * Accès illimité à l'intégralité de la suite logicielle Alphabette avec les clés d'API Mistral gérées et incluses.

## 5. Maillage Inter-Applications & Rôle du Hub (http://alphabette.fr)
Chaque application a un rôle de vitrine et d'acquisition pour l'écosystème global :
* **Pied de page obligatoire :** En bas de chaque page ou interface de chaque application, intègre systématiquement un lien clair et visible vers le hub central :
  \`Découvrir toutes les applications de la suite sur http://alphabette.fr\`
* **Stratégie de cross-selling :** Lorsqu'un utilisateur atteint la fin de ses 7 jours d'essai ou consulte l'écran d'abonnement pour une application (39 € ou 59 €), l'interface doit immédiatement valoriser l'opportunité économique du **Bouquet Alphabette** (99 € / 199 € par an pour débloquer l'ensemble des outils).
* **Synergie des données :** Veille à ce que les modules et structures de données puissent dialoguer ou échanger des formats standardisés pour renforcer l'intérêt du Bouquet complet auprès des clients.`;

/**
 * Calcule le nombre de jours d'essai restants (sur 7 jours)
 */
export function getTrialDaysRemaining(account: AlphabetteAccount | null): number {
  if (!account || !account.trialEndsAt) return 0;
  const now = new Date().getTime();
  const ends = new Date(account.trialEndsAt).getTime();
  const diffMs = ends - now;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Vérifie si l'accès IA est valide (soit période d'essai 7j en cours, soit abonnement actif)
 */
export function isAccountAccessActive(account: AlphabetteAccount | null): boolean {
  if (!account) return true; // mode invité / 7j auto
  if (account.status === "active") return true;
  if (account.isTrialActive && getTrialDaysRemaining(account) > 0) return true;
  return false;
}

/**
 * Signature souveraine locale
 */
export function generateSovereignSignature(id: string, email: string, plan: string, expiresAt: string): string {
  const payload = `${id}|${email}|${plan}|${expiresAt}|ALPHABETTE_MISTRAL_SOUVERAIN_FRANCE`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `SIG-ALP-${hex}-${Date.now().toString(36).slice(-4)}`;
}

export function generateAlphabetteId(): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const time = Date.now().toString(36).slice(-4).toUpperCase();
  return `ALP-${rand}-${time}`;
}

export function exportAccountToKey(account: AlphabetteAccount): string {
  try {
    const json = JSON.stringify(account);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return `ALP-PASS-${b64}`;
  } catch {
    return `ALP-PASS-RAW-${account.alphabetteId}-${account.email}`;
  }
}

export function importAccountFromKey(input: string): AlphabetteAccount | null {
  try {
    let clean = input.trim();
    if (clean.startsWith("ALP-PASS-")) {
      clean = clean.replace("ALP-PASS-", "");
    }
    const decoded = decodeURIComponent(escape(atob(clean)));
    const parsed = JSON.parse(decoded) as AlphabetteAccount;
    if (parsed && parsed.alphabetteId && parsed.email) {
      return parsed;
    }
  } catch {
    try {
      const parsed = JSON.parse(input.trim()) as AlphabetteAccount;
      if (parsed && parsed.alphabetteId && parsed.email) {
        return parsed;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Crée un compte Alphabette officiel avec période d'essai 7 jours offerte
 */
export function createAlphabetteAccount(
  name: string,
  email: string,
  plan: AlphabettePlanType = "trial_7d",
  originApp: string = "IADébat",
  organization?: string,
  mistralApiKey?: string
): AlphabetteAccount {
  const alphabetteId = generateAlphabetteId();
  const now = new Date();
  
  // Période d'essai 7 jours
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 7);

  // Échéance abonnement annuel (1 an)
  const expires = new Date();
  expires.setDate(expires.getDate() + 365);

  let planTitle = "Période d'Essai (7 jours offerts)";
  let priceAnnualEur = 0;
  let status: "active" | "trial" | "expired" = "trial";
  let isTrialActive = true;

  if (plan === "individual_byok") {
    planTitle = "Application Individuelle — BYOK (39 € / an)";
    priceAnnualEur = 39;
    status = "active";
    isTrialActive = false;
  } else if (plan === "individual_confort") {
    planTitle = "Application Individuelle — Confort (59 € / an)";
    priceAnnualEur = 59;
    status = "active";
    isTrialActive = false;
  } else if (plan === "bouquet_byok") {
    planTitle = "Pass Bouquet BYOK (99 € / an)";
    priceAnnualEur = 99;
    status = "active";
    isTrialActive = false;
  } else if (plan === "bouquet_integral") {
    planTitle = "Pass Bouquet Intégral (199 € / an)";
    priceAnnualEur = 199;
    status = "active";
    isTrialActive = false;
  } else if (plan === "pass_alphabette") {
    planTitle = "Pass Bouquet BYOK (99 € / an)";
    priceAnnualEur = 99;
    status = "active";
    isTrialActive = false;
  }

  const isBouquet = plan === "bouquet_byok" || plan === "bouquet_integral" || plan === "pass_alphabette";
  const accessibleApps = isBouquet || plan === "trial_7d"
    ? ["*"]
    : [originApp.toLowerCase().replace(/[^a-z0-9]/g, "")];

  const sovereignSignature = generateSovereignSignature(alphabetteId, email, plan, expires.toISOString());

  const account: AlphabetteAccount = {
    alphabetteId,
    email: email.trim(),
    name: name.trim(),
    organization: organization?.trim() || undefined,
    plan,
    planTitle,
    priceAnnualEur,
    status,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    trialStartedAt: now.toISOString(),
    trialEndsAt: trialEnds.toISOString(),
    isTrialActive,
    accessibleApps,
    sovereignSignature,
    lastOriginApp: originApp,
    exportCode: "",
    mistralApiKey: mistralApiKey?.trim() || undefined,
    mistralBaseUrl: "https://api.mistral.ai/v1",
    mistralModel: "mistral-large-latest",
  };

  account.exportCode = exportAccountToKey(account);
  return account;
}

export function saveAlphabetteAccount(account: AlphabetteAccount): void {
  try {
    localStorage.setItem(ALPHABETTE_STORAGE_KEY, JSON.stringify(account));
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(ALPHABETTE_SYNC_CHANNEL);
      channel.postMessage({ type: "ACCOUNT_UPDATED", account });
      channel.close();
    }
  } catch (err) {
    console.warn("Impossible de persister le compte ALPHABETTE localement:", err);
  }
}

export function loadAlphabetteAccount(): AlphabetteAccount | null {
  try {
    const raw = localStorage.getItem(ALPHABETTE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AlphabetteAccount;
    if (parsed && parsed.alphabetteId && parsed.email) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function clearAlphabetteAccount(): void {
  try {
    localStorage.removeItem(ALPHABETTE_STORAGE_KEY);
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(ALPHABETTE_SYNC_CHANNEL);
      channel.postMessage({ type: "ACCOUNT_CLEARED" });
      channel.close();
    }
  } catch (err) {
    console.warn("Erreur déconnexion compte:", err);
  }
}

export function downloadSovereignPassFile(account: AlphabetteAccount): void {
  const content = JSON.stringify(account, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `alphabette-pass-${account.alphabetteId.toLowerCase()}.alphabette-pass`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
