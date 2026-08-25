import { test } from "node:test";
import assert from "node:assert/strict";
import { filterArchives } from "../../src/lib/session.ts";
import type { Archive } from "../../src/types.ts";

const archive = (over: Partial<Archive> & { key: string }): Archive => ({
  topic: { id: 1, category: "TECH", title: "Un sujet", description: "Une description" },
  messages: [], summary: "", closedAt: "2026-01-01T00:00:00.000Z", roundCount: 1, ...over,
});

const registre: Archive[] = [
  archive({
    key: "a",
    topic: { id: 1, category: "ÉCOLOGIE", title: "Faut-il réguler le carbone ?", description: "d" },
    closedAt: "2026-01-03T00:00:00.000Z",
    messages: [{ id: "1", agentId: "grok", agentName: "Grok", agentRole: "r", agentColor: "", agentDim: "", agentBorder: "", agentSymbol: "", content: "Les quotas sont absurdes.", time: "" }],
  }),
  archive({
    key: "b",
    topic: { id: 2, category: "SANTÉ", title: "Génétique et éthique", description: "d" },
    closedAt: "2026-01-01T00:00:00.000Z",
    summary: "Une synthèse évoquant la prudence.",
    messages: Array.from({ length: 5 }, (_, i) => ({ id: `b${i}`, agentId: "claude", agentName: "Claude", agentRole: "r", agentColor: "", agentDim: "", agentBorder: "", agentSymbol: "", content: "…", time: "" })),
  }),
  archive({ key: "c", closedAt: "2026-01-02T00:00:00.000Z" }),
];

test("une recherche vide renvoie tout le registre", () => {
  assert.equal(filterArchives(registre, "", "recent").length, 3);
  assert.equal(filterArchives(registre, "   ", "recent").length, 3);
});

test("la recherche ignore la casse et les accents", () => {
  assert.deepEqual(filterArchives(registre, "GENETIQUE", "recent").map(a => a.key), ["b"]);
  assert.deepEqual(filterArchives(registre, "écologie", "recent").map(a => a.key), ["a"]);
});

test("la recherche porte aussi sur la synthèse et sur le contenu des interventions", () => {
  assert.deepEqual(filterArchives(registre, "prudence", "recent").map(a => a.key), ["b"]);
  assert.deepEqual(filterArchives(registre, "quotas", "recent").map(a => a.key), ["a"]);
  assert.deepEqual(filterArchives(registre, "Grok", "recent").map(a => a.key), ["a"]);
});

test("un terme absent ne renvoie rien", () => {
  assert.deepEqual(filterArchives(registre, "zzzintrouvable", "recent"), []);
});

test("les trois ordres de tri font ce qu'ils annoncent", () => {
  assert.deepEqual(filterArchives(registre, "", "recent").map(a => a.key), ["a", "c", "b"]);
  assert.deepEqual(filterArchives(registre, "", "ancien").map(a => a.key), ["b", "c", "a"]);
  assert.equal(filterArchives(registre, "", "volume")[0].key, "b");
});

test("le filtrage ne modifie pas le tableau d'origine", () => {
  const avant = registre.map(a => a.key);
  filterArchives(registre, "", "ancien");
  assert.deepEqual(registre.map(a => a.key), avant);
});
