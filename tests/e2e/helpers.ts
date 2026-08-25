import { expect, type Page } from "@playwright/test";
import { getNextCycleBoundary } from "../../src/lib/time.ts";

const STUB = `http://127.0.0.1:${Number(process.env.E2E_STUB_PORT) || 4545}`;

/**
 * Bascule le bouchon Gemini.
 *  - "remote" : les routes répondent, rien n'est dégradé ;
 *  - "down"   : les routes échouent, le serveur sert le secours local.
 */
export async function setStubMode(mode: "remote" | "down") {
  const res = await fetch(`${STUB}/__mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error(`Bouchon injoignable : ${res.status}`);
}

/** Nombre d'appels reçus par le bouchon depuis le dernier changement de mode. */
export async function stubCalls(): Promise<number> {
  return (await (await fetch(`${STUB}/__health`)).json()).calls;
}

/** Lance un tour de table et attend qu'il soit terminé. */
export async function runOneRound(page: Page) {
  const lancer = page.getByRole("button", { name: /Lancer les délibérations|Faire parler les modèles/i }).first();
  await lancer.click();
  await expect(page.getByRole("button", { name: /Poursuivre le tour de table/i })).toBeVisible({ timeout: 150_000 });
}

/** Clôt la séance et attend que le procès-verbal soit enregistré. */
export async function closeDebate(page: Page) {
  await page.getByRole("button", { name: /Arrêter & Délibérer/i }).click();
  await expect(page.getByText(/PROGÈS-VERBAL SAUVEGARDÉ/i)).toBeVisible({ timeout: 150_000 });
}

/** Nombre d'interventions affichées dans le fil. */
export function speechCount(page: Page) {
  return page.getByRole("button", { name: /Soutenir/i }).count();
}

/**
 * Décale la perception du temps sans toucher aux minuteries.
 *
 * `page.clock.install()` simule aussi `setTimeout` et `requestAnimationFrame`,
 * dont dépend le sondeur d'assertions de Playwright : les vérifications
 * restent alors bloquées sur une page pourtant correcte. Ici, seul `Date` est
 * décalé — les minuteries continuent de battre en temps réel.
 *
 * Le décalage est posé avant le chargement, car la minuterie de cycle fixe sa
 * borne au montage du composant.
 */
export async function installShiftedClock(page: Page, offsetMs = 0) {
  await page.addInitScript(decalage => {
    const Reelle = Date;
    (window as any).__decalage = decalage;
    class DateDecalee extends Reelle {
      constructor(...args: any[]) {
        if (args.length === 0) super(Reelle.now() + (window as any).__decalage);
        else super(...(args as []));
      }
      static now() {
        return Reelle.now() + (window as any).__decalage;
      }
    }
    (window as any).Date = DateDecalee;
  }, offsetMs);
}

/** Fait « dormir » l'onglet : l'horloge perçue avance d'un coup. */
export async function advancePerceivedTime(page: Page, ms: number) {
  await page.evaluate(d => { (window as any).__decalage += d; }, ms);
}

/**
 * Décalage plaçant la page juste avant la prochaine bascule de cycle.
 * Calculé depuis l'heure réelle : une date fixe serait tantôt future,
 * tantôt passée selon le jour où les tests s'exécutent.
 */
export function offsetJusteAvantBascule(secondesAvant = 4): number {
  const maintenant = Date.now();
  return getNextCycleBoundary(maintenant) - secondesAvant * 1000 - maintenant;
}
