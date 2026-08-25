import { test, expect } from "@playwright/test";
import {
  advancePerceivedTime, installShiftedClock, offsetJusteAvantBascule,
  runOneRound, setStubMode, speechCount,
} from "./helpers.ts";

/**
 * Le sujet tourne toutes les quatre heures UTC. Plutôt que d'attendre une
 * bascule réelle, on décale l'horloge perçue par la page tout en laissant
 * les minuteries battre normalement.
 */
test.describe("Rotation horaire du sujet", () => {
  const CINQ_HEURES = 5 * 60 * 60 * 1000;

  test("franchir la borne referme la séance", async ({ page }) => {
    await setStubMode("remote");
    await installShiftedClock(page, offsetJusteAvantBascule());
    await page.goto("/");

    await expect(page.getByText(/PROGÈS-VERBAL SAUVEGARDÉ/i)).toBeVisible({ timeout: 60_000 });
  });

  test("un onglet resté en arrière-plan ne rate pas le créneau", async ({ page }) => {
    await setStubMode("remote");
    await installShiftedClock(page);
    await page.goto("/");
    await expect(page.getByText(/L'ARÈNE DIALECTIQUE EST OUVERTE/i)).toBeVisible();

    // L'onglet « dort » cinq heures : la borne est franchie sans qu'aucun
    // battement ne tombe pile dessus.
    await advancePerceivedTime(page, CINQ_HEURES);

    // Régression : le déclenchement ne testait que `secs === 0`, si bien
    // qu'un créneau franchi pendant une mise en veille était perdu.
    await expect(page.getByText(/PROGÈS-VERBAL SAUVEGARDÉ/i)).toBeVisible({ timeout: 60_000 });
  });

  test("le sujet du cycle suivant devient actif une fois l'arène au repos", async ({ page }) => {
    await setStubMode("remote");
    await installShiftedClock(page);
    await page.goto("/");

    const sujetInitial = await page.locator("h1").first().innerText();
    await advancePerceivedTime(page, CINQ_HEURES);
    await expect(page.getByText(/PROGÈS-VERBAL SAUVEGARDÉ/i)).toBeVisible({ timeout: 60_000 });

    // Régression : `topicIndex` était figé au chargement, si bien qu'après
    // une bascule l'arène rejouait indéfiniment le même sujet.
    await page.getByRole("button", { name: /Entamer un nouveau débat/i }).click();
    await expect(page.locator("h1").first()).not.toHaveText(sujetInitial, { timeout: 30_000 });
  });

  test("le sujet ne change pas sous les pieds d'un débat en cours", async ({ page }) => {
    await setStubMode("remote");
    await installShiftedClock(page);
    await page.goto("/");

    const sujetInitial = await page.locator("h1").first().innerText();
    await runOneRound(page);
    expect(await speechCount(page)).toBe(6);

    // La bascule tombe alors que la séance est déjà remplie : le sujet doit
    // rester celui sous lequel elle a été débattue, sinon l'archive est
    // enregistrée sous un intitulé qui n'a jamais été discuté.
    await advancePerceivedTime(page, CINQ_HEURES);
    await expect(page.getByText(/PROGÈS-VERBAL SAUVEGARDÉ/i)).toBeVisible({ timeout: 120_000 });
    expect(await page.locator("h1").first().innerText()).toBe(sujetInitial);
  });
});
