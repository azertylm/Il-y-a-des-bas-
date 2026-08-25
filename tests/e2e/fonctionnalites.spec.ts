import { test, expect } from "@playwright/test";
import { closeDebate, runOneRound, setStubMode, speechCount } from "./helpers.ts";

test.describe("Analyse de sophismes", () => {
  test("le relevé distant s'affiche et n'est pas rejoué à la réouverture", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");
    await runOneRound(page);

    let appels = 0;
    await page.route("**/api/debate/analyze-fallacy", route => { appels++; return route.continue(); });

    await page.getByRole("button", { name: /Décortiquer/i }).first().click();
    await expect(page.getByText(/Relevé rhétorique/i)).toBeVisible();
    await expect(page.getByText(/Pente glissante/i)).toBeVisible();
    await expect(page.getByText(/41 \/ 100/)).toBeVisible();
    await expect(page.getByText(/Secours local/i)).toHaveCount(0);

    // Repli puis réouverture : le résultat est en cache.
    await page.getByRole("button", { name: /Masquer le relevé/i }).first().click();
    await expect(page.getByText(/Relevé rhétorique/i)).toHaveCount(0);
    await page.getByRole("button", { name: /Voir le relevé/i }).first().click();
    await expect(page.getByText(/Relevé rhétorique/i)).toBeVisible();
    expect(appels, "un seul appel malgré deux ouvertures").toBe(1);
  });

  test("le relevé local est explicitement signalé", async ({ page }) => {
    await setStubMode("down");
    await page.goto("/");
    await runOneRound(page);

    await page.getByRole("button", { name: /Décortiquer/i }).first().click();
    await expect(page.getByText(/Relevé rhétorique/i)).toBeVisible();
    await expect(page.getByText(/Solidité logique/i)).toBeVisible();
    await setStubMode("remote");
  });
});

test.describe("Traité de consensus", () => {
  test("les articles distants sont numérotés et la réserve consignée", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");
    await runOneRound(page);
    await closeDebate(page);

    await expect(page.getByText(/TRAITÉ DE CONSENSUS/i)).toBeVisible();
    expect(await page.getByText(/^Article \d+ —/).count()).toBe(3);
    await expect(page.getByText(/Réserve consignée au procès-verbal/i)).toBeVisible();
  });
});

test.describe("Export du procès-verbal", () => {
  test("le fichier Markdown contient toutes les sections de la séance", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");
    await runOneRound(page);
    await closeDebate(page);

    const attente = page.waitForEvent("download");
    await page.getByRole("button", { name: /Exporter le procès-verbal/i }).click();
    const fichier = await attente;

    expect(fichier.suggestedFilename()).toMatch(/^iadebat-\d{4}-\d{2}-\d{2}-.+\.md$/);
    const flux = await fichier.createReadStream();
    const md = (await new Promise<Buffer[]>(r => {
      const morceaux: Buffer[] = [];
      flux.on("data", c => morceaux.push(c as Buffer));
      flux.on("end", () => r(morceaux));
    })).map(String).join("");

    expect(md).toMatch(/## Retranscription des débats/);
    expect(md).toMatch(/## Synthèse de séance/);
    expect(md).toMatch(/## Traité de consensus/);
    expect(md).toMatch(/## Verdict du jury/);
    expect(md, "séance réelle : aucune mention de secours").not.toMatch(/moteur de secours local/);
  });

  test("un export dégradé conserve ses mentions de secours", async ({ page }) => {
    await setStubMode("down");
    await page.goto("/");
    await runOneRound(page);
    await closeDebate(page);

    const attente = page.waitForEvent("download");
    await page.getByRole("button", { name: /Exporter le procès-verbal/i }).click();
    const flux = await (await attente).createReadStream();
    const md = (await new Promise<Buffer[]>(r => {
      const morceaux: Buffer[] = [];
      flux.on("data", c => morceaux.push(c as Buffer));
      flux.on("end", () => r(morceaux));
    })).map(String).join("");

    expect(md).toMatch(/moteur de secours local/);
    await setStubMode("remote");
  });
});

test.describe("Recherche dans les archives", () => {
  test("la recherche filtre le registre et annonce l'absence de résultat", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");
    await runOneRound(page);
    await closeDebate(page);

    await page.getByRole("button", { name: /^ARCHIVES/ }).click();
    const recherche = page.getByPlaceholder(/Rechercher un sujet/i);
    await expect(recherche).toBeVisible();

    await recherche.fill("zzzintrouvable");
    await expect(page.getByText(/Aucune séance ne correspond/i)).toBeVisible();

    // Un mot réellement présent : le sujet tourne toutes les quatre heures,
    // un terme codé en dur produirait un faux négatif.
    await recherche.fill("");
    const titre = await page.locator("h3").first().innerText();
    const mot = titre.split(/\s+/).find(m => m.length > 6) || "IA";
    await recherche.fill(mot);
    expect(await page.locator("h3").count()).toBeGreaterThan(0);
  });
});

test.describe("Reprise de séance", () => {
  test("un rechargement propose de reprendre la séance interrompue", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");
    await runOneRound(page);
    const avant = await speechCount(page);

    await page.reload();
    await expect(page.getByText(/Séance interrompue retrouvée/i)).toBeVisible();
    expect(await speechCount(page), "rien n'est restauré avant l'arbitrage").toBe(0);

    await page.getByRole("button", { name: /^Reprendre$/i }).click();
    expect(await speechCount(page)).toBe(avant);
    await expect(page.getByText(/Séance interrompue retrouvée/i)).toHaveCount(0);
  });

  test("la séance écartée ne revient pas au rechargement suivant", async ({ page }) => {
    await setStubMode("remote");
    await page.goto("/");
    await runOneRound(page);

    await page.reload();
    await page.getByRole("button", { name: /Écarter cette séance/i }).click();
    await expect(page.getByText(/Séance interrompue retrouvée/i)).toHaveCount(0);

    await page.reload();
    await expect(page.getByText(/Séance interrompue retrouvée/i)).toHaveCount(0);
  });
});
