import type { Archive, Message, Topic, Treaty, Verdict } from "../types.ts";

/** Éléments composant un procès-verbal, séance en cours ou archive relue. */
export interface TranscriptSource {
  topic: Topic;
  messages: Message[];
  summary: string;
  summaryDegraded?: boolean;
  verdict?: Verdict | null;
  verdictDegraded?: boolean;
  treaty?: Treaty | null;
  treatyDegraded?: boolean;
  closedAt?: string;
  roundCount?: number;
}

const SECOURS = " _(moteur de secours local — pas une génération réelle)_";

function frenchDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Compose le procès-verbal complet en Markdown. Les passages issus du moteur
 * de secours y restent signalés : un document exporté ne doit pas laisser
 * croire à une génération réelle une fois sorti de l'interface.
 */
export function buildTranscriptMarkdown(source: TranscriptSource): string {
  const {
    topic, messages, summary, summaryDegraded,
    verdict, verdictDegraded, treaty, treatyDegraded,
    closedAt, roundCount,
  } = source;

  const out: string[] = [];

  out.push(`# ${topic.title}`, "");
  out.push(`**${topic.category}**`, "");
  out.push(topic.description, "");

  const meta = [
    `${messages.length} intervention${messages.length > 1 ? "s" : ""}`,
    roundCount ? `${roundCount} tour${roundCount > 1 ? "s" : ""} de table` : "",
    closedAt ? `séance close le ${frenchDate(closedAt)}` : `exporté le ${frenchDate(new Date().toISOString())}`,
  ].filter(Boolean);
  out.push(`> ${meta.join(" · ")}`, "");

  const speakers = [...new Set(messages.map(m => m.agentName))];
  if (speakers.length) out.push(`> Orateurs : ${speakers.join(", ")}`, "");

  out.push("---", "", "## Retranscription des débats", "");
  messages.forEach((m, i) => {
    out.push(`### ${i + 1}. ${m.agentName} — *${m.agentRole}*${m.degraded ? SECOURS : ""}`, "");
    if (m.claps) out.push(`*${m.claps} soutien${m.claps > 1 ? "s" : ""} du public*`, "");
    out.push(m.content.trim(), "");
  });

  if (summary) {
    out.push("---", "", `## Synthèse de séance${summaryDegraded ? SECOURS : ""}`, "", summary.trim(), "");
  }

  if (treaty) {
    out.push("---", "", `## Traité de consensus${treatyDegraded ? SECOURS : ""}`, "");
    if (treaty.preamble) out.push(`*${treaty.preamble.trim()}*`, "");
    treaty.articles.forEach((a, i) => {
      out.push(`**Article ${i + 1} — ${a.title}**`, "", a.content.trim(), "");
    });
    if (treaty.reservation) out.push(`> **Réserve.** ${treaty.reservation.trim()}`, "");
  }

  if (verdict) {
    out.push("---", "", `## Verdict du jury${verdictDegraded ? SECOURS : ""}`, "");
    out.push(`**Vainqueur : ${verdict.winnerId.toUpperCase()}**`, "", verdict.winnerReason.trim(), "");
    out.push("| Orateur | Note | Distinction |", "| --- | --- | --- |");
    Object.entries(verdict.agentScores).forEach(([id, score]) => {
      out.push(`| ${id} | ${score} / 10 | ${verdict.agentBadges?.[id] || "—"} |`);
    });
    out.push("");
    if (verdict.critiqueGénérale) out.push(verdict.critiqueGénérale.trim(), "");
    if (verdict.keyCitation) out.push(`> « ${verdict.keyCitation.trim()} »`, "");
  }

  out.push("---", "", "*Procès-verbal produit par IADÉBAT.*", "");
  return out.join("\n");
}

/** Nom de fichier lisible et sûr, dérivé du sujet débattu. */
export function transcriptFilename(topic: Topic, closedAt?: string): string {
  const slug = topic.title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    // Le nettoyage des tirets vient après la coupe : sinon une troncature au
    // milieu d'un séparateur laisse un nom de fichier en « …-mot-.md ».
    .replace(/^-+|-+$/g, "") || "debat";
  const day = (closedAt ? new Date(closedAt) : new Date()).toISOString().slice(0, 10);
  return `iadebat-${day}-${slug}.md`;
}

/** Déclenche le téléchargement du procès-verbal côté navigateur. */
export function downloadTranscript(source: TranscriptSource) {
  const blob = new Blob([buildTranscriptMarkdown(source)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = transcriptFilename(source.topic, source.closedAt);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Laisser au navigateur le temps d'amorcer le téléchargement avant révocation.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Adapte une archive relue au format attendu par l'export. */
export function archiveToTranscript(archive: Archive): TranscriptSource {
  return {
    topic: archive.topic,
    messages: archive.messages,
    summary: archive.summary,
    summaryDegraded: archive.summaryDegraded,
    verdict: archive.verdict,
    verdictDegraded: archive.verdictDegraded,
    treaty: archive.treaty,
    treatyDegraded: archive.treatyDegraded,
    closedAt: archive.closedAt,
    roundCount: archive.roundCount,
  };
}
