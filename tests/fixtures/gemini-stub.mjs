/**
 * Bouchon imitant l'API Gemini, pilotable en cours de test.
 *
 * Il permet d'exercer les deux chemins du contrat de dégradation contre une
 * seule instance de l'application :
 *   - mode « remote » : réponses valides, le serveur ne dégrade pas ;
 *   - mode « down »   : erreurs 503, le serveur bascule sur le secours local.
 *
 * Le mode se change par `POST /__mode` (voir tests/e2e/helpers.ts).
 */
import http from "node:http";

const PORT = Number(process.env.STUB_PORT) || 4545;
let mode = "remote";
let calls = 0;

/** Réponse adaptée à la nature de la requête, devinée depuis le prompt. */
function replyFor(body) {
  if (body.includes("sophisme")) {
    return JSON.stringify({
      findings: [{
        name: "Pente glissante",
        quote: "un passage cité par le modèle distant",
        explanation: "Explication produite à distance, pas par l'heuristique locale.",
        severity: "forte",
      }],
      soundness: 41,
      verdict: "Appréciation distante du logicien.",
    });
  }
  if (body.includes("traité de consensus")) {
    return JSON.stringify({
      preamble: "Préambule rédigé à distance pour ce débat précis.",
      articles: [
        { title: "De la distance", content: "Article un, réellement rédigé." },
        { title: "Du réel", content: "Article deux, réellement rédigé." },
        { title: "De la preuve", content: "Article trois, réellement rédigé." },
      ],
      reservation: "Réserve distante consignée.",
    });
  }
  if (body.includes("thèmes de débat")) {
    return JSON.stringify([1, 2, 3].map(n => ({
      category: "CATÉGORIE DISTANTE",
      title: `Thème distant numéro ${n} ?`,
      description: "Description issue du bouchon.",
    })));
  }
  if (body.includes("JURY")) {
    return JSON.stringify({
      winnerId: "mistral",
      winnerReason: "Une **démonstration** limpide, jugée à distance.",
      agentScores: { chatgpt: 8, claude: 9, gemini: 7, deepseek: 8, mistral: 10, grok: 6 },
      agentBadges: { mistral: "La Flamme" },
      "critiqueGénérale": "Délibération distante.",
      keyCitation: "Citation retenue à distance.",
    });
  }
  if (body.includes("synthèse de ce débat")) {
    return "Premier paragraphe de la **vraie** synthèse distante.\n\nDeuxième paragraphe.\n\n**Phrase de clôture en gras.**";
  }
  return `Réponse **authentiquement distante** numéro ${calls}, produite par le bouchon et non par un gabarit local.`;
}

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", () => {
    if (req.url === "/__health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", mode, calls }));
    }

    if (req.url === "/__mode") {
      mode = JSON.parse(body || "{}").mode === "down" ? "down" : "remote";
      calls = 0;
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ mode }));
    }

    calls++;

    if (mode === "down") {
      res.writeHead(503, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: { message: "Bouchon indisponible (mode down)." } }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      candidates: [{ content: { role: "model", parts: [{ text: replyFor(body) }] }, finishReason: "STOP" }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 30 },
    }));
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[BOUCHON GEMINI] à l'écoute sur http://127.0.0.1:${PORT}`);
});
