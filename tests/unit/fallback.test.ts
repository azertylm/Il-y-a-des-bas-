import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateLocalFallacyAnalysis,
  generateLocalTreaty,
  generateLocalSpeech,
  generateLocalSummary,
  generateLocalJuryVerdict,
} from "../../src/server/fallback.ts";

const SUJET = "Faut-il laisser l'IA gouverner nos décisions collectives ?";

test("l'heuristique repère les sophismes réellement présents", () => {
  const texte = `Tous les bureaucrates apeurés voudraient nous faire croire que la régulation nous sauvera.
Soit on libère le calcul, soit on accepte le déclin. Cette approche archaïque mènera inévitablement
à la catastrophe. Les experts le savent bien.`;
  const { findings, soundness } = generateLocalFallacyAnalysis(texte, "Grok");
  const noms = findings.map(f => f.name);

  for (const attendu of [
    "Généralisation abusive", "Faux dilemme", "Pente glissante",
    "Appel à l'autorité", "Appel à la peur", "Attaque contre la personne",
    "Homme de paille", "Appel à la nouveauté",
  ]) {
    assert.ok(noms.includes(attendu), `${attendu} non repéré`);
  }
  assert.ok(soundness <= 30, `solidité ${soundness}, attendue basse`);
});

test("un texte sobre ne déclenche aucun faux positif", () => {
  const texte = "Trois études publiées en 2024 mesurent un effet modéré, avec des intervalles de confiance larges. La prudence semble justifiée.";
  const { findings, soundness } = generateLocalFallacyAnalysis(texte, "Claude");
  assert.deepEqual(findings, []);
  assert.equal(soundness, 100);
});

test("la solidité reste bornée entre 20 et 100", () => {
  const pire = "Tous soit ou bien inévitablement les experts catastrophe bureaucrates prétendent que archaïque".repeat(3);
  const { soundness } = generateLocalFallacyAnalysis(pire, "X");
  assert.ok(soundness >= 20 && soundness <= 100, `solidité ${soundness}`);
});

test("chaque relevé cite un passage et une gravité valide", () => {
  const { findings } = generateLocalFallacyAnalysis("Soit on avance, soit on meurt.", "X");
  assert.ok(findings.length > 0);
  for (const f of findings) {
    assert.ok(f.quote.length > 0, "citation vide");
    assert.ok(["faible", "moyenne", "forte"].includes(f.severity));
    assert.ok(f.explanation.length > 20);
  }
});

test("le verdict de secours est du JSON pur, exploitable par le client", () => {
  const verdict = JSON.parse(generateLocalJuryVerdict(SUJET));
  assert.ok(typeof verdict.winnerId === "string");
  assert.ok(Object.keys(verdict.agentScores).length >= 6);
  // Régression : la note d'avertissement était autrefois concaténée au JSON,
  // ce qui faisait systématiquement échouer son analyse côté client.
  assert.doesNotThrow(() => JSON.parse(generateLocalJuryVerdict(SUJET)));
});

test("le verdict de secours ne se présente pas comme une évaluation réelle", () => {
  const verdict = JSON.parse(generateLocalJuryVerdict(SUJET));
  assert.match(
    `${verdict.winnerReason} ${verdict["critiqueGénérale"]}`,
    /tirage|sans lecture|aucun argument/i,
    "le texte doit dire qu'il ne juge rien"
  );
});

// Régression : les anciens gabarits injectaient des mots extraits du titre
// dans des positions grammaticales, produisant « l'évolution entourant de
// décisions » ou « la dynamique de laisser ».
const MOTS_DU_TITRE = ["laisser", "gouverner", "décisions", "collectives"];

for (const agent of ["chatgpt", "claude", "gemini", "deepseek", "mistral", "grok"]) {
  test(`le gabarit de ${agent} ne recrache pas les mots du titre`, () => {
    for (let i = 0; i < 25; i++) {
      const texte = generateLocalSpeech(agent, SUJET, "Une description.");
      // Le titre peut être cité en entier ; les mots isolés en gras, non.
      const sansTitre = texte.split(SUJET).join("");
      for (const mot of MOTS_DU_TITRE) {
        assert.doesNotMatch(sansTitre, new RegExp(`\\*\\*${mot}\\*\\*`, "i"), `« ${mot} » injecté isolément`);
      }
      assert.ok(texte.length > 300, "le gabarit doit rester substantiel");
    }
  });
}

test("la synthèse de secours cite le sujet une seule fois, sans le découper", () => {
  const texte = generateLocalSummary(SUJET, "Une description.");
  assert.equal(texte.split(SUJET).length - 1, 1);
  for (const mot of MOTS_DU_TITRE) {
    assert.doesNotMatch(texte.split(SUJET).join(""), new RegExp(`\\*\\*${mot}\\*\\*`, "i"));
  }
});

test("le traité de secours est complet et grammatical", () => {
  const traite = generateLocalTreaty(SUJET);
  assert.ok(traite.articles.length >= 3);
  assert.match(traite.preamble, /Faut-il laisser/);
  for (const article of traite.articles) {
    assert.match(article.title, /^D[eu] /, `titre inattendu : ${article.title}`);
    assert.ok(article.content.length > 40);
  }
  // Les tournures fautives de la première version.
  const tout = JSON.stringify(traite);
  assert.doesNotMatch(tout, /touchant à laisser|engageant gouverner|priorité à décisions/i);
});

test("le traité admet ne pas découler du débat", () => {
  assert.match(generateLocalTreaty(SUJET).reservation, /gabarit|générique/i);
});

test("un sujet vide ne casse aucun gabarit", () => {
  assert.ok(generateLocalTreaty("").preamble.length > 0);
  assert.ok(generateLocalSummary("", "").length > 0);
  assert.ok(generateLocalSpeech("claude", "", "").length > 0);
  assert.doesNotThrow(() => JSON.parse(generateLocalJuryVerdict("")));
});
