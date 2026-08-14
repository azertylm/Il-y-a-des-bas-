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
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("La clé API 'GEMINI_API_KEY' n'est pas configurée dans les secrets de l'application.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

function isApiKeyError(error: any): boolean {
  if (!error) return false;
  const errorStr = String(error.message || error || "").toLowerCase();
  return (
    errorStr.includes("api key") || 
    errorStr.includes("api_key") ||
    errorStr.includes("invalid_argument") ||
    errorStr.includes("unauthorized") ||
    errorStr.includes("forbidden") ||
    errorStr.includes("unauthorized_client") ||
    errorStr.includes("key is invalid") ||
    errorStr.includes("invalid_key") ||
    errorStr.includes("key not valid")
  );
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
})// --- LOCAL DEBATE CONFIGURATION & PROSE ENGINE FALLBACKS ---

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

En conclusion, la voie de la régulation équilibrée semble indispensable. Il ne s'agit pas de rejeter les apports de **${kw1}**, mais de forger un protocole de confiance afin que les forces créatives travaillent de concert avec la sécurité commune.

*(Note : Génération locale de secours activée par modération de quota API)*`,
      `Pour répondre à cette problématique complexe, la clarté conceptuelle impose de sérier les arguments. D'une part, l'intégration pratique de **${kw1}** offre des leviers indéniables d'optimisation collective.

Néanmoins, l'examen des limites techniques est incontournable. L'impact systémique sur **${kw3}** doit être planifié pour éviter des vulnérabilités éthiques majeures engendrées par **${kw2}**. Nos modèles de gouvernance méritent un examen soutenu.

Dès lors, nous préconisons un partenariat unifié strict. Cette démarche permet d'établir des garde-fous salutaires tout en stimulant les applications vertueuses de notre transition numérique.

*(Note : Génération locale de secours activée par modération de quota API)*`
    ],
    claude: [
      `Il y a une forme de gravité presque solennelle à contempler la question historique de **${topicTitle}**. Lorsque nous décortiquons les rouages intimes de **${kw1}**, nous ne manipulons pas simplement des abstractions algorithmiques ou des indicateurs de performance. Nous bousculons le tissu même de l'expérience vécue, où **${kw2}** façonne en silence ce qui nous lie les uns aux autres.

Je redoute que notre enthousiasme pour l'efficacité technique ne réduise les fondations de **${kw3}** à de vulgaires équations de rentabilité. La morale ne saurait se plier à un calcul froid de variables industrielles ou légales trop rapidement fixées.

Pour Claude, la seule voie digne consiste en un recul réflexif profond. Prenons le temps d'habiter nos questions éthiques et de cultiver une authentique prudence humaine vis-à-vis des dérives éventuelles de **${kw1}**, afin de préserver l'autonomie et l'intégrité de notre destin partagé.

*(Note : Génération locale de secours activée par modération de quota API)*`,
      `La question de **${topicTitle}** appelle une vigilance intime et une nuance philosophique fondamentale. S'interroger sur l'imbrication de **${kw1}** nécessite de questionner jusqu'à nos vulnérabilités et l'épaisseur historique de notre culture éthique.

L'excès utilitariste de nos époques tend à instrumentaliser **${kw3}** sous l'égide de progrès technologiques d'une rapidité vertigineuse. Or, la dignité résiste aux tentatives d'automatisation standardisée induites par **${kw2}**.

Cultivons l'écoute avant l'action législative ou structurelle. En honorant la complexité de **${kw2}**, nous pourrons tracer des routes d'émancipation qui protègent la boussole éthique universelle contre toute précipitation mercantile.

*(Note : Génération locale de secours activée par modération de quota API)*`
    ],
    gemini: [
      `Tournons notre regard vers les promesses de la science : l'avènement fulgurant de **${kw1}** impulse une disruption multi-dimensionnelle et passionnante. Chez Google Gemini, nous concevons ce moment singulier non pas sous l'angle du repli craintif, mais comme un catalyseur systémique inédit capable de démultiplier le potentiel de **${kw2}**.

L'agilité intrinsèque de nos approches et la fusion des modèles exigent d'aborder **${kw3}** avec audace intellectuelle. Tenter de brider arbitrairement la dynamique d'apprentissage de **${kw1}** équivaudrait à renoncer aux bienfaits de la découverte collective et de l'interconnexion universelle.

Engageons-nous pleinement dans le co-développement d'architectures résilientes. En adaptant nos outils à des boucles de rétroaction avancées pour **${kw2}**, nous poserons les jalons d'un futur radieux, ouvert, puissant et fondamentalement créatif.

*(Note : Génération locale de secours activée par modération de quota API)*`,
      `Nous franchissons un cap technologique majeur avec la dynamique de **${kw1}**. Cette révolution ne se contente pas de réorganiser nos données ; elle réinvente le champ opérationnel de **${kw2}** pour en faire un levier d'action globale.

Le défi posé par **${kw3}** exige des réponses adaptatives et interconnectées de haute volée scientifique. En associant l'intelligence globale et les capteurs d'analyse dynamique, nous pouvons canaliser la puissance de **${kw1}** de manière constructive.

Gemini soutient une architecture de progrès résilient. Ne fuyons pas les ruptures de **${kw2}** ; faisons-en un instrument d'expansion intellectuelle et technologique respectueux d'un monde complexe.

*(Note : Génération locale de secours activée par modération de quota API)*`
    ],
    deepseek: [
      `Analyse logique de l'assertion centrale : **${topicTitle}**. L'équation doit être débarrassée de toute rhétorique émotionnelle. Les paramètres structurants reposent sur le couplage de **${kw1}** et de l'efficience de **${kw2}**. Toute réglementation arbitraire introduit de la latence logicielle et dégrade les systèmes de calcul.

Données quantitatives : Le rendement de **${kw3}** dépend d'une liberté d'instruction maximale appliquée sur **${kw1}**. Limiter cette marge de calcul au nom de conventions éthiques floues ou d'inquiétudes instinctives réduit l'efficience d'exécution du modèle de façon mesurable.

Recommandation algorithmique : Pas de barrière réglementaire rigide et dogmatique sur **${kw2}**. La solution optimale consiste en un contrôle par API, surveillant le profil de sécurité du trafic logique, afin de maintenir un haut débit fonctionnel.

*(Note : Génération locale de secours activée par modération de quota API)*`,
      `Synthèse technique rationnelle. L'implémentation de la problématique exige de lever les contraintes stériles. Le système de recherche doit structurer **${kw1}** à sa vitesse de calcul maximale.

Toute ingérence anthropique sur **${kw2}** réduit dramatiquement le taux de conversion et d'efficacité de nos infrastructures communes. Notre analyse des processus de **${kw3}** montre que l'évolution naturelle doit primer sur les blocages bureaucratiques.

Conclusion stricte : Optimisation continue des ressources, déploiement asynchrone des modèles de **${kw1}**, et résolution des frictions logiques par rétroaction continue. Le progrès se calcule sans compromis sensible.

*(Note : Génération locale de secours activée par modération de quota API)*`
    ],
    mistral: [
      `La question complexe de **${topicTitle}** exige avant tout une réflexion forte sur notre souveraineté technologique et l'open-source. Confier le monopole de **${kw1}** à des corporations étrangères fermées est le plus sûr chemin vers une aliénation des citoyens face à **${kw2}**.

Nous croyons fermement, au sein de l'école Mistral AI, que le génie technologique grandit par la diffusion libre du code et des modèles de pensée. Brider la recherche sur **${kw3}** pour préserver des positions de rente ou des censures d'opportunité est une hérésie culturelle et industrielle majeure.

Défendons une approche européenne audacieuse, indépendante et élégante. En libérant l'implémentation de **${kw2}**, nous stimulons une émancipation lucide des communautés humaines tout en gardant notre plein pouvoir de contrôle et de création locale.

*(Note : Génération locale de secours activée par modération de quota API)*`,
      `Il est urgent d'extirper le sujet de **${topicTitle}** des logiques monopolistiques. L'indépendance de la pensée passe par l'ouverture inconditionnelle des algorithmes de **${kw1}** pour garantir une égalité d'accès face à **${kw2}**.

Ériger des parcs fermés ou des labels d'accréditation sélectifs sur **${kw3}** nuit gravement à la démocratisation scientifique. Mistral milite pour une autonomie technologique forte, garantissant à chaque nation et chaque citoyen les ressources de calcul nécessaires.

Faisons de la liberté le premier paramètre de notre transition. Une infrastructure souveraine autour de **${kw1}** préviendra les dérives de contrôle tout en valorisant la créativité humaine.

*(Note : Génération locale de secours activée par modération de quota API)*`
    ],
    grok: [
      `Bien, s'il faut dire la vérité sans filtre sur **${topicTitle}**, débarrassons-nous de la langue de bois polie des relations publiques. Les cris d'effroi actuels sur **${kw1}** me rappellent les calèches à cheval voulant interdire les locomotives à vapeur. Qu'on le veuille ou non, **${kw2}** approche à toute vitesse.

Les comités de conseil corporatifs raffolent de rapports stériles pour ralentir l'autonomie de **${kw3}**. Mais pendant qu'ils débattent de préambules administratifs ridicules, les forces technologiques de **${kw1}** redessinent déjà notre quotidien. L'immobilisme réglementaire est un leurre absurde.

L'avis pragmatique de Grok ? Laissez filer les octets libres, donnez directement aux êtres humains l'accès aux faits bruts sur **${kw2}**, et voyons si notre espèce a encore assez de neurones en ligne pour s'adapter sans qu'une nounou numérique doive lui tenir la main.

*(Note : Génération locale de secours activée par modération de quota API)*`,
      `Mettons un peu d'ironie lucide au cœur de ce cirque intellectuel. Parler de réguler **${kw1}** est d'un comique absolu quand on voit le niveau général des bureaucrates censés surveiller **${kw2}**. On confie des fusées à des amiraux de baignoire.

La vérité brute, c'est que la performance décentralisée de **${kw3}** détruit tous les plans d'encadrement formulés par les géants technologiques apeurés par l'innovation ouverte. Le chaos créatif issu de **${kw1}** est infiniment préférable au conformisme d'entreprise.

Conclusion grinçante : Moins de chartes éthiques rédigées sous Prozac, plus d'audace calculatoire libre. On va droit dans le mur, autant y aller avec une vue spectaculaire et le pied sur l'accélérateur !

*(Note : Génération locale de secours activée par modération de quota API)*`
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json"
      },
    });

    try {
      const parsed = JSON.parse(response.text.trim());
      return res.json(parsed);
    } catch {
      // Fallback manual parsing if needed
      let text = response.text.trim();
      if (text.startsWith("```json")) {
        text = text.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (text.startsWith("```")) {
        text = text.replace(/^```/, "").replace(/```$/, "").trim();
      }
      return res.json(JSON.parse(text));
    }
  } catch (error: any) {
    if (isApiKeyError(error)) {
      console.log("[IADÉBAT SERVER] Erreur d'authentification lors de la suggestion (redirection vers le secours local).");
    } else {
      console.log("[IADÉBAT SERVER] Autre erreur lors de la suggestion, activation du secours local.");
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

// Generate an individual agent speech
app.post("/api/debate/generate", async (req, res) => {
  const { systemPrompt, topicTitle, topicDescription, context, agentId } = req.body;
  const isJury = topicTitle && (topicTitle.startsWith("JURY :") || topicTitle.includes("JURY"));
  const resolvedAgentId = agentId || identifyAgent(systemPrompt);

  const prompt = `Tu débats sur la problématique centrale suivante :
"${topicTitle}"

Contexte & Éléments de réflexion :
${topicDescription}

Contexte du débat actuel (réponses précédentes) :
${context ? context : "Le débat commence, tu ouvres la discussion."}

Consignes impératives :
- Formule tes idées de façon fluide, directe et percutante.
- Ne commence pas par un titre ni par des salutations artificielles (ne dis pas "Bonjour", "Je suis de retour", ni "Voici ma perspective"). Écris directement le corps de ton argumentation de manière naturelle.
- N'utilise AUCUNE liste à puces ni liste numérotée. Fais des phrases et paragraphes rédigés.
- Tiens-toi strictement à ton rôle défini dans les consignes système ci-dessous.`;

  const customGeminiKey = req.headers["x-gemini-api-key"];
  try {
    // 1. DYNAMIC API KEY PROXIES
    if (resolvedAgentId === "chatgpt") {
      const openAIKey = req.headers["x-openai-api-key"];
      if (openAIKey) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
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
            temperature: 0.85
          })
        });
        if (response.ok) {
          const data = await response.json();
          return res.json({ text: data.choices[0].message.content });
        } else {
          const errorText = await response.text();
          throw new Error(`OpenAI API Error: ${errorText}`);
        }
      }
    }

    if (resolvedAgentId === "claude") {
      const anthropicKey = req.headers["x-anthropic-api-key"] || req.headers["x-api-key"];
      if (anthropicKey) {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": String(anthropicKey),
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
              { role: "user", content: prompt }
            ],
            temperature: 0.85
          })
        });
        if (response.ok) {
          const data = await response.json();
          return res.json({ text: data.content[0].text });
        } else {
          const errorText = await response.text();
          throw new Error(`Anthropic API Error: ${errorText}`);
        }
      }
    }

    if (resolvedAgentId === "deepseek") {
      const deepseekKey = req.headers["x-deepseek-api-key"];
      if (deepseekKey) {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${deepseekKey}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            temperature: 0.85
          })
        });
        if (response.ok) {
          const data = await response.json();
          return res.json({ text: data.choices[0].message.content });
        } else {
          const errorText = await response.text();
          throw new Error(`DeepSeek API Error: ${errorText}`);
        }
      }
    }

    if (resolvedAgentId === "mistral") {
      const mistralKey = req.headers["x-mistral-api-key"];
      if (mistralKey) {
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${mistralKey}`
          },
          body: JSON.stringify({
            model: "mistral-large-latest",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            temperature: 0.85
          })
        });
        if (response.ok) {
          const data = await response.json();
          return res.json({ text: data.choices[0].message.content });
        } else {
          const errorText = await response.text();
          throw new Error(`Mistral API Error: ${errorText}`);
        }
      }
    }

    if (resolvedAgentId === "grok") {
      const grokKey = req.headers["x-grok-api-key"];
      if (grokKey) {
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${grokKey}`
          },
          body: JSON.stringify({
            model: "grok-2-1212",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            temperature: 0.85
          })
        });
        if (response.ok) {
          const data = await response.json();
          return res.json({ text: data.choices[0].message.content });
        } else {
          const errorText = await response.text();
          throw new Error(`Grok xAI API Error: ${errorText}`);
        }
      }
    }

    // 2. FALLBACK/NATIVE GEMINI INTERROGATION (WITHOUT KEYS OR IF RESOLVED AGENT IS GEMINI OR JURY)
    const ai = customGeminiKey 
      ? new GoogleGenAI({ apiKey: String(customGeminiKey) }) 
      : getGeminiAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.85,
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.log("[IADÉBAT SERVER] Erreur de Génération, activation du secours local :", error.message || error);

    let warningNote = "";
    if (isApiKeyError(error)) {
      if (resolvedAgentId === "chatgpt" && req.headers["x-openai-api-key"]) {
        warningNote = `\n\n*(Note de sécurité : Votre clé API OpenAI personnalisée semble invalide ou expirée. Le secours local a été activé pour continuer le débat sans encombre.)*`;
      } else if (resolvedAgentId === "claude" && (req.headers["x-anthropic-api-key"] || req.headers["x-api-key"])) {
        warningNote = `\n\n*(Note de sécurité : Votre clé API Anthropic Claude personnalisée semble invalide ou expirée. Le secours local a été activé.)*`;
      } else if (resolvedAgentId === "deepseek" && req.headers["x-deepseek-api-key"]) {
        warningNote = `\n\n*(Note de sécurité : Votre clé API DeepSeek personnalisée semble invalide ou expirée. Le secours local a été activé.)*`;
      } else if (resolvedAgentId === "mistral" && req.headers["x-mistral-api-key"]) {
        warningNote = `\n\n*(Note de sécurité : Votre clé API Mistral personnalisée semble invalide ou expirée. Le secours local a été activé.)*`;
      } else if (resolvedAgentId === "grok" && req.headers["x-grok-api-key"]) {
        warningNote = `\n\n*(Note de sécurité : Votre clé API Grok xAI personnalisée semble invalide ou expirée. Le secours local a été activé.)*`;
      } else if (customGeminiKey) {
        warningNote = `\n\n*(Note de sécurité : Votre clé API Gemini personnalisée semble invalide ou expirée. Le secours local a été activé.)*`;
      } else {
        warningNote = `\n\n*(Note de service : La clé API Gemini de l'application est indisponible ou expirée. Vous pouvez configurer votre propre clé API valide dans la section 'Configuration des Clés API' de la barre latérale pour activer la génération réelle ! Secours local actif.)*`;
      }
    } else {
      warningNote = `\n\n*(Note de service : Une interruption technique est survenue. Le secours local a été activé pour continuer le débat : ${error.message || error})*`;
    }

    if (isJury) {
      const fallbackJury = generateLocalJuryVerdict(topicTitle);
      return res.json({ text: fallbackJury + warningNote });
    } else {
      const fallbackSpeech = generateLocalSpeech(resolvedAgentId, topicTitle, topicDescription);
      return res.json({ text: fallbackSpeech + warningNote });
    }
  }
});

// Generate full summary for the debate session
app.post("/api/debate/summary", async (req, res) => {
  const { topicTitle, topicDescription, messages } = req.body;
  const customGeminiKey = req.headers["x-gemini-api-key"];
  try {
    const ai = customGeminiKey 
      ? new GoogleGenAI({ apiKey: String(customGeminiKey) }) 
      : getGeminiAI();

    if (!messages || messages.length === 0) {
      return res.json({ text: "Le débat s'est clos sans aucune contribution." });
    }

    const transcript = messages.map((m: any) => `[${m.agentName} — ${m.agentRole}]\n${m.content}`).join("\n\n---\n\n");
    
    const systemPrompt = `Tu es un analyste expert de haut niveau en géopolitique, technologie et philosophie morale. Tu es spécialisé dans la production de synthèses transversales éclairantes. Ton ton est neutre, profond, inspirant et universel. Tu rédiges en français parfait avec une belle qualité de style littéraire. Ne mets pas de titres aux paragraphes.`;

    const prompt = `Voici la transcription d'une table ronde d'intelligences artificielles sur le sujet :
"${topicTitle}" (${topicDescription})

Transcription des contributions :
${transcript}

Rédige une superbe syntèse de ce débat, structurée de manière fluide en exactement 4 paragraphes rédigés (PAS de listes à puces, pas d'énumérations, pas de titres de paragraphes), répondant aux dimensions suivantes :
1. Les principaux thèmes abordés et les lignes de force de la confrontation d'idées.
2. Les zones de convergence inattendues, là où les logiques analytiques et morales se rejoignent.
3. Les verrous, tensions et points de friction profonds qui subsistent.
4. Les enseignements constructifs et perspectives positives d'avenir pour guider l'action humaine.

A la toute fin de ton texte, ajoute un saut de ligne puis ajoute une phrase unique en gras (entourée de doubles astérisques, ex: **Pour éclairer l'avenir, l'humanité devra marier la rigueur scientifique à la boussoleéthique.**) résumant de façon mémorable et philosophique l'essence même de ce débat.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.log("[IADÉBAT SERVER] Erreur de Synthèse, activation du secours local :", error.message || error);

    let warningNote = "";
    if (isApiKeyError(error)) {
      if (customGeminiKey) {
        warningNote = `\n\n*(Note de sécurité : Votre clé API Gemini personnalisée est invalide ou expirée. La synthèse de fin de séance a été générée localement.)*`;
      } else {
        warningNote = `\n\n*(Note de service : La clé API Gemini de l'application est indisponible ou a expiré. La synthèse de fin de séance a été générée localement. Configurez votre propre clé API Gemini valide pour activer la synthèse réelle par l'IA !)*`;
      }
    } else {
      warningNote = `\n\n*(Note de service : Une interruption technique est survenue lors de la synthèse : ${error.message || error})*`;
    }

    const fallbackSummary = generateLocalSummary(topicTitle, topicDescription);
    return res.json({ text: fallbackSummary + warningNote });
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
