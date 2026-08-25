import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTranscriptMarkdown, transcriptFilename } from "../../src/lib/export.ts";
import type { Message, Topic } from "../../src/types.ts";

const topic: Topic = {
  id: 1,
  category: "DÉMOCRATIE & POUVOIR",
  title: "Faut-il laisser l'IA gouverner nos décisions collectives ?",
  description: "Une description.",
};

const msg = (over: Partial<Message> = {}): Message => ({
  id: "m1", agentId: "claude", agentName: "Claude", agentRole: "Le Sage",
  agentColor: "#fff", agentDim: "#000", agentBorder: "#000", agentSymbol: "*",
  content: "Une thèse.", time: "10:00", ...over,
});

test("le procès-verbal contient toutes les sections fournies", () => {
  const md = buildTranscriptMarkdown({
    topic,
    messages: [msg()],
    summary: "La synthèse.",
    verdict: {
      winnerId: "claude", winnerReason: "Parce que.",
      agentScores: { claude: 9 }, agentBadges: { claude: "Le Phare" },
      "critiqueGénérale": "Belle joute.", keyCitation: "Une citation.",
    },
    treaty: { preamble: "Préambule.", articles: [{ title: "De la preuve", content: "Engagement." }], reservation: "Litige." },
  });

  assert.match(md, /^# Faut-il laisser l'IA gouverner/m);
  assert.match(md, /## Retranscription des débats/);
  assert.match(md, /## Synthèse de séance/);
  assert.match(md, /## Traité de consensus/);
  assert.match(md, /\*\*Article 1 — De la preuve\*\*/);
  assert.match(md, /## Verdict du jury/);
  assert.match(md, /\| claude \| 9 \/ 10 \| Le Phare \|/);
});

test("une section absente ne laisse pas de titre vide", () => {
  const md = buildTranscriptMarkdown({ topic, messages: [msg()], summary: "" });
  assert.doesNotMatch(md, /## Synthèse de séance/);
  assert.doesNotMatch(md, /## Traité de consensus/);
  assert.doesNotMatch(md, /## Verdict du jury/);
});

test("les passages issus du secours restent signalés dans l'export", () => {
  const md = buildTranscriptMarkdown({
    topic,
    messages: [msg({ degraded: true })],
    summary: "Synthèse locale.",
    summaryDegraded: true,
    treaty: { preamble: "P.", articles: [{ title: "T", content: "C" }], reservation: "R" },
    treatyDegraded: true,
  });
  // Une intervention, la synthèse et le traité : trois mentions attendues.
  assert.equal((md.match(/moteur de secours local/g) || []).length, 3);
});

test("une séance entièrement réelle ne porte aucune mention de secours", () => {
  const md = buildTranscriptMarkdown({ topic, messages: [msg()], summary: "Synthèse distante." });
  assert.doesNotMatch(md, /moteur de secours local/);
});

test("le nom de fichier est translittéré et daté", () => {
  const nom = transcriptFilename(topic, "2026-03-04T10:00:00.000Z");
  assert.equal(nom, "iadebat-2026-03-04-faut-il-laisser-l-ia-gouverner-nos-decisions-collectives.md");
  assert.doesNotMatch(nom, /[éèêàçùîô'?]/, "aucun accent ni ponctuation");
});

test("un titre très long est borné à soixante caractères de slug", () => {
  const nom = transcriptFilename(
    { ...topic, title: "Mot ".repeat(40) },
    "2026-03-04T10:00:00.000Z"
  );
  const slug = nom.replace("iadebat-2026-03-04-", "").replace(".md", "");
  assert.ok(slug.length <= 60, `slug de ${slug.length} caractères`);
  assert.doesNotMatch(slug, /-$/, "pas de tiret en fin de slug");
});

test("un titre sans caractère exploitable retombe sur un nom par défaut", () => {
  const nom = transcriptFilename({ ...topic, title: "??? !!!" }, "2026-03-04T10:00:00.000Z");
  assert.equal(nom, "iadebat-2026-03-04-debat.md");
});
