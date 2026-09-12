import { Topic, Message, Verdict } from "../types";

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatContentToHtml(content: string): string {
  if (!content) return "";
  const escaped = escapeHtml(content);
  // Remplace **texte** par <strong>texte</strong>
  const withBold = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Remplace *texte* par <em>texte</em>
  const withItalic = withBold.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // Remplace retours à la ligne doubles par paragraphes
  const paragraphs = withItalic.split(/\n\n+/);
  return paragraphs.map(p => `<p style="margin: 0 0 12px 0; line-height: 1.6;">${p.replace(/\n/g, "<br>")}</p>`).join("");
}

export function getWinnerDisplayName(winnerId?: string): string {
  if (!winnerId) return "Non déterminé";
  switch (winnerId) {
    case "chatgpt": return "ChatGPT (OpenAI)";
    case "claude": return "Claude (Anthropic)";
    case "gemini": return "Gemini (Google)";
    case "deepseek": return "DeepSeek";
    case "mistral": return "Mistral AI";
    case "grok": return "Grok (xAI)";
    default: return winnerId;
  }
}

/**
 * Génère un document HTML complet, autonome, interactif et responsive.
 * Intègre un panneau d'outils interactif (copier tout, copier en format riche, imprimer en PDF,
 * recherche par mot-clé, filtre par IA, bascule thème clair/sombre, copie par intervention).
 */
export function generateStandaloneHtmlDocument(
  topic: Topic,
  messages: Message[],
  verdict: Verdict | null,
  summary: string | null,
  treaty: any | null,
  shareUrl?: string
): string {
  const winnerName = getWinnerDisplayName(verdict?.winnerId);
  const formattedDate = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const debateUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "");

  // Construction des fiches d'interventions avec bouton de copie individuel
  const speechesHtml = messages.map((m, idx) => {
    const rawSpeechText = `[#${idx + 1} ${m.agentName} - ${m.agentRole} (${m.time})]\n\n${m.content}`;
    const escapedContent = formatContentToHtml(m.content);
    return `
      <article class="speech-card" data-agent="${escapeHtml(m.agentId)}" data-index="${idx + 1}" style="--agent-color: ${m.agentColor};">
        <header class="speech-header">
          <div class="speech-author">
            <span class="speech-avatar" style="background: ${m.agentDim}; border-color: ${m.agentBorder}; color: ${m.agentColor};">
              ${escapeHtml(m.agentSymbol || "◆")}
            </span>
            <div>
              <div class="speech-name-row">
                <span class="speech-number">#${idx + 1}</span>
                <strong class="speech-name" style="color: ${m.agentColor};">${escapeHtml(m.agentName)}</strong>
                <span class="speech-badge">${escapeHtml(m.agentRole)}</span>
              </div>
              <div class="speech-meta">${escapeHtml(m.time)}</div>
            </div>
          </div>
          <button 
            type="button" 
            class="btn-copy-single" 
            onclick="copySingleSpeech(this, ${escapeHtml(JSON.stringify(rawSpeechText))})" 
            title="Copier cette intervention uniquement"
          >
            <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copier</span>
          </button>
        </header>
        <div class="speech-body">
          ${escapedContent}
        </div>
      </article>
    `;
  }).join("\n");

  // Tableau des scores du jury si disponible
  let scoresHtml = "";
  if (verdict?.agentScores && Object.keys(verdict.agentScores).length > 0) {
    const rows = Object.entries(verdict.agentScores).map(([agentKey, score]) => {
      const badge = verdict.agentBadges?.[agentKey] || "";
      const isWinner = verdict.winnerId === agentKey;
      return `
        <tr class="${isWinner ? 'score-winner' : ''}">
          <td style="font-weight: bold; text-transform: uppercase;">${escapeHtml(agentKey)} ${isWinner ? '🏆' : ''}</td>
          <td>${escapeHtml(badge)}</td>
          <td style="text-align: right; font-weight: bold; font-family: monospace;">${score}/100</td>
        </tr>
      `;
    }).join("");

    scoresHtml = `
      <div class="scores-table-wrapper">
        <h4 style="margin: 16px 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
          Barème et Évaluation du Jury
        </h4>
        <table class="scores-table">
          <thead>
            <tr>
              <th>Orateur IA</th>
              <th>Mention du Jury</th>
              <th style="text-align: right;">Note Globale</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Traité universel si présent
  let treatyHtml = "";
  if (treaty && treaty.title) {
    const clausesHtml = (treaty.clauses || []).map((c: any, i: number) => `
      <li style="margin-bottom: 8px;">
        <strong>Clause ${i + 1} : ${escapeHtml(c.title || '')}</strong> — ${escapeHtml(c.text || '')}
      </li>
    `).join("");

    treatyHtml = `
      <section class="treaty-box">
        <div class="treaty-header">
          <span class="treaty-badge">🕊️ PACTE DE CONVERGENCE UNIVERSEL</span>
          <h3 style="margin: 6px 0; color: #38bdf8;">${escapeHtml(treaty.title)}</h3>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: var(--text-muted);">${escapeHtml(treaty.preamble || '')}</p>
        </div>
        <ol style="padding-left: 20px; font-size: 14px; line-height: 1.5;">
          ${clausesHtml}
        </ol>
      </section>
    `;
  }

  return `<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Procès-verbal officiel du débat : ${escapeHtml(topic.title)}">
  <title>IADébat : ${escapeHtml(topic.title)} (Procès-Verbal Officiel)</title>
  <style>
    :root {
      --bg-canvas: #090a0f;
      --bg-surface: #12141d;
      --bg-surface-alt: #181b26;
      --border-color: rgba(255, 255, 255, 0.1);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #00f5c4;
      --accent-dim: rgba(0, 245, 196, 0.12);
      --verdict-gold: #f59e0b;
      --verdict-gold-dim: rgba(245, 158, 11, 0.1);
      --shadow-sm: 0 2px 8px rgba(0,0,0,0.3);
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    html[data-theme="light"] {
      --bg-canvas: #f8fafc;
      --bg-surface: #ffffff;
      --bg-surface-alt: #f1f5f9;
      --border-color: rgba(0, 0, 0, 0.12);
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent: #0284c7;
      --accent-dim: rgba(2, 132, 199, 0.1);
      --verdict-gold: #d97706;
      --verdict-gold-dim: rgba(217, 119, 6, 0.1);
      --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-canvas);
      color: var(--text-main);
      font-family: var(--font-family);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* ─── BARRE D'ACTIONS FLOTTANTE SUPÉRIEURE ─── */
    .top-action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      padding: 10px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .top-action-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .brand-logo {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 800;
      font-size: 14px;
      color: var(--accent);
      text-decoration: none;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .top-action-buttons {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .btn-action {
      background: var(--bg-surface-alt);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-action:hover {
      background: var(--accent-dim);
      border-color: var(--accent);
      color: var(--accent);
    }

    .btn-action.btn-primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #000;
      font-weight: 700;
    }

    .btn-action.btn-primary:hover {
      opacity: 0.9;
    }

    /* ─── FILTRES ET RECHERCHE ─── */
    .filter-bar {
      background: var(--bg-surface-alt);
      border-bottom: 1px solid var(--border-color);
      padding: 8px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .search-input {
      background: var(--bg-canvas);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      min-width: 220px;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--accent);
    }

    .speaker-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .pill {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .pill:hover, .pill.active {
      background: var(--accent-dim);
      border-color: var(--accent);
      color: var(--accent);
    }

    /* ─── CONTENEUR PRINCIPAL ─── */
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 16px 64px 16px;
    }

    /* ─── EN-TÊTE DU PROCÈS-VERBAL ─── */
    .debate-header {
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 24px;
      margin-bottom: 28px;
    }

    .category-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      background: var(--accent-dim);
      border: 1px solid var(--accent);
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
    }

    .debate-title {
      font-size: 28px;
      font-weight: 900;
      line-height: 1.25;
      margin: 0 0 12px 0;
      color: var(--text-main);
    }

    .debate-desc {
      font-size: 15px;
      color: var(--text-muted);
      margin: 0 0 16px 0;
      background: var(--bg-surface);
      border-left: 3px solid var(--accent);
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
    }

    .debate-meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: var(--text-muted);
    }

    /* ─── CARTES SPÉCIALES (VERDICT & SYNTHÈSE) ─── */
    .verdict-box {
      background: var(--verdict-gold-dim);
      border: 1px solid var(--verdict-gold);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      position: relative;
    }

    .verdict-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .verdict-badge {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--verdict-gold);
    }

    .verdict-winner {
      font-size: 20px;
      font-weight: 900;
      color: var(--verdict-gold);
      margin: 0 0 8px 0;
    }

    .summary-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .summary-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .summary-badge {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
    }

    .treaty-box {
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .treaty-badge {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #38bdf8;
    }

    /* ─── TABLEAU DES SCORES ─── */
    .scores-table-wrapper {
      margin-top: 16px;
      overflow-x: auto;
    }

    .scores-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .scores-table th, .scores-table td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .scores-table th {
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
    }

    .score-winner {
      background: rgba(245, 158, 11, 0.15);
      color: var(--verdict-gold);
    }

    /* ─── FICHES DE DISCOURS D'IA ─── */
    .speeches-title {
      font-size: 18px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 32px 0 16px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .speech-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--agent-color);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 18px;
      box-shadow: var(--shadow-sm);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .speech-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .speech-author {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .speech-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 14px;
      flex-shrink: 0;
    }

    .speech-name-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }

    .speech-number {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 700;
    }

    .speech-name {
      font-size: 15px;
    }

    .speech-badge {
      font-size: 10px;
      color: var(--text-muted);
      background: var(--bg-surface-alt);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }

    .speech-meta {
      font-size: 11px;
      color: var(--text-muted);
    }

    .speech-body {
      font-size: 14px;
      line-height: 1.65;
      color: var(--text-main);
    }

    .btn-copy-single {
      background: var(--bg-surface-alt);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }

    .btn-copy-single:hover {
      color: var(--accent);
      border-color: var(--accent);
      background: var(--accent-dim);
    }

    /* ─── TOAST NOTIFICATION ─── */
    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #10b981;
      color: #000;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    /* ─── PIED DE PAGE ─── */
    .debate-footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }

    .debate-footer a {
      color: var(--accent);
      text-decoration: none;
      font-weight: 600;
    }

    /* ─── STYLES D'IMPRESSION CLEAN (PDF / PAPIER) ─── */
    @media print {
      .top-action-bar, .filter-bar, .btn-copy-single, #toast {
        display: none !important;
      }
      body {
        background: #fff !important;
        color: #000 !important;
      }
      .container {
        max-width: 100% !important;
        padding: 0 !important;
      }
      .speech-card, .verdict-box, .summary-box {
        border: 1px solid #ccc !important;
        background: #fff !important;
        box-shadow: none !important;
        page-break-inside: avoid;
        color: #000 !important;
      }
      .speech-body {
        color: #111 !important;
      }
      a { color: #000 !important; text-decoration: underline !important; }
    }
  </style>
</head>
<body>

  <!-- ─── BARRE D'ACTION FIXE SUPÉRIEURE ─── -->
  <aside class="top-action-bar" aria-label="Commandes du procès-verbal">
    <div class="top-action-left">
      <span class="brand-logo">
        <span>🏛️ IADébat</span>
        <span style="font-size: 11px; opacity: 0.7; font-weight: normal;">| Procès-Verbal Officiel</span>
      </span>
    </div>

    <div class="top-action-buttons">
      <!-- Bouton 1 : Copier tout en texte brut -->
      <button type="button" class="btn-action" onclick="copyFullTranscriptText()" title="Copier tout le texte du débat pour le coller n'importe où">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copier tout le texte</span>
      </button>

      <!-- Bouton 2 : Copier en format riche (Word, Gmail, Docs) -->
      <button type="button" class="btn-action btn-primary" onclick="copyFormattedHtmlTranscript()" title="Copie le texte enrichi avec couleurs et mise en page pour Word, Google Docs ou vos e-mails">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Copier en HTML enrichi</span>
      </button>

      <!-- Bouton 3 : Imprimer ou Sauvegarder en PDF -->
      <button type="button" class="btn-action" onclick="window.print()" title="Imprimer ou enregistrer au format PDF">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        <span>Imprimer / PDF</span>
      </button>

      <!-- Bouton 4 : Basculer Thème Clair/Sombre -->
      <button type="button" class="btn-action" onclick="toggleTheme()" title="Basculer entre thème sombre et thème clair">
        <span id="theme-icon">🌓</span>
        <span id="theme-label">Thème</span>
      </button>

      ${debateUrl ? `
      <!-- Bouton 5 : Lien interactif -->
      <button type="button" class="btn-action" onclick="copyDebateUrl('${escapeHtml(debateUrl)}')" title="Copier le lien web de ce débat">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <span>Lien web</span>
      </button>
      ` : ''}
    </div>
  </aside>

  <!-- ─── BARRE DE FILTRE ET DE RECHERCHE ─── -->
  <nav class="filter-bar" aria-label="Recherche et filtres des interventions">
    <input 
      type="search" 
      id="search-input" 
      class="search-input" 
      placeholder="🔍 Rechercher un mot, un argument..." 
      oninput="filterSpeeches()"
      aria-label="Rechercher dans le texte du débat"
    >
    <div class="speaker-pills" id="speaker-pills">
      <button type="button" class="pill active" onclick="setSpeakerFilter('all', this)">Tous (${messages.length})</button>
      <button type="button" class="pill" onclick="setSpeakerFilter('chatgpt', this)">ChatGPT</button>
      <button type="button" class="pill" onclick="setSpeakerFilter('claude', this)">Claude</button>
      <button type="button" class="pill" onclick="setSpeakerFilter('gemini', this)">Gemini</button>
      <button type="button" class="pill" onclick="setSpeakerFilter('deepseek', this)">DeepSeek</button>
      <button type="button" class="pill" onclick="setSpeakerFilter('mistral', this)">Mistral</button>
      <button type="button" class="pill" onclick="setSpeakerFilter('grok', this)">Grok</button>
    </div>
  </nav>

  <!-- ─── DOCUMENT PRINCIPAL ─── -->
  <main class="container" id="transcript-container">
    
    <header class="debate-header">
      <span class="category-badge">${escapeHtml(topic.category)}</span>
      <h1 class="debate-title">${escapeHtml(topic.title)}</h1>
      <div class="debate-desc">${escapeHtml(topic.description)}</div>
      <div class="debate-meta-row">
        <span>📅 Session enregistrée le ${formattedDate} à ${formattedTime}</span>
        <span>🎙️ ${messages.length} interventions d'IA</span>
        <span>⚖️ Débat contradictoire en liberté dialectique</span>
      </div>
    </header>

    ${verdict ? `
    <!-- ─── VERDICT DU JURY ─── -->
    <section class="verdict-box" id="verdict-section">
      <div class="verdict-header">
        <span class="verdict-badge">🏆 VERDICT OFFICIEL DU JURY SUPRÊME</span>
        <button type="button" class="btn-copy-single" onclick="copySectionText('verdict-section')" title="Copier le verdict">
          <span>Copier le verdict</span>
        </button>
      </div>
      <h2 class="verdict-winner">Vainqueur Désigné : ${escapeHtml(winnerName)}</h2>
      <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6;">${escapeHtml(verdict.winnerReason)}</p>
      ${verdict.keyCitation ? `
        <blockquote style="margin: 12px 0; padding-left: 14px; border-left: 3px solid var(--verdict-gold); font-style: italic; color: var(--verdict-gold); font-size: 14px;">
          « ${escapeHtml(verdict.keyCitation)} »
        </blockquote>
      ` : ''}
      ${verdict.critiqueGénérale ? `
        <p style="margin: 12px 0 0 0; font-size: 13px; color: var(--text-muted); font-style: italic;">
          ${escapeHtml(verdict.critiqueGénérale)}
        </p>
      ` : ''}
      ${scoresHtml}
    </section>
    ` : ''}

    ${summary ? `
    <!-- ─── SYNTHÈSE EXÉCUTIVE ─── -->
    <section class="summary-box" id="summary-section">
      <div class="summary-header">
        <span class="summary-badge">📋 SYNTHÈSE EXÉCUTIVE DES DÉBATS</span>
        <button type="button" class="btn-copy-single" onclick="copySectionText('summary-section')" title="Copier la synthèse">
          <span>Copier la synthèse</span>
        </button>
      </div>
      <div style="font-size: 14px; line-height: 1.65; white-space: pre-wrap;">${escapeHtml(summary)}</div>
    </section>
    ` : ''}

    ${treatyHtml}

    <!-- ─── TRANSCRIPTION DES DISCOURS ─── -->
    <h2 class="speeches-title">
      <span>Transcription Intégrale des Échanges</span>
      <span style="font-size: 12px; color: var(--text-muted); font-weight: normal;" id="speeches-count-indicator">
        Affichage de ${messages.length} interventions
      </span>
    </h2>

    <section id="speeches-list">
      ${speechesHtml}
    </section>

    <!-- ─── PIED DE PAGE ─── -->
    <footer class="debate-footer">
      <p>
        Procès-verbal officiel généré par <strong>IADébat — L'Arène Dialectique des Intelligences Artificielles</strong>.<br>
        Ce document est autonome : il ne nécessite aucune connexion Internet et peut être copié, imprimé ou archivé librement.
      </p>
      ${debateUrl ? `
        <p><a href="${escapeHtml(debateUrl)}" target="_blank" rel="noopener noreferrer">Ouvrir la session interactive en ligne →</a></p>
      ` : ''}
    </footer>

  </main>

  <!-- Notification Toast -->
  <div id="toast" role="status" aria-live="polite">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span id="toast-message">Copié dans le presse-papier !</span>
  </div>

  <!-- ─── JAVASCRIPT INTÉGRÉ AUTONOME (ZERO-DEPENDANCE) ─── -->
  <script>
    // Gestion de notification Toast
    function showToast(msg) {
      var toast = document.getElementById("toast");
      var text = document.getElementById("toast-message");
      if (!toast || !text) return;
      text.textContent = msg || "Copié dans le presse-papier !";
      toast.classList.add("show");
      setTimeout(function() {
        toast.classList.remove("show");
      }, 2500);
    }

    // Copie d'une intervention individuelle
    function copySingleSpeech(btn, text) {
      if (!navigator.clipboard) {
        fallbackCopy(text);
        showToast("Texte copié !");
        return;
      }
      navigator.clipboard.writeText(text).then(function() {
        var original = btn.innerHTML;
        btn.innerHTML = '<span>✅ Copié !</span>';
        showToast("Intervention copiée dans le presse-papier !");
        setTimeout(function() {
          btn.innerHTML = original;
        }, 2000);
      }).catch(function() {
        fallbackCopy(text);
        showToast("Texte copié !");
      });
    }

    // Copie d'une section entière (verdict, synthèse)
    function copySectionText(sectionId) {
      var elem = document.getElementById(sectionId);
      if (!elem) return;
      var text = elem.innerText || elem.textContent || "";
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          showToast("Section copiée avec succès !");
        });
      } else {
        fallbackCopy(text);
        showToast("Section copiée avec succès !");
      }
    }

    // Copie intégrale en texte brut
    function copyFullTranscriptText() {
      var container = document.getElementById("transcript-container");
      if (!container) return;
      var text = container.innerText || container.textContent || "";
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          showToast("Transcription complète copiée en texte brut !");
        });
      } else {
        fallbackCopy(text);
        showToast("Transcription complète copiée !");
      }
    }

    // Copie en format HTML enrichi (idéal pour Word, Google Docs, Gmail, Outlook)
    function copyFormattedHtmlTranscript() {
      var container = document.getElementById("transcript-container");
      if (!container) return;

      var plainText = container.innerText || container.textContent || "";
      var richHtml = container.innerHTML;

      if (navigator.clipboard && window.ClipboardItem) {
        var htmlBlob = new Blob([richHtml], { type: "text/html" });
        var textBlob = new Blob([plainText], { type: "text/plain" });
        navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob
          })
        ]).then(function() {
          showToast("Format enrichi copié ! Prêt à coller dans Word, Docs ou Gmail.");
        }).catch(function() {
          navigator.clipboard.writeText(plainText).then(function() {
            showToast("Texte copié dans le presse-papier !");
          });
        });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(plainText).then(function() {
          showToast("Texte copié dans le presse-papier !");
        });
      } else {
        fallbackCopy(plainText);
        showToast("Texte copié !");
      }
    }

    // Copie de l'URL du débat
    function copyDebateUrl(url) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function() {
          showToast("Lien web copié dans le presse-papier !");
        });
      } else {
        fallbackCopy(url);
        showToast("Lien web copié !");
      }
    }

    // Fallback universel si clipboard non supporté
    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }

    // Filtrage dynamique des interventions
    var currentSpeakerFilter = "all";

    function setSpeakerFilter(speakerId, btn) {
      currentSpeakerFilter = speakerId;
      var pills = document.querySelectorAll("#speaker-pills .pill");
      pills.forEach(function(p) { p.classList.remove("active"); });
      if (btn) btn.classList.add("active");
      applyFilters();
    }

    function filterSpeeches() {
      applyFilters();
    }

    function applyFilters() {
      var query = (document.getElementById("search-input").value || "").toLowerCase().trim();
      var cards = document.querySelectorAll(".speech-card");
      var visibleCount = 0;

      cards.forEach(function(card) {
        var agent = card.getAttribute("data-agent");
        var matchSpeaker = (currentSpeakerFilter === "all" || agent === currentSpeakerFilter);
        var cardText = card.textContent.toLowerCase();
        var matchQuery = !query || cardText.indexOf(query) !== -1;

        if (matchSpeaker && matchQuery) {
          card.style.display = "";
          visibleCount++;
        } else {
          card.style.display = "none";
        }
      });

      var indicator = document.getElementById("speeches-count-indicator");
      if (indicator) {
        indicator.textContent = visibleCount + " intervention" + (visibleCount > 1 ? "s" : "") + " visible" + (visibleCount > 1 ? "s" : "");
      }
    }

    // Bascule Thème Clair / Sombre
    function toggleTheme() {
      var current = document.documentElement.getAttribute("data-theme");
      var next = current === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("iadebat_html_theme", next); } catch(e) {}
      updateThemeLabels(next);
      showToast(next === "light" ? "Thème clair activé" : "Thème sombre activé");
    }

    function updateThemeLabels(theme) {
      var icon = document.getElementById("theme-icon");
      var label = document.getElementById("theme-label");
      if (icon) icon.textContent = theme === "light" ? "☀️" : "🌙";
      if (label) label.textContent = theme === "light" ? "Clair" : "Sombre";
    }

    // Initialisation du thème au chargement
    (function() {
      try {
        var saved = localStorage.getItem("iadebat_html_theme");
        if (saved === "light" || saved === "dark") {
          document.documentElement.setAttribute("data-theme", saved);
          updateThemeLabels(saved);
        }
      } catch(e) {}
    })();
  </script>
</body>
</html>`;
}

/**
 * Génère un fragment HTML riche avec styles en ligne,
 * parfaitement optimisé pour être copié directement dans le presse-papier
 * et collé dans Gmail, Word, Google Docs, Outlook ou Apple Mail.
 */
export function generateRichHtmlForClipboard(
  topic: Topic,
  messages: Message[],
  verdict: Verdict | null,
  summary: string | null,
  treaty: any | null,
  shareUrl?: string
): string {
  const winnerName = getWinnerDisplayName(verdict?.winnerId);
  const formattedDate = new Date().toLocaleDateString("fr-FR");

  const speeches = messages.map((m, idx) => `
    <div style="margin-bottom: 20px; padding: 14px 18px; border-radius: 8px; background-color: #f8fafc; border-left: 4px solid ${m.agentColor}; border: 1px solid #e2e8f0;">
      <div style="margin-bottom: 6px; font-size: 13px;">
        <strong style="color: ${m.agentColor}; font-size: 15px;">#${idx + 1} ${escapeHtml(m.agentName)}</strong>
        <span style="color: #64748b; font-size: 12px; margin-left: 8px;">(${escapeHtml(m.agentRole)} · ${escapeHtml(m.time)})</span>
      </div>
      <div style="color: #1e293b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(m.content)}</div>
    </div>
  `).join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 800px; color: #0f172a; line-height: 1.5;">
      <div style="padding-bottom: 16px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
        <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 4px;">${escapeHtml(topic.category)}</span>
        <h1 style="font-size: 24px; font-weight: 800; margin: 8px 0 6px 0; color: #0f172a;">${escapeHtml(topic.title)}</h1>
        <p style="color: #475569; font-size: 14px; margin: 0 0 10px 0;">${escapeHtml(topic.description)}</p>
        <div style="font-size: 12px; color: #64748b;">Session enregistrée le ${formattedDate} · ${messages.length} interventions</div>
      </div>

      ${verdict ? `
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <strong style="color: #b45309; font-size: 14px; text-transform: uppercase;">🏆 Verdict du Jury : Vainqueur ${escapeHtml(winnerName)}</strong>
          <p style="color: #78350f; font-size: 13px; margin: 6px 0 0 0; line-height: 1.5;">${escapeHtml(verdict.winnerReason)}</p>
          ${verdict.keyCitation ? `<blockquote style="margin: 8px 0 0 0; border-left: 2px solid #b45309; padding-left: 10px; font-style: italic; color: #92400e; font-size: 13px;">« ${escapeHtml(verdict.keyCitation)} »</blockquote>` : ''}
        </div>
      ` : ''}

      ${summary ? `
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <strong style="color: #0369a1; font-size: 14px; text-transform: uppercase;">📋 Synthèse Exécutive</strong>
          <p style="color: #334155; font-size: 13px; margin: 6px 0 0 0; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(summary)}</p>
        </div>
      ` : ''}

      <h2 style="font-size: 18px; margin: 24px 0 12px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Transcription des Débats</h2>
      ${speeches}

      <div style="margin-top: 30px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
        Compte-rendu généré par <strong>IADébat</strong>.
        ${shareUrl ? `<br><a href="${escapeHtml(shareUrl)}" style="color: #0284c7; text-decoration: none;">Accéder au débat interactif en ligne</a>` : ''}
      </div>
    </div>
  `;
}

/**
 * Déclenche le téléchargement immédiat du fichier HTML.
 */
export function downloadHtmlFile(filename: string, htmlContent: string) {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Tente un partage natif avec fichier joint via Web Share API (navigator.share avec files).
 * Renvoie true si le partage de fichier est réussi ou pris en charge, false sinon.
 */
export async function shareHtmlFileNative(
  filename: string,
  htmlContent: string,
  title: string,
  text: string
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return false;
  }

  try {
    const cleanFilename = filename.endsWith(".html") ? filename : `${filename}.html`;
    const file = new File([htmlContent], cleanFilename, { type: "text/html" });

    // Vérifie si l'appareil supporte le partage direct de fichiers
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      // L'utilisateur a simplement fermé le panneau de partage natif
      return true;
    }
  }

  return false;
}
