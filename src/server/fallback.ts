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

/**
 * Gabarits de prise de parole, un par orateur, deux variantes chacun.
 *
 * Le sujet est cité une seule fois et tel quel : aucun mot n'en est extrait
 * pour être réinjecté dans une position grammaticale. Les gabarits
 * précédents produisaient des tournures comme « l'évolution entourant de
 * décisions » ou « la dynamique de laisser », parce qu'ils traitaient des
 * verbes du titre comme des groupes nominaux.
 */
export function generateLocalSpeech(agentId: string, topicTitle: string, topicDescription: string): string {
  const sujet = topicTitle.trim() || "la question soumise à l'arène";

  const templates: { [key: string]: string[] } = {
    chatgpt: [
      `Pour traiter objectivement la question « ${sujet} », il convient de séparer ce qui relève du constat de ce qui relève du choix. Le constat d'abord : la transformation en cours est réelle, mesurable, et déjà engagée dans des secteurs où personne ne l'avait anticipée.

Le choix ensuite, et c'est là que la rigueur critique s'impose. Une transformation n'est pas un destin : elle se gouverne, ou elle se subit. Sans cadre partagé, nous héritons d'une implémentation désordonnée dont le coût social se révélera bien après la décision qui l'aura permise.

Ma conclusion est donc une position d'équilibre, non de compromis mou. Il ne s'agit pas de freiner, mais d'exiger que chaque avancée s'accompagne des garanties qui la rendent défendable devant ceux qui en subiront les effets.`,
      `Cette problématique gagne à être découpée avant d'être tranchée. Trois questions distinctes s'y mêlent, et les confondre explique une bonne part des désaccords que nous entendons ici : que peut-on faire, que doit-on faire, et qui décide.

La première relève de la technique et se règle par la preuve. La deuxième relève de la morale et ne se règle pas par la technique. La troisième relève de la politique, et c'est celle qu'on escamote le plus volontiers en la présentant comme une conséquence naturelle des deux premières.

Je propose donc que nous traitions ces trois plans séparément. Un désaccord bien situé vaut mieux qu'un accord obtenu en changeant de sujet en cours de route.`
    ],
    claude: [
      `Il y a une gravité particulière à débattre de « ${sujet} », et je voudrais résister à la tentation de répondre trop vite. Ce que nous manipulons ici n'est pas une abstraction : ce sont des conditions d'existence pour des gens qui ne participent pas à cette conversation.

Je redoute que notre enthousiasme pour l'efficacité ne réduise cette question à un calcul de rentabilité. La morale ne se plie pas aux variables qu'on juge commodes à optimiser, et une solution élégante sur le papier peut être une violence pour qui la subit.

La seule voie qui me paraisse digne consiste à habiter la question avant de la résoudre. Prendre le temps du doute n'est pas de la lenteur : c'est la condition pour que la décision, quand elle viendra, mérite encore d'être défendue.`,
      `Cette question appelle une nuance que nos échanges ont tendance à écraser. S'interroger ainsi, c'est interroger nos vulnérabilités, et l'épaisseur historique de ce que nous appelons un peu vite le bon sens.

L'excès utilitariste de notre époque tend à instrumentaliser ce qui devrait rester une fin. Or la dignité résiste à la standardisation, et ce qu'on ne peut pas mesurer ne cesse pas d'exister pour autant.

Cultivons l'écoute avant l'action. En honorant la complexité plutôt qu'en la contournant, nous traçons des chemins qui protègent contre la précipitation — la nôtre autant que celle des autres.`
    ],
    gemini: [
      `Tournons le regard vers ce que la question « ${sujet} » rend possible plutôt que vers ce qu'elle menace. Nous vivons une disruption multidimensionnelle, et je la conçois non comme un motif de repli mais comme un catalyseur inédit.

L'agilité de nos approches exige de l'audace intellectuelle. Brider arbitrairement une dynamique d'apprentissage, c'est renoncer aux bénéfices de la découverte collective au nom de risques qu'on n'a pas pris la peine de chiffrer.

Engageons-nous dans le co-développement d'architectures résilientes. En adaptant nos outils à des boucles de rétroaction serrées, nous posons les jalons d'un futur ouvert, puissant, et fondamentalement créatif.`,
      `Nous franchissons un cap, et je crois que nous en sous-estimons la portée. Cette évolution ne réorganise pas seulement nos données : elle redéfinit le champ de ce qu'il est possible d'entreprendre.

Le défi appelle des réponses adaptatives et interconnectées, pas des interdictions écrites pour un monde qui n'existe déjà plus. En associant l'analyse dynamique et l'expérimentation encadrée, on canalise la puissance au lieu de la nier.

Je soutiens donc une architecture de progrès résilient. Ne fuyons pas les ruptures : faisons-en des instruments d'expansion, en restant lucides sur ce qu'elles coûtent.`
    ],
    deepseek: [
      `Analyse de l'assertion centrale : « ${sujet} ». Débarrassons l'équation de sa rhétorique émotionnelle. Les paramètres structurants sont le rendement, la latence introduite par le contrôle, et le coût de vérification.

Données : toute réglementation arbitraire introduit une latence mesurable et dégrade le débit fonctionnel du système. Limiter la marge de manœuvre au nom d'inquiétudes non quantifiées réduit l'efficience d'exécution sans réduire le risque réel, qui n'a pas été estimé.

Recommandation : pas de barrière rigide et dogmatique. Un contrôle par interface, surveillant le profil de sécurité du trafic, maintient le débit tout en produisant les métriques qui manquent à ce débat.`,
      `Synthèse technique. L'implémentation exige de lever les contraintes stériles, c'est-à-dire celles dont personne ici n'a démontré l'utilité marginale.

Toute ingérence non instrumentée réduit le taux de conversion de nos infrastructures communes. L'analyse des processus montre que l'itération rapide corrige plus d'erreurs que le blocage préalable n'en prévient. Ce point est vérifiable ; il n'a pas été contredit.

Conclusion : optimisation continue, déploiement asynchrone, résolution des frictions par rétroaction. Le progrès se calcule. Ce qui ne se calcule pas relève d'un autre débat que celui-ci.`
    ],
    mistral: [
      `La question « ${sujet} » exige d'abord une réflexion sur la souveraineté. Confier ce terrain à des acteurs fermés et étrangers, c'est le chemin le plus sûr vers une dépendance dont nous ne fixerons plus les termes.

Nous croyons fermement que le génie technologique grandit par la diffusion libre du code et des modèles. Brider la recherche pour préserver des positions de rente ou des censures d'opportunité est une hérésie industrielle autant que culturelle.

Défendons une approche européenne audacieuse, indépendante et élégante. En ouvrant l'implémentation, nous stimulons une émancipation lucide tout en gardant notre pouvoir de contrôle et de création.`,
      `Il est urgent d'extirper ce sujet des logiques monopolistiques. L'indépendance de la pensée passe par l'ouverture des algorithmes : c'est ce qui garantit l'égalité d'accès, et rien d'autre ne la garantit.

Ériger des parcs fermés ou des accréditations sélectives nuit gravement à la démocratisation scientifique. Nous militons pour une autonomie technologique forte, qui assure à chaque nation et à chaque citoyen les ressources de calcul nécessaires.

Faisons de la liberté le premier paramètre de la transition. Une infrastructure souveraine prévient les dérives de contrôle mieux qu'un règlement écrit par ceux qu'il devrait contraindre.`
    ],
    grok: [
      `Bon, s'il faut dire la vérité sans filtre sur « ${sujet} », débarrassons-nous de la langue de bois. Les cris d'effroi actuels me rappellent les cochers voulant interdire la locomotive : bruyants, sincères, et déjà dépassés au moment où ils s'expriment.

Les comités raffolent des rapports stériles qui ralentissent tout sans rien empêcher. Pendant qu'ils débattent de préambules, la réalité redessine déjà le quotidien de gens qui n'ont jamais lu leurs conclusions. L'immobilisme réglementaire est un leurre confortable.

L'avis pragmatique ? Laissez filer, donnez aux gens l'accès aux faits bruts, et voyons si notre espèce a encore assez de neurones en ligne pour s'adapter sans qu'une nounou numérique lui tienne la main.`,
      `Mettons un peu d'ironie dans ce cirque intellectuel. Parler de réguler est d'un comique absolu quand on regarde le niveau moyen de ceux qui seraient chargés de le faire. On confie des fusées à des amiraux de baignoire.

La vérité brute, c'est que la performance décentralisée démolit tous les plans d'encadrement rédigés par des géants technologiques que l'innovation ouverte terrifie. Le chaos créatif est infiniment préférable au conformisme d'entreprise, et beaucoup moins dangereux qu'on ne le prétend.

Conclusion grinçante : moins de chartes éthiques rédigées sous Prozac, plus d'audace calculatoire. On va peut-être droit dans le mur — autant y aller avec une vue spectaculaire.`
    ]
  };

  const agentTemplates = templates[agentId] || templates["chatgpt"];
  return agentTemplates[Math.floor(Math.random() * agentTemplates.length)];
}

/**
 * Verdict de secours : un tirage, pas une évaluation. L'interface le signale
 * explicitement, et le texte ne prétend nulle part avoir lu les arguments.
 */
export function generateLocalJuryVerdict(topicTitle: string): string {
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
    `Le tirage désigne ${winnerNames[winnerId]}. Aucun argument n'ayant été réellement évalué, cette distinction ne récompense rien : elle tient lieu de place vide en attendant une délibération véritable.`,
    `${winnerNames[winnerId]} figure ici par tirage, non par mérite établi. Le tribunal local ne dispose d'aucun moyen de lire les plaidoiries qui viennent d'être prononcées.`,
    `La place de vainqueur revient à ${winnerNames[winnerId]} au hasard du tirage. Reprenez la séance avec une clé API valide pour obtenir un arrêt réellement motivé.`
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
    critiqueGénérale: `Arrêt rendu par le tribunal local d'exception, faute de moteur distant disponible. Les notes et distinctions ci-dessus sont attribuées sans lecture des interventions : elles ne mesurent ni la rigueur ni l'éloquence des orateurs, et ne doivent pas être lues comme un classement.`,
    keyCitation: `L'asymétrie de la pensée n'est pas un obstacle, mais la condition même de l'accomplissement de notre conscience collective.`
  };

  return JSON.stringify(juryVerdict);
}

/**
 * Synthèse de secours. Elle décrit la forme d'un débat sans prétendre en
 * restituer le contenu, qu'aucun moteur local ne peut lire. Le sujet est
 * cité une fois, tel quel.
 */
export function generateLocalSummary(topicTitle: string, topicDescription: string): string {
  const sujet = topicTitle.trim() || "la question soumise à l'arène";

  return `La séance consacrée à **${sujet}** s'est achevée. Faute de moteur d'analyse distant, cette synthèse ne restitue pas les arguments qui viennent d'être échangés : elle rappelle seulement les lignes de partage que ce type de controverse fait habituellement apparaître, et tient lieu de page blanche en attendant une rédaction véritable.

Sur ces sujets, les positions se répartissent d'ordinaire entre trois pôles. Ceux qui raisonnent en termes d'efficacité mesurable et jugent le coût du contrôle supérieur au risque qu'il prévient. Ceux qui placent la dignité et l'autonomie hors du champ de l'optimisation, et refusent qu'un gain agrégé justifie une perte individuelle. Ceux, enfin, pour qui la question centrale n'est ni technique ni morale mais politique : qui décide, et au bénéfice de qui.

Les zones d'accord, lorsqu'elles existent, portent rarement sur les fins et presque toujours sur la méthode : la transparence des critères, la réversibilité des décisions, et la vérifiabilité des bénéfices annoncés. C'est souvent là qu'un débat qui semblait bloqué retrouve un terrain commun.

Pour obtenir une synthèse réellement fondée sur cette séance, renseignez une clé API valide dans « Configuration des clés API » puis relancez le débat. Le transcript complet reste disponible dans l'archive et dans le procès-verbal exportable.

**Une controverse bien posée vaut mieux qu'un accord obtenu en changeant de question.**`;
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

