import { test } from "node:test";
import assert from "node:assert/strict";
import { excerpt, isAbort } from "../../src/lib/text.ts";
import { getNextCycleBoundary, getCurrentTopicIndex, fmtTimer } from "../../src/lib/time.ts";
import { DEFAULT_TOPICS } from "../../src/constants.ts";

test("un texte plus court que la limite n'est pas touché", () => {
  assert.equal(excerpt("Court.", 700), "Court.");
});

test("la troncature coupe sur une frontière de mot et ajoute une ellipse", () => {
  const texte = "mot ".repeat(400).trim();
  const coupe = excerpt(texte, 700);
  assert.ok(coupe.length <= 701, `longueur ${coupe.length}`);
  assert.ok(coupe.endsWith("…"));
  assert.ok(!coupe.includes("mo…"), "ne doit pas couper au milieu d'un mot");
});

test("une annulation volontaire se distingue d'une panne", () => {
  const annulation = new Error("aborted");
  annulation.name = "AbortError";
  assert.equal(isAbort(annulation), true);
  assert.equal(isAbort(new Error("fetch failed")), false);
  assert.equal(isAbort(undefined), false);
});

test("la borne de cycle tombe toujours sur un multiple de quatre heures UTC", () => {
  for (let h = 0; h < 24; h++) {
    const instant = Date.UTC(2026, 0, 15, h, 37, 12);
    const borne = new Date(getNextCycleBoundary(instant));
    assert.equal(borne.getUTCMinutes(), 0);
    assert.equal(borne.getUTCSeconds(), 0);
    assert.equal(borne.getUTCHours() % 4, 0, `heure de départ ${h}`);
    assert.ok(borne.getTime() > instant, `la borne doit être future (heure ${h})`);
  }
});

test("la dernière tranche du jour bascule sur minuit du lendemain", () => {
  const borne = new Date(getNextCycleBoundary(Date.UTC(2026, 0, 15, 23, 59, 59)));
  assert.equal(borne.getUTCDate(), 16);
  assert.equal(borne.getUTCHours(), 0);
});

test("l'indice de sujet reste dans les bornes du catalogue", () => {
  const i = getCurrentTopicIndex();
  assert.ok(Number.isInteger(i) && i >= 0 && i < DEFAULT_TOPICS.length);
});

test("le compte à rebours se formate en HH:MM:SS", () => {
  assert.equal(fmtTimer(0), "00:00:00");
  assert.equal(fmtTimer(3661), "01:01:01");
  assert.equal(fmtTimer(4 * 3600 - 1), "03:59:59");
});
