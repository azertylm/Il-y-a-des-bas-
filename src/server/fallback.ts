// ─── MOTEUR DE PROSE DE SECOURS ──────────────────────────────────────────────
// Contenu éditorial : les gabarits ci-dessous sont servis lorsque le moteur
// distant est indisponible. Toute réponse issue de ce fichier doit être
// signalée à l'interface avec `degraded: true` et `source: "local"`.

export const FALLBACK_TOPICS = [
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

export function extractKeywords(title: string): string[] {
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

export function identifyAgent(systemPrompt: string): string {
  const promptLower = systemPrompt.toLowerCase();
  if (promptLower.includes("chatgpt")) return "chatgpt";
  if (promptLower.includes("claude")) return "claude";
  if (promptLower.includes("gemini")) return "gemini";
  if (promptLower.includes("deepseek")) return "deepseek";
  if (promptLower.includes("mistral")) return "mistral";
  if (promptLower.includes("grok")) return "grok";
  return "chatgpt";
}

export function generateLocalSpeech(agentId: string, topicTitle: string, topicDescription: string): string {
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

export function generateLocalJuryVerdict(topicTitle: string): string {
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

export function generateLocalSummary(topicTitle: string, topicDescription: string): string {
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

// ─── ANALYSE RHÉTORIQUE DE SECOURS ───────────────────────────────────────────
// Détection heuristique de sophismes courants en français. Sans modèle
// distant, on ne « comprend » rien : on repère des marqueurs de surface. Le
// résultat est donc toujours servi avec `degraded: true`.

export interface FallacyFinding {
  name: string;
  quote: string;
  explanation: string;
  severity: "faible" | "moyenne" | "forte";
}

export interface FallacyAnalysis {
  findings: FallacyFinding[];
  soundness: number;
  verdict: string;
}

const SEVERITY_WEIGHT: { [key: string]: number } = { faible: 6, moyenne: 12, forte: 20 };

const FALLACY_PATTERNS: {
  name: string;
  severity: FallacyFinding["severity"];
  explanation: string;
  pattern: RegExp;
}[] = [
  {
    name: "Généralisation abusive",
    severity: "moyenne",
    explanation:
      "L'argument étend à la totalité d'un ensemble ce qui n'a été établi que sur quelques cas, sans justifier ce saut.",
    pattern: /\b(tous les|toutes les|toujours|jamais|aucun|aucune|personne ne|chacun d)\b/i,
  },
  {
    name: "Faux dilemme",
    severity: "forte",
    explanation:
      "Le raisonnement réduit le champ des possibles à deux options opposées alors que d'autres voies existent.",
    pattern: /\b(soit\b[^.]{5,70}\bsoit\b|ou bien\b[^.]{5,70}\bou bien\b|n'avons plus le choix|pas d'autre choix|il faut choisir entre)/i,
  },
  {
    name: "Pente glissante",
    severity: "forte",
    explanation:
      "Une première mesure est présentée comme entraînant mécaniquement une suite de conséquences extrêmes, sans démontrer aucun de ces enchaînements.",
    pattern: /\b(inévitablement|fatalement|nécessairement|de proche en proche|c'est la porte ouverte)\b/i,
  },
  {
    name: "Appel à l'autorité",
    severity: "moyenne",
    explanation:
      "La conclusion s'appuie sur le prestige d'une source plutôt que sur le contenu de la preuve avancée.",
    pattern: /\b(les experts|la science (dit|montre|prouve)|il est prouvé|il est établi|nul ne conteste|chacun sait)\b/i,
  },
  {
    name: "Appel à la peur",
    severity: "moyenne",
    explanation:
      "L'adhésion est recherchée par l'inquiétude suscitée plutôt que par la solidité de la démonstration.",
    pattern: /\b(catastroph\w+|terrifi\w+|effroi|apocalyp\w+|péril|désastre|menace existentielle|droit dans le mur)\b/i,
  },
  {
    name: "Attaque contre la personne",
    severity: "forte",
    explanation:
      "La thèse adverse est disqualifiée en visant ceux qui la portent au lieu de son contenu.",
    pattern: /\b(bureaucrates?|technocrates?|apeuré\w*|incompétent\w*|naïf|naïve|naïfs|idéologues?|amiraux de baignoire)\b/i,
  },
  {
    name: "Homme de paille",
    severity: "forte",
    explanation:
      "La position adverse est reformulée sous une version affaiblie, plus commode à réfuter que la thèse réellement défendue.",
    pattern: /\b(voudraient nous faire croire|prétendent que|sous prétexte que|s'imaginent que|leurs partisans croient)\b/i,
  },
  {
    name: "Appel à la nouveauté",
    severity: "faible",
    explanation:
      "Le caractère récent ou ancien d'une idée est traité comme un argument, alors qu'il ne dit rien de sa validité.",
    pattern: /\b(dépassé|archaïque|d'un autre âge|rétrograde|calèches à cheval|obsolète)\b/i,
  },
];

/** Phrase entière contenant l'expression repérée, tronquée pour l'affichage. */
function surroundingSentence(text: string, match: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const found = sentences.find(s => s.toLowerCase().includes(match.toLowerCase()));
  const quote = (found || match).replace(/\*\*/g, "").trim();
  return quote.length > 220 ? `${quote.slice(0, 220).trimEnd()}…` : quote;
}

export function generateLocalFallacyAnalysis(content: string, agentName: string): FallacyAnalysis {
  const findings: FallacyFinding[] = [];

  for (const rule of FALLACY_PATTERNS) {
    const hit = rule.pattern.exec(content);
    if (!hit) continue;
    findings.push({
      name: rule.name,
      quote: surroundingSentence(content, hit[0]),
      explanation: rule.explanation,
      severity: rule.severity,
    });
  }

  const penalty = findings.reduce((sum, f) => sum + (SEVERITY_WEIGHT[f.severity] || 10), 0);
  const soundness = Math.max(20, 100 - penalty);

  const verdict = findings.length === 0
    ? `Le relevé automatique n'a repéré aucun marqueur rhétorique classique dans l'intervention de ${agentName}. Cela ne vaut pas certificat de rigueur : seule une lecture attentive peut en juger.`
    : `Le relevé automatique signale ${findings.length} figure${findings.length > 1 ? "s" : ""} à surveiller dans l'intervention de ${agentName}. Ces marqueurs sont repérés sur la forme des phrases, pas sur le fond de l'argumentation : à vous de trancher.`;

  return { findings, soundness, verdict };
}

// ─── TRAITÉ DE CONSENSUS DE SECOURS ──────────────────────────────────────────
export interface TreatyArticle {
  title: string;
  content: string;
}

export interface Treaty {
  preamble: string;
  articles: TreatyArticle[];
  reservation: string;
}

export function generateLocalTreaty(topicTitle: string): Treaty {
  // Les gabarits ci-dessous n'insèrent aucun mot-clé extrait du sujet dans une
  // position grammaticale : le titre est cité tel quel, une seule fois, et les
  // articles restent autonomes. Un traité de secours doit rester lisible quel
  // que soit le sujet débattu.
  const sujet = topicTitle.trim() || "la question soumise à l'arène";

  return {
    preamble: `Les parties réunies en table ronde sur la question « ${sujet} », considérant l'ampleur des transformations engagées et la diversité des positions exprimées, conviennent des articles suivants comme socle minimal de leur désaccord fécond.`,
    articles: [
      {
        title: "De la primauté de la délibération",
        content: `Aucune orientation majeure sur cette question ne saurait être arrêtée sans délibération contradictoire préalable, associant les parties concernées et rendue publique.`,
      },
      {
        title: "De la charge de la preuve",
        content: `Il revient à qui propose une transformation d'en démontrer les bénéfices, et non à qui s'en inquiète d'en démontrer les périls. Cette règle s'applique symétriquement à toutes les parties.`,
      },
      {
        title: "De la réversibilité",
        content: `Toute mesure engageante doit demeurer révisable. Les parties reconnaissent qu'un dispositif dont on ne peut plus sortir n'est pas un choix mais une contrainte déguisée.`,
      },
      {
        title: "Du bénéficiaire final",
        content: `Les gains attendus doivent profiter en priorité aux personnes concernées, et leur répartition être rendue vérifiable. Un progrès dont nul ne peut mesurer les effets n'engage personne.`,
      },
    ],
    reservation: `Les parties consignent que leurs désaccords sur les moyens demeurent entiers, et que le présent traité ne les efface pas : il en organise seulement l'expression. Ces articles sont un gabarit générique, non le fruit de la délibération qui vient d'avoir lieu.`,
  };
}

