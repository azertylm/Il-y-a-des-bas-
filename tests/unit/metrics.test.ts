import { test } from "node:test";
import assert from "node:assert/strict";
import { computeOpinionMetrics } from "../../src/lib/metrics.ts";
import type { Message } from "../../src/types.ts";

const msg = (agentId: string, claps = 0): Message => ({
  id: `${agentId}-${Math.random()}`,
  agentId, agentName: agentId, agentRole: "r",
  agentColor: "#fff", agentDim: "#000", agentBorder: "#000", agentSymbol: "*",
  content: "…", time: "00:00", claps,
});

const somme = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);

test("sans intervention, les quatre axes sont neutres", () => {
  assert.deepEqual(computeOpinionMetrics([]), { rigueur: 25, ethique: 25, pragmatisme: 25, culture: 25 });
});

test("les quatre parts totalisent toujours exactement 100", () => {
  const cas: Message[][] = [
    [msg("claude")],
    [msg("chatgpt"), msg("claude"), msg("gemini")],
    ["chatgpt", "claude", "gemini", "deepseek", "mistral", "grok"].map(id => msg(id)),
    Array.from({ length: 37 }, (_, i) => msg(["chatgpt", "claude", "deepseek", "grok"][i % 4])),
  ];
  for (const messages of cas) {
    assert.equal(somme(computeOpinionMetrics(messages)), 100, `${messages.length} message(s)`);
  }
});

test("les jauges ne saturent plus : dix tours donnent le même équilibre qu'un seul", () => {
  const ids = ["chatgpt", "claude", "gemini", "deepseek", "mistral", "grok"];
  const unTour = ids.map(id => msg(id));
  const dixTours = Array.from({ length: 60 }, (_, i) => msg(ids[i % 6]));
  assert.deepEqual(computeOpinionMetrics(dixTours), computeOpinionMetrics(unTour));
  // Régression : l'ancien calcul renvoyait 100 sur les quatre axes à ce stade.
  assert.notDeepEqual(computeOpinionMetrics(dixTours), { rigueur: 100, ethique: 100, pragmatisme: 100, culture: 100 });
});

test("un orateur dominant déplace réellement son axe", () => {
  const base = computeOpinionMetrics(["chatgpt", "claude", "deepseek", "mistral"].map(id => msg(id)));
  const dominant = computeOpinionMetrics([
    ...["chatgpt", "claude", "deepseek", "mistral"].map(id => msg(id)),
    msg("claude"), msg("claude"), msg("claude"),
  ]);
  assert.ok(dominant.ethique > base.ethique, "l'axe éthique doit monter");
  assert.equal(somme(dominant), 100);
});

test("les soutiens du public amplifient le poids d'une intervention", () => {
  const sans = computeOpinionMetrics([msg("claude"), msg("deepseek")]);
  const avec = computeOpinionMetrics([msg("claude", 10), msg("deepseek")]);
  assert.ok(avec.ethique > sans.ethique);
});

test("une intervention humaine ne pèse sur aucun axe", () => {
  const sansHumain = computeOpinionMetrics([msg("claude"), msg("deepseek")]);
  const avecHumain = computeOpinionMetrics([msg("claude"), msg("deepseek"), msg("user")]);
  assert.deepEqual(avecHumain, sansHumain);
});
