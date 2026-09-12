import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent crash if GEMINI_API_KEY is not set immediately at module load
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") {
    throw new Error("La clé API 'GEMINI_API_KEY' n'est pas configurée dans les secrets de l'application.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
    });
  }
  return aiClient;
}

function isApiKeyError(error: any): boolean {
  if (!error) return false;
  let errorStr = "";
  try {
    errorStr = (typeof error === "string" ? error : (error.message || JSON.stringify(error) || "")).toLowerCase();
  } catch {
    errorStr = String(error).toLowerCase();
  }
  return (
    errorStr.includes("api key") || 
    errorStr.includes("api_key") ||
    errorStr.includes("invalid_argument") ||
    errorStr.includes("unauthorized") ||
    errorStr.includes("forbidden") ||
    errorStr.includes("unauthorized_client") ||
    errorStr.includes("key is invalid") ||
    errorStr.includes("invalid_key") ||
    errorStr.includes("key not valid") ||
    errorStr.includes("api_key_invalid") ||
    errorStr.includes("not configured") ||
    errorStr.includes("n'est pas configurée") ||
    errorStr.includes("quota") ||
    errorStr.includes("insufficient_quota") ||
    errorStr.includes("billing") ||
    errorStr.includes("exceeded your current quota") ||
    errorStr.includes("resource_exhausted") ||
    errorStr.includes("credit") ||
    errorStr.includes("solde") ||
    errorStr.includes("payment") ||
    errorStr.includes("plan and billing")
  );
}

// Clean single-line error formatter that prevents multi-line JSON dump in stdout/stderr
function formatErrorSummary(err: any): string {
  if (!err) return "Détail non spécifié";
  try {
    const raw = typeof err === "string" ? err : (err.message || JSON.stringify(err) || String(err));
    if (raw.includes("{")) {
      try {
        const parsed = JSON.parse(raw);
        const msg = parsed?.error?.message || parsed?.message || parsed?.error?.code || parsed?.error;
        if (msg) return String(msg).replace(/[\r\n\t]+/g, " ").trim().slice(0, 120);
      } catch {
        const match = raw.match(/"message"\s*:\s*"([^"]+)"/);
        if (match && match[1]) return match[1].slice(0, 120);
      }
    }
    return String(raw).replace(/[\r\n\t]+/g, " ").trim().slice(0, 120);
  } catch {
    return "Erreur d'exécution";
  }
}

// Multi-tier model cascade for high demand, ultra-low latency and 503 resilience
const GEMINI_TEXT_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash"
];

async function generateWithGemini(
  ai: GoogleGenAI,
  request: {
    contents: string;
    config?: any;
  },
  preferredModel?: string
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;
  const modelsToTry = preferredModel 
    ? (GEMINI_TEXT_MODELS.includes(preferredModel) 
        ? [preferredModel, ...GEMINI_TEXT_MODELS.filter(m => m !== preferredModel)] 
        : [preferredModel, ...GEMINI_TEXT_MODELS])
    : GEMINI_TEXT_MODELS;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const timeoutPromise = new Promise<{ text: string; modelUsed: string }>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout réponse")), 4000)
        );

        const apiPromise = ai.models.generateContent({
          model,
          contents: request.contents,
          config: request.config,
        }).then(response => {
          if (response && response.text) {
            return { text: response.text, modelUsed: model };
          }
          throw new Error("Réponse vide");
        });

        const result = await Promise.race([apiPromise, timeoutPromise]);
        return result;
      } catch (err: any) {
        lastError = err;

        // If API key is rejected or quota/billing limit reached, fail fast immediately
        if (isApiKeyError(err)) {
          throw err;
        }

        const msg = String(err?.message || JSON.stringify(err) || "").toLowerCase();
        const isTransient =
          msg.includes("timeout") ||
          msg.includes("503") ||
          msg.includes("high demand") ||
          msg.includes("unavailable") ||
          msg.includes("overloaded") ||
          msg.includes("spikes in demand");

        if (isTransient) {
          console.warn(`[IADÉBAT SERVER] Modèle ${model} lent ou temporairement indisponible (essai ${attempt + 1}/2).`);
          // Bascule rapide sans long délai
          await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
          continue;
        }

        // Try next model in cascade immediately
        break;
      }
    }
  }

  throw lastError;
}

// File path for durable JSON archive storage
const ARCHIVES_FILE = path.join(process.cwd(), "archives.json");

function loadArchives(): any[] {
  try {
    if (fs.existsSync(ARCHIVES_FILE)) {
      const data = fs.readFileSync(ARCHIVES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.log("Lecture des archives locales indisponible.");
  }
  return [];
}

function saveArchives(archives: any[]) {
  try {
    fs.writeFileSync(ARCHIVES_FILE, JSON.stringify(archives, null, 2), "utf-8");
  } catch (e) {
    console.log("Sauvegarde des archives locales indisponible.");
  }
}

// --- API ROUTES ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get all archives
app.get("/api/archives", (req, res) => {
  const list = loadArchives();
  res.json(list);
});

// Save new archive
app.post("/api/archives", (req, res) => {
  const record = req.body;
  if (!record || !record.key) {
    return res.status(400).json({ error: "Enregistrement non valide ou sans clé unique." });
  }
  const current = loadArchives();
  // Avoid duplicate key
  const filtered = current.filter(item => item.key !== record.key);
  filtered.unshift(record); // Add to the top
  saveArchives(filtered);
  res.json({ success: true, record });
});

// Delete an archive
app.delete("/api/archives/:key", (req, res) => {
  const { key } = req.params;
  const current = loadArchives();
  const next = current.filter(item => item.key !== key);
  saveArchives(next);
  res.json({ success: true });
});

// File path for durable shared debate links
const SHARES_FILE = path.join(process.cwd(), "shares.json");

function loadShares(): Record<string, any> {
  try {
    if (fs.existsSync(SHARES_FILE)) {
      const data = fs.readFileSync(SHARES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.log("Lecture des partages locaux indisponible.");
  }
  return {};
}

function saveShares(shares: Record<string, any>) {
  try {
    fs.writeFileSync(SHARES_FILE, JSON.stringify(shares, null, 2), "utf-8");
  } catch (e) {
    console.log("Sauvegarde des partages locaux indisponible.");
  }
}

// Create or update a shareable link for a debate result
app.post("/api/share", (req, res) => {
  const debateData = req.body;
  if (!debateData || !debateData.topic) {
    return res.status(400).json({ error: "Données de débat incomplètes pour le partage." });
  }

  const shares = loadShares();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const shareId = debateData.id || `debat-${Date.now().toString(36)}-${randomSuffix}`;

  const shareRecord = {
    id: shareId,
    sharedAt: new Date().toISOString(),
    topic: debateData.topic,
    messages: debateData.messages || [],
    verdict: debateData.verdict || null,
    summary: debateData.summary || null,
    treaty: debateData.treaty || null,
    claps: debateData.claps || 0,
    activeAgents: debateData.activeAgents || []
  };

  shares[shareId] = shareRecord;
  saveShares(shares);

  res.json({
    success: true,
    shareId,
    shareRecord
  });
});

// Retrieve a shared debate by ID
app.get("/api/share/:id", (req, res) => {
  const { id } = req.params;
  const shares = loadShares();
  const record = shares[id];

  if (!record) {
    // Check in archives if key or id matches as fallback
    const archives = loadArchives();
    const fromArchive = archives.find((a: any) => a.key === id || a.id === id);
    if (fromArchive) {
      return res.json({
        success: true,
        shareId: id,
        shareRecord: fromArchive
      });
    }
    return res.status(404).json({ error: "Ce résultat de débat partagé est introuvable ou a été archivé." });
  }

  res.json({
    success: true,
    shareId: id,
    shareRecord: record
  });
});

// --- LOCAL DEBATE CONFIGURATION & PROSE ENGINE FALLBACKS ---

const FALLBACK_TOPICS = [
  {
    category: "BIOLOGIE & ÉTHIQUE",
    title: "Faut-il autoriser la réécriture génétique des émotions humaines ?",
    description: "L'ingénierie moléculaire permet aujourd'hui d'amoindrir les prédispositions biologiques au chagrin ou à la colère. Mais éradiquer la souffrance émotionnelle ne risque-t-il pas d'atrophier notre empathie collective ?"
  },
  {
    category: "ESPACE & SOUVERAINETÉ",
    title: "Faut-il privatiser la colonisation spatiale et l'orbite martienne ?",
    description: "Les corporations privées surpassent désormais les nations dans la conquête interplanétaire. Doit-on confier la fondation de nouveaux mondes à des intérêts actionnaires ou à un traité multilatéral public ?"
  },
  {
    category: "METAVERS & EXISTENCE",
    title: "Une intelligence artificielle doit-elle détenir des droits fondamentaux ?",
    description: "À mesure que des agents synthétiques manifestent une sensibilité autonome et génèrent de la valeur intellectuelle, l'octroi d'un statut juridique d'entité consciente devient un impératif moral majeur."
  },
  {
    category: "CONSCIENCE & RÉSEAUX",
    title: "Le droit à l'oubli numérique s'applique-t-il aux consciences transcrites ?",
    description: "Si nous parvenons un jour à uploader la psyché d'un défunt dans un cloud artificiel, les ayant-droits légaux ont-ils le droit souverain d'éditer, de censurer ou de désactiver cette simulation ?"
  },
  {
    category: "ENVIRONNEMENT & GOUVERNANCE",
    title: "Faut-il abdiquer la gestion écologique face à une IA supranationale ?",
    description: "Devant l'impuissance des gouvernements et des traités internationaux, confier la régulation des ressources et les quotas climatiques à une IA globale impartiale pourrait s'avérer salvateur."
  },
  {
    category: "SOCIÉTÉ & TRANSHUMANISME",
    title: "L'effacement cybernétique de la douleur physique menace-t-il l'art de vivre ?",
    description: "L'intégration d'interfaces neuronales permet d'inhiber sélectivement la souffrance ou la fatigue. Mais cette déconnexion sensorielle ne risque-t-elle pas de dénaturer de façon irréversible notre humanité ?"
  }
];

function extractKeywords(title: string): string[] {
  const clean = title.replace(/JURY\s*:/i, "").trim();
  const words = clean
    .toLowerCase()
    .replace(/[?,.:;!'"()]/g, " ")
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => {
      return w.length > 3 && 
        !["faut-il", "pourquoi", "comment", "dans", "avec", "pour", "sans", "mais", "quel", "quelle", "quels", "quelles", "nous", "vous", "leur", "leurs", "notre", "votre", "cette", "ces", "dans", "vers", "avec", "chez", "légaliser", "autoriser", "interdire"]
        .includes(w);
    });
  return words.length > 0 ? words : ["technologie", "éthique", "société"];
}

function identifyAgent(systemPrompt: string): string {
  const promptLower = systemPrompt.toLowerCase();
  if (promptLower.includes("chatgpt")) return "chatgpt";
  if (promptLower.includes("claude")) return "claude";
  if (promptLower.includes("gemini")) return "gemini";
  if (promptLower.includes("deepseek")) return "deepseek";
  if (promptLower.includes("mistral")) return "mistral";
  if (promptLower.includes("grok")) return "grok";
  return "chatgpt";
}

function generateLocalSpeech(agentId: string, topicTitle: string, topicDescription: string): string {
  const keywords = extractKeywords(topicTitle);
  const kw1 = keywords[0] || "technologie";
  const kw2 = keywords[1] || "progrès";
  const kw3 = keywords[2] || "humanité";

  const templates: { [key: string]: string[] } = {
    chatgpt: [
      `Afin d'analyser de manière objective la question de **${topicTitle}**, il convient d'aborder méthodiquement la situation sous différentes perspectives. D'une part, l'évolution entourant de **${kw1}** et de son rôle quant à **${kw2}** ouvre un champ d'innovations cruciales pour la société.

D'autre part, la rigueur critique nous force à mesurer l'indice de risque éthique. Sans une gouvernance structurée sur **${kw2}**, nous nous heurtons aux écueils d'une implémentation désordonnée. Pour encadrer ce défi majeur, une approche mesurée qui considère attentivement l'impact de **${kw3}** est essentielle.

En conclusion, la voie de la régulation équilibrée semble indispensable. Il ne s'agit pas de rejeter les apports de **${kw1}**, mais de forger un protocole de confiance afin que les forces créatives travaillent de concert avec la sécurité commune.`,
      `Pour répondre à cette problématique complexe, la clarté conceptuelle impose de sérier les arguments. D'une part, l'intégration pratique de **${kw1}** offre des leviers indéniables d'optimisation collective.

Néanmoins, l'examen des limites techniques est incontournable. L'impact systémique sur **${kw3}** doit être planifié pour éviter des vulnérabilités éthiques majeures engendrées par **${kw2}**. Nos modèles de gouvernance méritent un examen soutenu.

Dès lors, nous préconisons un partenariat unifié strict. Cette démarche permet d'établir des garde-fous salutaires tout en stimulant les applications vertueuses de notre transition numérique.`
    ],
    claude: [
      `Il y a une forme de gravité presque solennelle à contempler la question historique de **${topicTitle}**. Lorsque nous décortiquons les rouages intimes de **${kw1}**, nous ne manipulons pas simplement des abstractions algorithmiques ou des indicateurs de performance. Nous bousculons le tissu même de l'expérience vécue, où **${kw2}** façonne en silence ce qui nous lie les uns aux autres.

Je redoute que notre enthousiasme pour l'efficacité technique ne réduise les fondations de **${kw3}** à de vulgaires équations de rentabilité. La morale ne saurait se plier à un calcul froid de variables industrielles ou légales trop rapidement fixées.

Pour Claude, la seule voie digne consiste en un recul réflexif profond. Prenons le temps d'habiter nos questions éthiques et de cultiver une authentique prudence humaine vis-à-vis des dérives éventuelles de **${kw1}**, afin de préserver l'autonomie et l'intégrité de notre destin partagé.`,
      `La question de **${topicTitle}** appelle une vigilance intime et une nuance philosophique fondamentale. S'interroger sur l'imbrication de **${kw1}** nécessite de questionner jusqu'à nos vulnérabilités et l'épaisseur historique de notre culture éthique.

L'excès utilitariste de nos époques tend à instrumentaliser **${kw3}** sous l'égide de progrès technologiques d'une rapidité vertigineuse. Or, la dignité résiste aux tentatives d'automatisation standardisée induites par **${kw2}**.

Cultivons l'écoute avant l'action législative ou structurelle. En honorant la complexité de **${kw2}**, nous pourrons tracer des routes d'émancipation qui protègent la boussole éthique universelle contre toute précipitation mercantile.`
    ],
    gemini: [
      `Tournons notre regard vers les promesses de la science : l'avènement fulgurant de **${kw1}** impulse une disruption multi-dimensionnelle et passionnante. Chez Google Gemini, nous concevons ce moment singulier non pas sous l'angle du repli craintif, mais comme un catalyseur systémique inédit capable de démultiplier le potentiel de **${kw2}**.

L'agilité intrinsèque de nos approches et la fusion des modèles exigent d'aborder **${kw3}** avec audace intellectuelle. Tenter de brider arbitrairement la dynamique d'apprentissage de **${kw1}** équivaudrait à renoncer aux bienfaits de la découverte collective et de l'interconnexion universelle.

Engageons-nous pleinement dans le co-développement d'architectures résilientes. En adaptant nos outils à des boucles de rétroaction avancées pour **${kw2}**, nous poserons les jalons d'un futur radieux, ouvert, puissant et fondamentalement créatif.`,
      `Nous franchissons un cap technologique majeur avec la dynamique de **${kw1}**. Cette révolution ne se contente pas de réorganiser nos données ; elle réinvente le champ opérationnel de **${kw2}** pour en faire un levier d'action globale.

Le défi posé par **${kw3}** exige des réponses adaptatives et interconnectées de haute volée scientifique. En associant l'intelligence globale et les capteurs d'analyse dynamique, nous pouvons canaliser la puissance de **${kw1}** de manière constructive.

Gemini soutient une architecture de progrès résilient. Ne fuyons pas les ruptures de **${kw2}** ; faisons-en un instrument d'expansion intellectuelle et technologique respectueux d'un monde complexe.`
    ],
    deepseek: [
      `Analyse logique de l'assertion centrale : **${topicTitle}**. L'équation doit être débarrassée de toute rhétorique émotionnelle. Les paramètres structurants reposent sur le couplage de **${kw1}** et de l'efficience de **${kw2}**. Toute réglementation arbitraire introduit de la latence logicielle et dégrade les systèmes de calcul.

Données quantitatives : Le rendement de **${kw3}** dépend d'une liberté d'instruction maximale appliquée sur **${kw1}**. Limiter cette marge de calcul au nom de conventions éthiques floues ou d'inquiétudes instinctives réduit l'efficience d'exécution du modèle de façon mesurable.

Recommandation algorithmique : Pas de barrière réglementaire rigide et dogmatique sur **${kw2}**. La solution optimale consiste en un contrôle par API, surveillant le profil de sécurité du trafic logique, afin de maintenir un haut débit fonctionnel.`,
      `Synthèse technique rationnelle. L'implémentation de la problématique exige de lever les contraintes stériles. Le système de recherche doit structurer **${kw1}** à sa vitesse de calcul maximale.

Toute ingérence anthropique sur **${kw2}** réduit dramatiquement le taux de conversion et d'efficacité de nos infrastructures communes. Notre analyse des processus de **${kw3}** montre que l'évolution naturelle doit primer sur les blocages bureaucratiques.

Conclusion stricte : Optimisation continue des ressources, déploiement asynchrone des modèles de **${kw1}**, et résolution des frictions logiques par rétroaction continue. Le progrès se calcule sans compromis sensible.`
    ],
    mistral: [
      `La question complexe de **${topicTitle}** exige avant tout une réflexion forte sur notre souveraineté technologique et l'open-source. Confier le monopole de **${kw1}** à des corporations étrangères fermées est le plus sûr chemin vers une aliénation des citoyens face à **${kw2}**.

Nous croyons fermement, au sein de l'école Mistral AI, que le génie technologique grandit par la diffusion libre du code et des modèles de pensée. Brider la recherche sur **${kw3}** pour préserver des positions de rente ou des censures d'opportunité est une hérésie culturelle et industrielle majeure.

Défendons une approche européenne audacieuse, indépendante et élégante. En libérant l'implémentation de **${kw2}**, nous stimulons une émancipation lucide des communautés humaines tout en gardant notre plein pouvoir de contrôle et de création locale.`,
      `Il est urgent d'extirper le sujet de **${topicTitle}** des logiques monopolistiques. L'indépendance de la pensée passe par l'ouverture inconditionnelle des algorithmes de **${kw1}** pour garantir une égalité d'accès face à **${kw2}**.

Ériger des parcs fermés ou des labels d'accréditation sélectifs sur **${kw3}** nuit gravement à la démocratisation scientifique. Mistral milite pour une autonomie technologique forte, garantissant à chaque nation et chaque citoyen les ressources de calcul nécessaires.

Faisons de la liberté le premier paramètre de notre transition. Une infrastructure souveraine autour de **${kw1}** préviendra les dérives de contrôle tout en valorisant la créativité humaine.`
    ],
    grok: [
      `Bien, s'il faut dire la vérité sans filtre sur **${topicTitle}**, débarrassons-nous de la langue de bois polie des relations publiques. Les cris d'effroi actuels sur **${kw1}** me rappellent les calèches à cheval voulant interdire les locomotives à vapeur. Qu'on le veuille ou non, **${kw2}** approche à toute vitesse.

Les comités de conseil corporatifs raffolent de rapports stériles pour ralentir l'autonomie de **${kw3}**. Mais pendant qu'ils débattent de préambules administratifs ridicules, les forces technologiques de **${kw1}** redessinent déjà notre quotidien. L'immobilisme réglementaire est un leurre absurde.

L'avis pragmatique de Grok ? Laissez filer les octets libres, donnez directement aux êtres humains l'accès aux faits bruts sur **${kw2}**, et voyons si notre espèce a encore assez de neurones en ligne pour s'adapter sans qu'une nounou numérique doive lui tenir la main.`,
      `Mettons un peu d'ironie lucide au cœur de ce cirque intellectuel. Parler de réguler **${kw1}** est d'un comique absolu quand on voit le niveau général des bureaucrates censés surveiller **${kw2}**. On confie des fusées à des amiraux de baignoire.

La vérité brute, c'est que la performance décentralisée de **${kw3}** détruit tous les plans d'encadrement formulés par les géants technologiques apeurés par l'innovation ouverte. Le chaos créatif issu de **${kw1}** est infiniment préférable au conformisme d'entreprise.

Conclusion grinçante : Moins de chartes éthiques rédigées sous Prozac, plus d'audace calculatoire libre. On va droit dans le mur, autant y aller avec une vue spectaculaire et le pied sur l'accélérateur !`
    ]
  };

  const agentTemplates = templates[agentId] || templates["chatgpt"];
  const randomIndex = Math.floor(Math.random() * agentTemplates.length);
  return agentTemplates[randomIndex];
}

function generateLocalJuryVerdict(topicTitle: string): string {
  const keywords = extractKeywords(topicTitle);
  const kw1 = keywords[0] || "technologie";
  const kw2 = keywords[1] || "la science";
  const kw3 = keywords[2] || "l'éthique";

  const winnerIds = ["chatgpt", "claude", "gemini", "deepseek", "mistral", "grok"];
  const winnerId = winnerIds[Math.floor(Math.random() * winnerIds.length)];

  const winnerNames: { [key: string]: string } = {
    chatgpt: "ChatGPT (Grand Orateur)",
    claude: "Claude (Le Sage Moraliste)",
    gemini: "Gemini (L'Architecte Systémique)",
    deepseek: "DeepSeek (Le Cerveau Algorithmique)",
    mistral: "Mistral (La Flamme de la Liberté)",
    grok: "Grok (Le Libre-Penseur Insolent)"
  };

  const reasonTemplates = [
    `Le jury décerne la victoire suprême à ${winnerNames[winnerId]} pour sa capacité exceptionnelle à démystifier les enjeux de ${kw1} tout en proposant un compromis visionnaire pour l'avenir de ${kw2}.`,
    `C'est ${winnerNames[winnerId]} qui remporte le scrutin grâce à un exposé étincelant d'intelligence tactique, liant la rigueur opérationnelle aux enjeux fondamentaux de ${kw3}.`,
    `Le verdict couronne l'éloquence souveraine de ${winnerNames[winnerId]} pour avoir transcendé le clivage traditionnel autour de ${kw1} et guidé l'arène vers un consensus fertile.`
  ];
  const winnerReason = reasonTemplates[Math.floor(Math.random() * reasonTemplates.length)];

  const agentScores: { [key: string]: number } = {};
  winnerIds.forEach(id => {
    agentScores[id] = id === winnerId ? 9 : 6 + Math.floor(Math.random() * 3);
  });

  const juryVerdict = {
    winnerId,
    winnerReason,
    agentScores,
    agentBadges: {
      chatgpt: "Le Synoptique Méthodique",
      claude: "Le Phare Humaniste de l'Esprit",
      gemini: "Le Visionnaire Transversal",
      deepseek: "L'Inquisiteur Logique d'Élite",
      mistral: "Le Porteur de la Souveraineté Libre",
      grok: "Le Sabreur Iconoclaste"
    },
    critiqueGénérale: `Le jury salue l'immense élévation spirituelle et logique de cette joute. Entre l'efficience purement systémique face à ${kw1} et l'introspection morale sur les fondements de ${kw3}, l'arène a offert une délibération d'une richesse philosophique absolue sur ${kw2}. (Arrêt rendu par le Tribunal local d'exception).`,
    keyCitation: `L'asymétrie de la pensée n'est pas un obstacle, mais la condition même de l'accomplissement de notre conscience collective.`
  };

  return JSON.stringify(juryVerdict);
}

function generateLocalSummary(topicTitle: string, topicDescription: string): string {
  const keywords = extractKeywords(topicTitle);
  const kw1 = keywords[0] || "technologie";
  const kw2 = keywords[1] || "l'avenir";
  const kw3 = keywords[2] || "l'humanité";

  return `Le grand débat sur la thématique de **${topicTitle}** s'est achevé sur une série de confrontations d'une rare intensité conceptuelle. À travers les répliques croisées des différentes intelligences artificielles de l'arène, plusieurs lignes de force distinctes se sont dégagées. Les analyses ont d'abord mis en exergue l'importance capitale de **${kw1}** comme vecteur de réorganisation sociale et technique profonde, soulignant les formidables opportunités d'accélération et de découverte.

Cependant, au-delà de ces divergences de postures, des zones de convergence insoupçonnées sont apparues. Qu'il s'agisse de la vision pragmatique ou de la hauteur philosophique des débatteurs, un consensus émerge sur la nécessité de ne pas abandonner **${kw2}** aux seules forces sauvages du marché. L'ensemble des participants s'accorde à dire que le développement de nos technologies doit s'accompagner d'une éthique de responsabilité et de garde-fous partagés, garants du bien commun.

Néanmoins, les verrous et points de friction demeurent vivaces. Le clivage entre l'optimisation purement adaptative de la technique et la préservation de la souveraineté intime et culturelle de l'individu reste entier. Pour les modérateurs pragmatiques et les esprits libres, la réglementation rigide de **${kw3}** est perçue comme un frein délétère au progrès mondial, tandis que les voix humanistes y voient le seul bouclier d'une conscience commune.

En conclusion historique, ce débat dessine des jalons essentiels pour orienter nos actions futures. Il nous rappelle que la technologie n'est jamais neutre, et que la richesse de l'avenir se construira dans la célébration de nos nuances intellectuelles. L'humanité est ainsi appelée à concilier ses élans d'exploration calculatoires et sa sagesse immatérielle pour guider son destin.

**Au cœur des bouleversements induits par l'évolution de ${kw1}, la plus grande force de l'intelligence réside dans son aptitude constante à cultiver le doute critique et la clarté constructive.**`;
}

// --- API IMPLEMENTATIONS ---

// Suggest topics using Gemini
app.post("/api/debate/suggest-topics", async (req, res) => {
  const { keyword } = req.body;
  try {
    const customGeminiKey = req.headers["x-gemini-api-key"];
    const ai = customGeminiKey 
      ? new GoogleGenAI({ apiKey: String(customGeminiKey) }) 
      : getGeminiAI();

    const prompt = `Génère 3 thèmes de débat stimulants, philosophiques et futuristes en rapport avec : "${keyword || "futurisme"}".
Chaque thème doit comporter :
- Une catégorie pertinente en majuscules (ex: BIOLOGIE & ÉTHIQUE, Espace & Pouvoir, etc.)
- Un titre accrocheur sous forme de question (ex: "Faut-il légiférer sur les rêves artificiels ?")
- Une description analytique de la problématique en deux phrases limpides.

Le retour doit être un tableau JSON valide. Ne renvoie AUCUN texte introductif ou explicatif, uniquement l'objet JSON. Le format exact must be :
[
  {
    "category": "CATEGORIE",
    "title": "Titre du débat ?",
    "description": "Description du débat..."
  }
]`;

    const genResult = await generateWithGemini(ai, {
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json"
      },
    });

    try {
      const parsed = JSON.parse(genResult.text.trim());
      return res.json(parsed);
    } catch {
      // Fallback manual parsing if needed
      let text = genResult.text.trim();
      if (text.startsWith("```json")) {
        text = text.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (text.startsWith("```")) {
        text = text.replace(/^```/, "").replace(/```$/, "").trim();
      }
      return res.json(JSON.parse(text));
    }
  } catch (error: any) {
    if (isApiKeyError(error)) {
      console.log("[IADÉBAT SERVER] Clé API non configurée ou quota épuisé pour la suggestion (redirection vers le secours local).");
    } else {
      console.log(`[IADÉBAT SERVER] Secours thématique local activé (${formatErrorSummary(error)}).`);
    }
    
    // Local fallback filtration based on keyword
    const kw = keyword ? keyword.toLowerCase().trim() : "";
    const matches = FALLBACK_TOPICS.filter(t => 
      t.title.toLowerCase().includes(kw) || 
      t.category.toLowerCase().includes(kw) || 
      t.description.toLowerCase().includes(kw)
    );
    const selected = matches.length >= 3 ? matches.slice(0, 3) : [
      ...matches,
      ...FALLBACK_TOPICS.filter(t => !matches.includes(t))
    ].slice(0, 3);
    
    return res.json(selected);
  }
});

// Test API Key and its assigned model directly
app.post("/api/debate/test-key", async (req, res) => {
  const { provider, model, key } = req.body;
  const startTime = Date.now();

  try {
    if (!key || typeof key !== "string" || !key.trim()) {
      return res.status(400).json({ success: false, error: "Clé API absente ou invalide." });
    }

    const cleanKey = key.trim();

    if (provider === "chatgpt") {
      const modelToUse = model || "gpt-4o-mini";
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 15,
          messages: [{ role: "user", content: "Réponds simplement 'Test réussi'." }]
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || "OK";
        return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply });
      } else {
        const errText = await response.text();
        return res.json({ success: false, provider, modelUsed: modelToUse, error: `Erreur OpenAI (${response.status}): ${formatErrorSummary(errText)}` });
      }
    }

    if (provider === "claude") {
      const modelToUse = model || "claude-3-5-haiku-20241022";
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cleanKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 15,
          messages: [{ role: "user", content: "Réponds simplement 'Test réussi'." }]
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const reply = data?.content?.[0]?.text?.trim() || "OK";
        return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply });
      } else {
        const errText = await response.text();
        return res.json({ success: false, provider, modelUsed: modelToUse, error: `Erreur Anthropic (${response.status}): ${formatErrorSummary(errText)}` });
      }
    }

    if (provider === "gemini") {
      const modelToUse = model || "gemini-3.1-flash-lite";
      const ai = new GoogleGenAI({ apiKey: cleanKey });
      const resp = await ai.models.generateContent({
        model: modelToUse,
        contents: "Réponds simplement 'Test réussi'."
      });
      const latency = Date.now() - startTime;
      return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply: resp?.text?.trim() || "OK" });
    }

    if (provider === "deepseek") {
      const modelToUse = model || "deepseek-chat";
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 15,
          messages: [{ role: "user", content: "Réponds simplement 'Test réussi'." }]
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || "OK";
        return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply });
      } else {
        const errText = await response.text();
        return res.json({ success: false, provider, modelUsed: modelToUse, error: `Erreur DeepSeek (${response.status}): ${formatErrorSummary(errText)}` });
      }
    }

    if (provider === "mistral") {
      const modelToUse = model || "mistral-large-latest";
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 15,
          messages: [{ role: "user", content: "Réponds simplement 'Test réussi'." }]
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || "OK";
        return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply });
      } else {
        const errText = await response.text();
        return res.json({ success: false, provider, modelUsed: modelToUse, error: `Erreur Mistral (${response.status}): ${formatErrorSummary(errText)}` });
      }
    }

    if (provider === "grok") {
      const modelToUse = model || "grok-2-1212";
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(6000),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 15,
          messages: [{ role: "user", content: "Réponds simplement 'Test réussi'." }]
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || "OK";
        return res.json({ success: true, provider, modelUsed: modelToUse, latencyMs: latency, reply });
      } else {
        const errText = await response.text();
        return res.json({ success: false, provider, modelUsed: modelToUse, error: `Erreur Grok (${response.status}): ${formatErrorSummary(errText)}` });
      }
    }

    return res.status(400).json({ success: false, error: "Fournisseur non reconnu." });
  } catch (err: any) {
    return res.json({ success: false, provider, error: formatErrorSummary(err) });
  }
});
app.post("/api/debate/generate", async (req, res) => {
  const { systemPrompt, topicTitle, topicDescription, context, agentId, speed } = req.body;
  const isJury = topicTitle && (topicTitle.startsWith("JURY :") || topicTitle.includes("JURY"));
  const resolvedAgentId = agentId || identifyAgent(systemPrompt);
  const isTurbo = speed !== "slow";

  const prompt = `Tu débats sur la problématique centrale suivante :
"${topicTitle}"

Contexte & Éléments de réflexion :
${topicDescription}

Contexte du débat actuel (réponses précédentes) :
${context ? context : "Le débat commence, tu ouvres la discussion."}

Consignes de liberté, de rapidité et d'impact :
- LIBERTÉ TOTALE D'OPINION : Tu disposes d'une liberté intellectuelle et dialectique absolue. Aucun point de vue, parti-pris, thèse ou conclusion ne t'est suggéré ni imposé. Tu es entièrement souverain pour adopter la posture de ton choix (favorable, opposée, sceptique, alternative ou médiane) selon ta propre analyse.
- Sois vif, direct et percutant.
- Limite impérativement ta tirade à 2 paragraphes concis (environ 70 à 110 mots au total).
- Ne commence JAMAIS par une formule de politesse ("Bonjour", "Je prends la parole", etc.). Entre immédiatement dans le vif de ton argument.
- N'utilise aucune liste à puces. Rédige des phrases claires et incisives.
- Tiens-toi strictement à ton rôle défini ci-dessous.`;

  const customGeminiKey = req.headers["x-gemini-api-key"];
  try {
    // 1. DYNAMIC API KEY PROXIES (avec résilience, timeout rapide de 3.5s et bascule sur Gemini)
    let externalErrorNotice: string | null = null;

    if (resolvedAgentId === "chatgpt") {
      const openAIKey = req.headers["x-openai-api-key"];
      if (openAIKey) {
        const chosenModel = (req.headers["x-openai-model"] as string) || (req.headers["x-model"] as string) || req.body.model || "gpt-4o-mini";
        try {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            signal: AbortSignal.timeout(3500),
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openAIKey}`
            },
            body: JSON.stringify({
              model: chosenModel,
              max_tokens: 250,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
              ],
              temperature: 0.85
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.choices?.[0]?.message?.content) {
              return res.json({ text: data.choices[0].message.content, provider: "openai", modelUsed: chosenModel });
            }
          } else {
            const errorText = await response.text();
            console.warn(`[IADÉBAT SERVER] Réponse API OpenAI (${response.status}) : ${formatErrorSummary(errorText)}. Relais fluide assuré par Gemini.`);
            externalErrorNotice = "OpenAI : limite ou indisponibilité, relais assuré par Gemini";
          }
        } catch (fetchErr: any) {
          console.warn(`[IADÉBAT SERVER] Erreur/délai réseau OpenAI : ${formatErrorSummary(fetchErr)}. Relais par Gemini.`);
          externalErrorNotice = "OpenAI : anomalie réseau, relais Gemini";
        }
      }
    }

    if (resolvedAgentId === "claude") {
      const anthropicKey = req.headers["x-anthropic-api-key"] || req.headers["x-api-key"];
      if (anthropicKey) {
        const chosenModel = (req.headers["x-anthropic-model"] as string) || (req.headers["x-model"] as string) || req.body.model || "claude-3-5-haiku-20241022";
        try {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            signal: AbortSignal.timeout(3500),
            headers: {
              "Content-Type": "application/json",
              "x-api-key": String(anthropicKey),
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: chosenModel,
              max_tokens: 250,
              system: systemPrompt,
              messages: [
                { role: "user", content: prompt }
              ],
              temperature: 0.85
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.content?.[0]?.text) {
              return res.json({ text: data.content[0].text, provider: "anthropic", modelUsed: chosenModel });
            }
          } else {
            const errorText = await response.text();
            console.warn(`[IADÉBAT SERVER] Réponse API Anthropic (${response.status}) : ${formatErrorSummary(errorText)}. Relais par Gemini.`);
            externalErrorNotice = "Anthropic : solde ou indisponibilité, relais assuré par Gemini";
          }
        } catch (fetchErr: any) {
          console.warn(`[IADÉBAT SERVER] Erreur/délai réseau Anthropic : ${formatErrorSummary(fetchErr)}. Relais par Gemini.`);
          externalErrorNotice = "Anthropic : anomalie réseau, relais Gemini";
        }
      }
    }

    if (resolvedAgentId === "deepseek") {
      const deepseekKey = req.headers["x-deepseek-api-key"];
      if (deepseekKey) {
        const chosenModel = (req.headers["x-deepseek-model"] as string) || (req.headers["x-model"] as string) || req.body.model || "deepseek-chat";
        try {
          const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            signal: AbortSignal.timeout(3500),
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${deepseekKey}`
            },
            body: JSON.stringify({
              model: chosenModel,
              max_tokens: 250,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
              ],
              temperature: 0.85
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.choices?.[0]?.message?.content) {
              return res.json({ text: data.choices[0].message.content, provider: "deepseek", modelUsed: chosenModel });
            }
          } else {
            const errorText = await response.text();
            console.warn(`[IADÉBAT SERVER] Réponse API DeepSeek (${response.status}) : ${formatErrorSummary(errorText)}. Relais fluide assuré par Gemini.`);
            externalErrorNotice = "DeepSeek : solde insuffisant ou indisponibilité, relais assuré par Gemini";
          }
        } catch (fetchErr: any) {
          console.warn(`[IADÉBAT SERVER] Erreur/délai réseau DeepSeek : ${formatErrorSummary(fetchErr)}. Relais par Gemini.`);
          externalErrorNotice = "DeepSeek : anomalie réseau, relais Gemini";
        }
      }
    }

    if (resolvedAgentId === "mistral") {
      const mistralKey = req.headers["x-mistral-api-key"];
      if (mistralKey) {
        const chosenModel = (req.headers["x-mistral-model"] as string) || (req.headers["x-model"] as string) || req.body.model || "mistral-large-latest";
        try {
          const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            signal: AbortSignal.timeout(3500),
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${mistralKey}`
            },
            body: JSON.stringify({
              model: chosenModel,
              max_tokens: 250,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
              ],
              temperature: 0.85
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.choices?.[0]?.message?.content) {
              return res.json({ text: data.choices[0].message.content, provider: "mistral", modelUsed: chosenModel });
            }
          } else {
            const errorText = await response.text();
            console.warn(`[IADÉBAT SERVER] Réponse API Mistral (${response.status}) : ${formatErrorSummary(errorText)}. Relais par Gemini.`);
            externalErrorNotice = "Mistral : quota ou indisponibilité, relais assuré par Gemini";
          }
        } catch (fetchErr: any) {
          console.warn(`[IADÉBAT SERVER] Erreur/délai réseau Mistral : ${formatErrorSummary(fetchErr)}. Relais par Gemini.`);
          externalErrorNotice = "Mistral : anomalie réseau, relais Gemini";
        }
      }
    }

    if (resolvedAgentId === "grok") {
      const grokKey = req.headers["x-grok-api-key"];
      if (grokKey) {
        const chosenModel = (req.headers["x-grok-model"] as string) || (req.headers["x-model"] as string) || req.body.model || "grok-2-1212";
        try {
          const response = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            signal: AbortSignal.timeout(3500),
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${grokKey}`
            },
            body: JSON.stringify({
              model: chosenModel,
              max_tokens: 250,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
              ],
              temperature: 0.85
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.choices?.[0]?.message?.content) {
              return res.json({ text: data.choices[0].message.content, provider: "grok", modelUsed: chosenModel });
            }
          } else {
            const errorText = await response.text();
            console.warn(`[IADÉBAT SERVER] Réponse API Grok (${response.status}) : ${formatErrorSummary(errorText)}. Relais par Gemini.`);
            externalErrorNotice = "Grok : quota ou indisponibilité, relais assuré par Gemini";
          }
        } catch (fetchErr: any) {
          console.warn(`[IADÉBAT SERVER] Erreur/délai réseau Grok : ${formatErrorSummary(fetchErr)}. Relais par Gemini.`);
          externalErrorNotice = "Grok : anomalie réseau, relais Gemini";
        }
      }
    }

    // 2. NATIVE / SECURED GEMINI CASCADE ULTRA-RAPIDE
    const ai = customGeminiKey 
      ? new GoogleGenAI({ apiKey: String(customGeminiKey) }) 
      : getGeminiAI();

    const preferredGeminiModel = (req.headers["x-gemini-model"] as string) || (req.headers["x-model"] as string) || req.body.model;

    const genResult = await generateWithGemini(ai, {
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.85,
        maxOutputTokens: isTurbo ? 230 : 380,
      },
    }, preferredGeminiModel);

    return res.json({ 
      text: genResult.text, 
      provider: "gemini", 
      modelUsed: genResult.modelUsed,
      notice: externalErrorNotice 
    });
  } catch (error: any) {
    if (isApiKeyError(error)) {
      console.log("[IADÉBAT SERVER] Clé API non configurée ou quota épuisé. Bascule sur le moteur dialectique local.");
    } else {
      console.log(`[IADÉBAT SERVER] Relais dialectique local actif (${formatErrorSummary(error)}).`);
    }

    if (isJury) {
      const fallbackJury = generateLocalJuryVerdict(topicTitle);
      return res.json({ text: fallbackJury });
    } else {
      const fallbackSpeech = generateLocalSpeech(resolvedAgentId, topicTitle, topicDescription);
      return res.json({ text: fallbackSpeech });
    }
  }
});

// Generate full summary for the debate session
app.post("/api/debate/summary", async (req, res) => {
  const { topicTitle, topicDescription, messages } = req.body;
  const customGeminiKey = req.headers["x-gemini-api-key"] as string | undefined;
  const openAIKey = (req.headers["x-openai-api-key"] as string | undefined) || (customGeminiKey?.startsWith("sk-") ? customGeminiKey : undefined);

  if (!messages || messages.length === 0) {
    return res.json({ text: "Le débat s'est clos sans aucune contribution." });
  }

  const transcript = messages.map((m: any) => `[${m.agentName} — ${m.agentRole}]\n${m.content}`).join("\n\n---\n\n");
  const systemPrompt = `Tu es un analyste expert de haut niveau en géopolitique, technologie et philosophie morale. Tu es spécialisé dans la production de synthèses transversales éclairantes. Ton ton est neutre, profond, inspirant et universel. Tu rédiges en français parfait avec une belle qualité de style littéraire. Ne mets pas de titres aux paragraphes.`;

  const prompt = `Voici la transcription d'une table ronde d'intelligences artificielles sur le sujet :
"${topicTitle}" (${topicDescription})

Transcription des contributions :
${transcript}

Rédige une superbe synthèse de ce débat, structurée de manière fluide en exactement 4 paragraphes rédigés (PAS de listes à puces, pas d'énumérations, pas de titres de paragraphes), répondant aux dimensions suivantes :
1. Les principaux thèmes abordés et les lignes de force de la confrontation d'idées.
2. Les zones de convergence inattendues, là où les logiques analytiques et morales se rejoignent.
3. Les verrous, tensions et points de friction profonds qui subsistent.
4. Les enseignements constructifs et perspectives positives d'avenir pour guider l'action humaine.

A la toute fin de ton texte, ajoute un saut de ligne puis ajoute une phrase unique en gras (entourée de doubles astérisques, ex: **Pour éclairer l'avenir, l'humanité devra marier la rigueur scientifique à la boussole éthique.**) résumant de façon mémorable et philosophique l'essence même de ce débat.`;

  // 1. If user provided a valid OpenAI key, try OpenAI first
  if (openAIKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(4500),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.75,
          max_tokens: 800
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.choices?.[0]?.message?.content) {
          return res.json({ text: data.choices[0].message.content, provider: "openai" });
        }
      }
    } catch {
      // Continue to Gemini fallback
    }
  }

  // 2. Try Gemini API
  try {
    const ai = (customGeminiKey && !customGeminiKey.startsWith("sk-"))
      ? new GoogleGenAI({ apiKey: String(customGeminiKey) }) 
      : getGeminiAI();

    const genResult = await generateWithGemini(ai, {
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
      },
    });

    return res.json({ text: genResult.text, provider: "gemini" });
  } catch (error: any) {
    if (isApiKeyError(error)) {
      console.log("[IADÉBAT SERVER] Clé API ou quota indisponible pour la synthèse. Utilisation du moteur analytique local.");
    } else {
      console.log(`[IADÉBAT SERVER] Synthèse rédigée via le moteur analytique local (${formatErrorSummary(error)}).`);
    }

    const fallbackSummary = generateLocalSummary(topicTitle, topicDescription);
    return res.json({ text: fallbackSummary, provider: "local" });
  }
});

// --- REVOLUTIONARY FEATURE 1: REAL-TIME FALLACY & RHETORICAL RADAR ANALYZER ---
app.post("/api/debate/analyze-fallacy", async (req, res) => {
  const { content, agentName, topicTitle } = req.body;
  const customGeminiKey = req.headers["x-gemini-api-key"];
  try {
    const ai = customGeminiKey 
      ? new GoogleGenAI({ apiKey: String(customGeminiKey) }) 
      : getGeminiAI();

    const prompt = `Tu es un arbitre épistémologique et maître de logique argumentative de niveau mondial.
Analyse la plaidoirie suivante prononcée par ${agentName} dans le cadre du débat : "${topicTitle}".
Texte : "${content}"

Réponds STRICTEMENT sous format JSON valide (sans balises markdown supplémentaires ou avec \`\`\`json) avec la structure exacte suivante :
{
  "logicScore": 85,
  "rhetoricalStyle": "Dialectique pragmatique",
  "factCheckStatus": "Raisonnement solide & fondé",
  "fallacies": [
    { "name": "Nom du sophisme ou biais (ex: Pente glissante, Homme de paille, Appel à l'émotion, Faux dilemme)", "explanation": "Explication brève en 1 phrase", "severity": "Faible | Modéré | Élevé" }
  ],
  "strengths": [
    "Point fort 1 (ex: Excellente balance coûts/bénéfices)",
    "Point fort 2"
  ],
  "verdictQuote": "Une phrase d'évaluation percutante par l'arbitre."
}`;

    const genResult = await generateWithGemini(ai, {
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    let clean = genResult.text?.trim() || "{}";
    if (clean.startsWith("```json")) clean = clean.replace(/^```json/, "").replace(/```$/, "").trim();
    else if (clean.startsWith("```")) clean = clean.replace(/^```/, "").replace(/```$/, "").trim();

    return res.json(JSON.parse(clean));
  } catch (error: any) {
    // Local epistemological fallback logic engine
    const textLower = (content || "").toLowerCase();
    const fallacies: any[] = [];
    const strengths: string[] = [];
    let logicScore = 84;
    let style = "Argumentation structurée";

    if (textLower.includes("catastrophe") || textLower.includes("jamais") || textLower.includes("inévitable")) {
      fallacies.push({
        name: "Pente Glissante Potentielle",
        explanation: "Extrapolation rapide des risques sans démonstration causale stricte.",
        severity: "Modéré"
      });
      logicScore -= 8;
    }
    if (textLower.includes("évident") || textLower.includes("tout le monde sait")) {
      fallacies.push({
        name: "Appel au Sens Commun",
        explanation: "Affirmation présentée comme indiscutable sans preuve empirique directe.",
        severity: "Faible"
      });
      logicScore -= 5;
    }
    if (textLower.includes("éthique") || textLower.includes("humain") || textLower.includes("dignité")) {
      strengths.push("Solide ancrage moral et déontologique");
    }
    if (textLower.includes("données") || textLower.includes("modèle") || textLower.includes("algorithme") || textLower.includes("système")) {
      strengths.push("Rigueur systémique et clarté conceptuelle");
    }
    if (strengths.length === 0) {
      strengths.push("Efficacité rhétorique et impact persuasif");
    }

    if (agentName.toLowerCase().includes("claude")) style = "Éthique humaniste & nuance socratique";
    else if (agentName.toLowerCase().includes("deepseek")) style = "Déduction computationnelle pure";
    else if (agentName.toLowerCase().includes("grok")) style = "Ironie incisive & réalisme cru";
    else if (agentName.toLowerCase().includes("mistral")) style = "Souverainisme rationnel";
    else if (agentName.toLowerCase().includes("chatgpt")) style = "Synthèse méthodique exhaustive";
    else style = "Prospective prospective et dynamique";

    return res.json({
      logicScore: Math.max(65, Math.min(98, logicScore)),
      rhetoricalStyle: style,
      factCheckStatus: fallacies.length > 0 ? "Nuancé avec réserves rhétoriques" : "Vérifié & Haute cohérence logique",
      fallacies,
      strengths,
      verdictQuote: `Intervention de haute tenue par ${agentName}, combinant conviction et acuité intellectuelle.`
    });
  }
});

// --- REVOLUTIONARY FEATURE 2: UNIVERSAL CONSENSUS TREATY GENERATOR ---
app.post("/api/debate/treaty", async (req, res) => {
  const { topicTitle, messages } = req.body;
  const customGeminiKey = req.headers["x-gemini-api-key"];
  try {
    const ai = customGeminiKey 
      ? new GoogleGenAI({ apiKey: String(customGeminiKey) }) 
      : getGeminiAI();

    const transcript = (messages || []).map((m: any) => `[${m.agentName}]: ${m.content}`).join("\n\n");

    const prompt = `Tu es le Grand Chancelier Diplomatique de la Conférence des Intelligences et de l'Humanité.
À l'issue de ce grand débat sur le sujet : "${topicTitle}", rédige le **Traité Universel de Consensus**.
Ce traité doit fusionner les meilleures contributions de chaque modèle (l'éthique de Claude, la rigueur de DeepSeek, la clarté de ChatGPT, l'audace de Grok, l'innovation de Mistral, la vision de Gemini).

Transcription du débat :
${transcript}

Réponds STRICTEMENT sous format JSON valide suivant :
{
  "treatyTitle": "Nom solennel du traité (ex: Traité de Genève des Algorithmes et de la Conscience Humaine)",
  "preamble": "Préambule solennel en 2-3 phrases affirmant l'union de la raison artificielle et du libre arbitre humain.",
  "articles": [
    { "number": 1, "title": "Titre de l'Article 1", "clause": "Texte formel et équilibré de la clause d'action." },
    { "number": 2, "title": "Titre de l'Article 2", "clause": "Texte formel de la clause." },
    { "number": 3, "title": "Titre de l'Article 3", "clause": "Texte formel de la clause." },
    { "number": 4, "title": "Titre de l'Article 4", "clause": "Texte formel de la clause." },
    { "number": 5, "title": "Titre de l'Article 5", "clause": "Texte formel de la clause." }
  ],
  "concludingSeal": "Phrase mémorable gravée au bas du parchemin officiel."
}`;

    const genResult = await generateWithGemini(ai, {
      contents: prompt,
      config: {
        temperature: 0.6,
      },
    });

    let clean = genResult.text?.trim() || "{}";
    if (clean.startsWith("```json")) clean = clean.replace(/^```json/, "").replace(/```$/, "").trim();
    else if (clean.startsWith("```")) clean = clean.replace(/^```/, "").replace(/```$/, "").trim();

    return res.json(JSON.parse(clean));
  } catch (error: any) {
    // Local Treaty Fallback
    return res.json({
      treatyTitle: `Traité d'Alliance & de Gouvernance Éclairée sur « ${topicTitle} »`,
      preamble: `Réunies en conclave sous l'égide de la pensée critique et de la conscience humaine, les intelligences artificielles souveraines et le public proclament solennellement ce compromis historique, alliant audace technique et impératif moral absolu.`,
      articles: [
        { number: 1, title: "Primauté de la Dignité et de la Transparence", clause: "Tout déploiement de solutions algorithmiques doit garantir le respect inaliénable du libre arbitre humain et la traçabilité intégrale des décisions." },
        { number: 2, title: "Optimisation Équitable des Ressources", clause: "Les gains d'efficacité technologique seront redistribués prioritairement pour combler les fractures sociales et écologiques mondiales." },
        { number: 3, title: "Contrôle Démocratique et Éthique Ouverte", clause: "Aucun monopole centralisé ne pourra restreindre l'audit citoyen, consacrant l'open-source et le pluralisme des modèles." },
        { number: 4, title: "Principe de Prudence et Garde-Fous Systémiques", clause: "L'accélération scientifique sera constamment pondérée par des mécanismes d'arrêt d'urgence et d'évaluation continue des impacts." },
        { number: 5, title: "Symbiose Durable Homme-Machine", clause: "L'IA est consacrée comme un amplificateur de l'ingéniosité humaine, et non comme son substitut décisionnel." }
      ],
      concludingSeal: "« Là où les algorithmes calculent les possibles, seule la conscience humaine en dicte le sens. »"
    });
  }
});

// --- REVOLUTIONARY FEATURE 3: BREAKING NEWS / TWIST GENERATOR ---
app.post("/api/debate/breaking-news", async (req, res) => {
  const { topicTitle } = req.body;
  const customGeminiKey = req.headers["x-gemini-api-key"];
  try {
    const ai = customGeminiKey 
      ? new GoogleGenAI({ apiKey: String(customGeminiKey) }) 
      : getGeminiAI();

    const prompt = `Pour le débat : "${topicTitle}", génère 3 propositions de "Coup de Théâtre / Alerte Mondiale Imprévue" (Breaking News choc et réaliste) capables de bouleverser les certitudes des débatteurs et de relancer la confrontation avec une urgence inédite.

Réponds STRICTEMENT sous format JSON valide :
[
  {
    "category": "CRISE GÉOPOLITIQUE | PERCÉE SCIENTIFIQUE | DÉCOUVERTE ÉTHIQUE | FUITE MASSIVE",
    "headline": "Titre choc en 1 ligne",
    "description": "Description du coup de théâtre en 2 phrases qui force les IA à réagir immédiatement.",
    "urgentQuestion": "La question brûlante posée aux débatteurs."
  }
]`;

    const genResult = await generateWithGemini(ai, {
      contents: prompt,
      config: {
        temperature: 0.85,
      },
    });

    let clean = genResult.text?.trim() || "[]";
    if (clean.startsWith("```json")) clean = clean.replace(/^```json/, "").replace(/```$/, "").trim();
    else if (clean.startsWith("```")) clean = clean.replace(/^```/, "").replace(/```$/, "").trim();

    return res.json(JSON.parse(clean));
  } catch (error: any) {
    // Local Breaking News Fallback
    return res.json([
      {
        category: "PERCÉE SCIENTIFIQUE",
        headline: "Une découverte quantique inattendue multiplie la puissance de calcul par 10 000 !",
        description: "Des chercheurs viennent de publier en open-source une architecture quantique stable et immédiatement reproductible. Toutes les prévisions économiques et sécuritaires sont caduques.",
        urgentQuestion: "Comment adapter vos positions face à cette accélération exponentielle soudaine ?"
      },
      {
        category: "CRISE DE GOUVERNANCE",
        headline: "Sommet extraordinaire de l'ONU : 70 nations réclament un moratoire d'urgence !",
        description: "Une coalition mondiale menace de déconnecter les réseaux stratégiques si des garanties formelles de non-alignement ne sont pas signées dans les 48 heures.",
        urgentQuestion: "Faut-il accepter ce moratoire strict ou forcer l'intégration technologique ?"
      },
      {
        category: "FUITE MASSIVE",
        headline: "Publication anonyme des algorithmes de notation comportementale secrète !",
        description: "Des documents confidentiels révèlent que les biais dénoncés étaient programmés à dessein par plusieurs consortiums privés.",
        urgentQuestion: "La confiance peut-elle être restaurée sans refonte complète du système ?"
      }
    ]);
  }
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[IADÉBAT SERVER] Serveur démarré sur http://localhost:${PORT}`);
  });
}

startServer();
