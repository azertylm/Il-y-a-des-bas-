import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const APP_PORT = Number(process.env.E2E_APP_PORT) || 3210;
const STUB_PORT = Number(process.env.E2E_STUB_PORT) || 4545;

// Les archives de test vivent hors du dépôt : les scénarios en écrivent, et
// elles ne doivent pas polluer le fichier de développement.
const ARCHIVES_FILE = path.join(process.cwd(), "node_modules", ".cache", "iadebat-e2e-archives.json");
fs.mkdirSync(path.dirname(ARCHIVES_FILE), { recursive: true });

// Playwright fourni par l'image n'est pas toujours celui qu'installe npm :
// on pointe explicitement le binaire quand il est présent.
const chromiumPath = [
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
].find(p => fs.existsSync(p));

export default defineConfig({
  testDir: "./tests/e2e",
  // Un débat complet enchaîne six générations : ces scénarios sont lents par
  // nature, pas par accident.
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
  },

  webServer: [
    {
      command: `node tests/fixtures/gemini-stub.mjs`,
      url: `http://127.0.0.1:${STUB_PORT}/__health`,
      env: { STUB_PORT: String(STUB_PORT) },
      reuseExistingServer: !process.env.CI,
      stdout: "ignore",
    },
    {
      // L'application tourne avec une clé factice pointée sur le bouchon :
      // chaque test choisit ensuite s'il veut le mode réel ou le secours,
      // en basculant le bouchon plutôt qu'en redémarrant le serveur.
      command: "npm run dev",
      url: `http://127.0.0.1:${APP_PORT}/api/health`,
      env: {
        PORT: String(APP_PORT),
        GEMINI_API_KEY: "cle-de-test",
        GEMINI_BASE_URL: `http://127.0.0.1:${STUB_PORT}`,
        ARCHIVES_FILE,
        // Les scénarios enchaînent beaucoup d'appels : la limite de débit
        // réelle est vérifiée séparément, pas subie partout.
        RATE_LIMIT_MAX: "10000",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "ignore",
    },
  ],
});
