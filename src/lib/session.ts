import type { Archive, DebatePhase, Message, Topic, Treaty, Verdict } from "../types.ts";

const SESSION_STORAGE_KEY = "iadebat_seance_en_cours";
/** Au-delà, la séance est considérée comme périmée et n'est plus proposée. */
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

/** Instantané d'une séance en cours, suffisant pour la reprendre telle quelle. */
export interface SessionSnapshot {
  savedAt: number;
  activeTopic: Topic;
  messages: Message[];
  roundCount: number;
  phase: DebatePhase;
  summary: string;
  summaryDegraded: boolean;
  summaryReason: string;
  verdict: Verdict | null;
  verdictDegraded: boolean;
  verdictReason: string;
  treaty: Treaty | null;
  treatyDegraded: boolean;
  treatyReason: string;
}

/**
 * Une séance vaut d'être conservée dès qu'elle contient une intervention.
 * Un rechargement accidentel ne doit pas coûter un tour de table entier.
 */
export function saveSession(snapshot: Omit<SessionSnapshot, "savedAt">) {
  try {
    if (snapshot.messages.length === 0) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...snapshot, savedAt: Date.now() })
    );
  } catch {
    /* quota atteint ou stockage indisponible : la reprise sera simplement absente */
  }
}

export function loadSession(): SessionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (!parsed?.activeTopic || !Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return null;
    }
    if (Date.now() - (parsed.savedAt || 0) > SESSION_MAX_AGE_MS) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    // Une séance interrompue en plein tour reprend à l'arrêt, jamais en marche :
    // les requêtes de l'ancienne page n'existent plus.
    if (parsed.phase === "running" || parsed.phase === "closing") parsed.phase = "paused";
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* rien à faire */
  }
}

// ─── RECHERCHE ET TRI DES ARCHIVES ───────────────────────────────────────────
export type ArchiveSort = "recent" | "ancien" | "volume";

/** Recherche insensible à la casse et aux accents. */
function fold(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Filtre le registre sur le sujet, la catégorie, la synthèse, les orateurs et
 * le contenu des interventions, puis applique l'ordre demandé.
 */
export function filterArchives(archives: Archive[], query: string, sort: ArchiveSort): Archive[] {
  const needle = fold(query.trim());

  const matched = !needle
    ? archives.slice()
    : archives.filter(a => {
        const haystack = [
          a.topic.title,
          a.topic.category,
          a.topic.description,
          a.summary || "",
          a.verdict?.winnerId || "",
          a.verdict?.keyCitation || "",
          ...a.messages.map(m => `${m.agentName} ${m.content}`),
        ].join(" ");
        return fold(haystack).includes(needle);
      });

  return matched.sort((a, b) => {
    if (sort === "volume") return b.messages.length - a.messages.length;
    const da = new Date(a.closedAt).getTime();
    const db = new Date(b.closedAt).getTime();
    return sort === "ancien" ? da - db : db - da;
  });
}
