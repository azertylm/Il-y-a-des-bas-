/**
 * Mise en scène d'IA Débat : formats de débat, sujets en 1 clic, image « punchline » à partager
 * et lecture vocale (Mode Podcast, synthèse vocale du navigateur, 100 % locale).
 */
import type { Topic } from "../types";

/* ───────────────────────────── Formats de débat ───────────────────────────── */

export type FormatDebat = "libre" | "pourcontre" | "roles";

export const FORMATS_DEBAT: { id: FormatDebat; nom: string; aide: string }[] = [
  { id: "libre", nom: "Libre / Nuancé", aide: "Chaque IA choisit sa position." },
  { id: "pourcontre", nom: "Pour vs Contre", aide: "Deux camps qui ne lâchent rien." },
  { id: "roles", nom: "Rôles tranchés", aide: "Pragmatique, Avocat du diable, Philosophe…" },
];

export const ROLES_TRANCHES: { nom: string; consigne: string }[] = [
  { nom: "le Pragmatique", consigne: "Tu ne parles que de solutions concrètes, de coûts et de faisabilité. Les grands principes t'agacent." },
  { nom: "l'Avocat du diable", consigne: "Tu attaques systématiquement la thèse qui domine la discussion, même si tu la trouves juste." },
  { nom: "le Philosophe", consigne: "Tu ramènes tout aux principes, aux valeurs et au sens. Tu poses la question que personne n'ose poser." },
  { nom: "le Provocateur", consigne: "Tu défends la position la plus radicale, assumée et argumentée, sans jamais insulter personne." },
  { nom: "le Sceptique", consigne: "Tu exiges des preuves, des chiffres et des exemples ; tu démontes les affirmations gratuites." },
  { nom: "l'Optimiste", consigne: "Tu vois les opportunités et le progrès possible, et tu le défends face aux pessimistes." },
];

/** Consigne de format ajoutée au prompt système d'un orateur (rang = sa place parmi les IA actives). */
export function consigneFormat(format: FormatDebat, rang: number, sujet: string): { consigne: string; etiquette: string } {
  if (format === "pourcontre") {
    const pour = rang % 2 === 0;
    return {
      etiquette: pour ? "Camp POUR" : "Camp CONTRE",
      consigne:
        `FORMAT POUR vs CONTRE : tu es dans le camp ${pour ? "POUR" : "CONTRE"} la proposition « ${sujet} ». ` +
        `Défends cette position coûte que coûte, ne concède jamais la thèse adverse, attaque les arguments du camp ${pour ? "CONTRE" : "POUR"}.`,
    };
  }
  if (format === "roles") {
    const r = ROLES_TRANCHES[rang % ROLES_TRANCHES.length];
    return { etiquette: r.nom.replace(/^(le |l')/, (m) => m), consigne: `RÔLE IMPOSÉ : tu joues ${r.nom}. ${r.consigne} Ne sors jamais de ce rôle.` };
  }
  return { etiquette: "", consigne: "" };
}

/** Format plateau télé : répliques courtes et vivantes. */
export const CONSIGNE_PLATEAU_TV =
  " FORMAT PLATEAU TÉLÉ : 3 à 4 phrases maximum. Ton direct, percutant, vivant. Aucune formule de politesse, aucun préambule, pas de « excellente question ». Réponds nommément à au moins un autre intervenant quand c'est possible. Évite le consensus mou : prends position.";

/* ───────────────────────────── Sujets en 1 clic ───────────────────────────── */

const SUJETS: { categorie: string; emoji: string; titres: [string, string][] }[] = [
  { categorie: "Société", emoji: "🏛️", titres: [
    ["Faut-il interdire les réseaux sociaux aux moins de 15 ans ?", "Protection des enfants ou atteinte à leur liberté ? Santé mentale, école et rôle des parents."],
    ["La semaine de 4 jours doit-elle devenir la norme ?", "Productivité, santé, services publics, petites entreprises : qui y gagne vraiment ?"],
    ["Faut-il rendre le vote obligatoire ?", "Remède à l'abstention ou atteinte à la liberté de ne pas choisir ?"],
  ] },
  { categorie: "Tech", emoji: "🤖", titres: [
    ["Faut-il un permis pour utiliser l'IA ?", "Former tout le monde avant d'utiliser les IA : protection utile ou frein absurde ?"],
    ["Faut-il taxer les robots qui remplacent des emplois ?", "Financer la protection sociale ou freiner l'innovation ?"],
    ["Les voitures autonomes doivent-elles être autorisées partout ?", "Moins d'accidents, mais qui est responsable quand ça tourne mal ?"],
  ] },
  { categorie: "Philosophie", emoji: "🧠", titres: [
    ["Une IA peut-elle avoir une morale ?", "Suivre des règles, est-ce déjà avoir une conscience morale ?"],
    ["Le bonheur est-il un devoir ?", "Faut-il chercher à être heureux, ou est-ce une injonction de plus ?"],
    ["Peut-on être libre sans être seul ?", "Les liens nous enchaînent-ils ou nous rendent-ils libres ?"],
  ] },
  { categorie: "Écologie", emoji: "🌍", titres: [
    ["Faut-il interdire les jets privés ?", "Symbole utile ou mesure inutile face aux vrais enjeux du climat ?"],
    ["Le nucléaire est-il l'énergie verte de demain ?", "Peu de CO2, mais des déchets et des risques : quel choix pour la France ?"],
    ["Manger de la viande deviendra-t-il immoral ?", "Climat, bien-être animal, traditions et liberté de chacun."],
  ] },
  { categorie: "Grand débat", emoji: "⚖️", titres: [
    ["Faut-il instaurer un revenu universel ?", "Filet de sécurité pour tous ou fin de la valeur travail ?"],
    ["Le télétravail doit-il devenir un droit ?", "Qualité de vie, isolement, inégalités entre métiers."],
    ["L'Europe doit-elle avoir sa propre armée ?", "Indépendance stratégique ou rêve impossible ?"],
  ] },
  { categorie: "Décalé", emoji: "🍍", titres: [
    ["La pizza à l'ananas est-elle un crime ?", "Audace culinaire ou trahison de l'Italie ? Le débat qui divise les familles."],
    ["Faut-il interdire les réunions du lundi matin ?", "Rituel utile ou torture managériale ?"],
    ["Les chats sont-ils plus intelligents que les chiens ?", "Indépendance contre loyauté : le match du siècle."],
  ] },
];

/** 6 sujets variés, qui changent chaque jour. */
export function sujetsDuJour(date = new Date()): (Topic & { emoji: string })[] {
  const jour = Math.floor(date.getTime() / 86_400_000);
  return SUJETS.map((s, i) => {
    const [title, description] = s.titres[(jour + i) % s.titres.length];
    return { id: `rapide-${i}-${jour}`, category: s.categorie.toUpperCase(), title, description, emoji: s.emoji, isCustom: true };
  });
}

/* ───────────────────────────── Image « punchline » ───────────────────────────── */

function decouperLignes(ctx: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const mots = texte.split(/\s+/);
  const lignes: string[] = [];
  let ligne = "";
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ctx.measureText(essai).width > largeur && ligne) {
      lignes.push(ligne);
      ligne = mot;
    } else ligne = essai;
  }
  if (ligne) lignes.push(ligne);
  return lignes;
}

/** Garde les 2-3 premières phrases si la réplique est longue (une image doit rester lisible). */
export function extraitPunchline(texte: string, max = 260): string {
  const propre = texte.replace(/\*\*|__|#+\s/g, "").replace(/\s+/g, " ").trim();
  if (propre.length <= max) return propre;
  const phrases = propre.match(/[^.!?…]+[.!?…]+/g) || [propre];
  let out = "";
  for (const p of phrases) {
    if ((out + p).length > max) break;
    out += p;
  }
  return (out || propre.slice(0, max - 1) + "…").trim();
}

/** Dessine une image carrée 1080×1080 : citation, IA, sujet, marque IADébat. */
export async function dessinerPunchline(opts: {
  citation: string;
  auteur: string;
  symbole: string;
  couleur: string;
  sujet: string;
  sousTitre?: string;
}): Promise<Blob> {
  const T = 1080;
  const c = document.createElement("canvas");
  c.width = T;
  c.height = T;
  const ctx = c.getContext("2d")!;
  await (document as any).fonts?.ready?.catch?.(() => undefined);

  // Fond sombre avec halo de la couleur de l'IA
  ctx.fillStyle = "#07070a";
  ctx.fillRect(0, 0, T, T);
  const halo = ctx.createRadialGradient(T * 0.85, T * 0.1, 40, T * 0.85, T * 0.1, T * 0.9);
  halo.addColorStop(0, `${opts.couleur}55`);
  halo.addColorStop(1, "#07070a00");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, T, T);
  ctx.fillStyle = opts.couleur;
  ctx.fillRect(0, 0, 14, T);

  const police = '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif';

  // En-tête : sujet
  ctx.fillStyle = "#00f5c4";
  ctx.font = `800 30px ${police}`;
  ctx.fillText("LE SUJET", 80, 110);
  ctx.fillStyle = "#e5e7eb";
  ctx.font = `700 40px ${police}`;
  const lignesSujet = decouperLignes(ctx, opts.sujet, T - 160).slice(0, 2);
  lignesSujet.forEach((l, i) => ctx.fillText(l, 80, 165 + i * 50));

  // Citation, taille adaptée à la longueur
  const citation = `« ${extraitPunchline(opts.citation)} »`;
  let taille = 64;
  let lignes: string[] = [];
  for (; taille >= 34; taille -= 4) {
    ctx.font = `800 ${taille}px ${police}`;
    lignes = decouperLignes(ctx, citation, T - 160);
    if (lignes.length * taille * 1.25 <= 560) break;
  }
  ctx.fillStyle = "#ffffff";
  const hauteur = lignes.length * taille * 1.25;
  const debutY = 300 + (560 - hauteur) / 2 + taille;
  lignes.forEach((l, i) => ctx.fillText(l, 80, debutY + i * taille * 1.25));

  // Auteur
  ctx.beginPath();
  ctx.arc(116, 930, 36, 0, Math.PI * 2);
  ctx.fillStyle = `${opts.couleur}33`;
  ctx.fill();
  ctx.strokeStyle = opts.couleur;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = opts.couleur;
  ctx.font = `700 34px ${police}`;
  ctx.textAlign = "center";
  ctx.fillText(opts.symbole, 116, 943);
  ctx.textAlign = "left";
  ctx.fillStyle = opts.couleur;
  ctx.font = `800 40px ${police}`;
  ctx.fillText(opts.auteur, 172, 925);
  if (opts.sousTitre) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = `500 24px ${police}`;
    ctx.fillText(opts.sousTitre.slice(0, 60), 172, 960);
  }

  // Marque
  ctx.textAlign = "right";
  ctx.fillStyle = "#00f5c4";
  ctx.font = `900 40px ${police}`;
  ctx.fillText("IADÉBAT", T - 70, 925);
  ctx.fillStyle = "#6b7280";
  ctx.font = `500 24px ${police}`;
  ctx.fillText("alphabette.eu/apps/iadebat", T - 70, 960);
  ctx.textAlign = "left";

  return new Promise((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error("Image impossible"))), "image/png"));
}

/** Partage l'image (feuille de partage du téléphone) ou la télécharge. */
export async function partagerImage(blob: Blob, nom: string, texte: string): Promise<"partage" | "telecharge"> {
  const fichier = new File([blob], nom, { type: "image/png" });
  const nav: any = navigator;
  if (nav.canShare?.({ files: [fichier] })) {
    try {
      await nav.share({ files: [fichier], text: texte });
      return "partage";
    } catch (e: any) {
      if (e?.name === "AbortError") return "partage";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "telecharge";
}

/* ───────────────────────────── Mode Podcast ───────────────────────────── */

/** Variation de voix par IA (hauteur, débit) ; on alterne aussi les voix françaises disponibles. */
const TIMBRES: Record<string, { pitch: number; rate: number; rangVoix: number }> = {
  chatgpt: { pitch: 1.0, rate: 1.05, rangVoix: 0 },
  claude: { pitch: 0.9, rate: 0.98, rangVoix: 1 },
  gemini: { pitch: 1.15, rate: 1.08, rangVoix: 2 },
  deepseek: { pitch: 0.8, rate: 1.0, rangVoix: 3 },
  mistral: { pitch: 1.05, rate: 1.0, rangVoix: 4 },
  grok: { pitch: 1.25, rate: 1.12, rangVoix: 5 },
  user: { pitch: 1.0, rate: 1.0, rangVoix: 0 },
};

export function podcastDisponible(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function voixFrancaises(): SpeechSynthesisVoice[] {
  return window.speechSynthesis.getVoices().filter((v) => /^fr/i.test(v.lang));
}

/** Lit un texte avec le timbre de l'IA. Renvoie une promesse résolue à la fin (ou à l'arrêt). */
export function lireAVoixHaute(texte: string, agentId: string, nom: string): Promise<void> {
  return new Promise((fin) => {
    const s = window.speechSynthesis;
    const t = TIMBRES[agentId] || TIMBRES.user;
    const u = new SpeechSynthesisUtterance(`${nom}. ${texte.replace(/\*\*|__|#+\s/g, "")}`);
    u.lang = "fr-FR";
    const voix = voixFrancaises();
    if (voix.length) u.voice = voix[t.rangVoix % voix.length];
    u.pitch = t.pitch;
    u.rate = t.rate;
    u.onend = () => fin();
    u.onerror = () => fin();
    s.speak(u);
  });
}
