import { test, expect } from "@playwright/test";
import { closeDebate, runOneRound, setStubMode, speechCount } from "./helpers.ts";

test.describe("Déroulé d'une séance", () => {
  test("un tour de table complet aboutit en mode réel, sans marqueur de secours", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");

    await runOneRound(page);

    expect(await speechCount(page)).toBe(6);
    await expect(page.getByText(/Secours local/i)).toHaveCount(0);
    await expect(page.getByText(/authentiquement distante/i).first()).toBeVisible();
  });

  test("la clôture produit synthèse, traité et verdict, puis archive la séance", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");
    await runOneRound(page);
    await closeDebate(page);

    await expect(page.getByText(/SYNTHÈSE EXÉCUTIVE/i)).toBeVisible();
    await expect(page.getByText(/TRAITÉ DE CONSENSUS/i)).toBeVisible();
    await expect(page.getByText(/VERDICT DU JURY/i)).toBeVisible();
    // Le verdict distant désigne Mistral : preuve qu'il a bien été analysé.
    await expect(page.getByText(/🏆 MISTRAL/i)).toBeVisible();

    // Une seule archive : la clôture ne doit pas s'exécuter deux fois.
    await expect(page.getByRole("button", { name: /^ARCHIVES \(1\)/ })).toBeVisible();
  });

  test("« Pause » interrompt réellement les requêtes en vol", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");
    await runOneRound(page);

    await page.getByRole("button", { name: /Poursuivre le tour de table/i }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /Mettre en pause/i }).click();

    const auMoment = await speechCount(page);
    await page.waitForTimeout(3000);
    expect(await speechCount(page), "aucune réponse fantôme après la pause").toBe(auMoment);
  });

  test("un orateur défaillant est écarté sans interrompre le tour", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");

    // On coupe le réseau pour la deuxième et la quatrième prise de parole.
    let n = 0;
    await page.route("**/api/debate/generate", route => {
      n++;
      return n === 2 || n === 4 ? route.abort("connectionfailed") : route.continue();
    });

    await runOneRound(page);

    expect(n, "les six orateurs doivent avoir été sollicités").toBe(6);
    expect(await speechCount(page), "quatre interventions sur six aboutissent").toBe(4);
    await expect(page.getByText(/Orateur\(s\) écarté\(s\)/i)).toBeVisible();
  });

  test("le Markdown est rendu, jamais affiché avec ses astérisques", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");
    await runOneRound(page);

    const corps = await page.locator("main").innerText();
    expect(corps, "aucune paire d'astérisques visible").not.toMatch(/\*\*/);
    expect(await page.locator("main strong").count()).toBeGreaterThan(0);
  });
});
