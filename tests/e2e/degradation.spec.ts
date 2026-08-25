import { test, expect } from "@playwright/test";
import { closeDebate, runOneRound, setStubMode, speechCount } from "./helpers.ts";

/**
 * Règle du projet : l'interface ne doit jamais faire passer un gabarit local
 * pour une génération réelle. Ces scénarios en sont le filet de sécurité.
 */
test.describe("Signalement du mode dégradé", () => {
  test.afterEach(async () => { await setStubMode("remote"); });

  test("quand le moteur distant tombe, chaque réponse est marquée", async ({ page }) => {
    await setStubMode("down");
    await page.goto("/");

    await runOneRound(page);

    expect(await speechCount(page), "le débat se déroule quand même").toBe(6);
    await expect(page.getByText(/Mode secours local/i)).toBeVisible();
    // Une pastille par intervention, plus celle du bandeau.
    expect(await page.getByText(/Secours local/i).count()).toBeGreaterThanOrEqual(6);
  });

  test("la clôture dégradée signale synthèse, traité et verdict", async ({ page }) => {
    await setStubMode("down");
    await page.goto("/");
    await runOneRound(page);
    await closeDebate(page);

    await expect(page.getByText(/ne reflète pas le contenu réel du débat/i)).toBeVisible();
    await expect(page.getByText(/gabarit générique produit localement/i)).toBeVisible();
    await expect(page.getByText(/ne résultent.*aucune évaluation réelle/i)).toBeVisible();
  });

  test("le verdict de secours reste analysable et ne prétend pas juger", async ({ page }) => {
    await setStubMode("down");
    await page.goto("/");
    await runOneRound(page);
    await closeDebate(page);

    // Régression : la note d'avertissement était concaténée au JSON du
    // verdict, qui devenait illisible et n'était donc jamais affiché.
    await expect(page.getByText(/DÉSIGNÉ VAINQUEUR DE SÉANCE/i)).toBeVisible();
    await expect(page.getByText(/tirage|sans lecture|aucun argument/i).first()).toBeVisible();
  });

  test("un mode réel retrouvé ne laisse aucun marqueur", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");
    await runOneRound(page);

    await expect(page.getByText(/Mode secours local/i)).toHaveCount(0);
    await expect(page.getByText(/Secours local/i)).toHaveCount(0);
  });
});
