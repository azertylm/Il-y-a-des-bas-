import React, { useState, useEffect } from "react";
import { 
  Share2, 
  Link2, 
  Copy, 
  Check, 
  Mail, 
  Download, 
  ExternalLink, 
  FileText, 
  Send, 
  X, 
  Globe,
  Sparkles,
  MessageSquare,
  Award,
  CheckCircle2,
  FileCode,
  Eye,
  CheckCheck,
  Printer,
  FileCheck2,
  Laptop,
  Smartphone
} from "lucide-react";
import { Topic, Message, Verdict } from "../types";
import { 
  generateStandaloneHtmlDocument, 
  generateRichHtmlForClipboard, 
  downloadHtmlFile, 
  shareHtmlFileNative,
  getWinnerDisplayName 
} from "../utils/debateHtmlExport";

interface ShareDebateModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic;
  messages: Message[];
  verdict: Verdict | null;
  summary: string | null;
  treaty?: any;
  defaultTab?: "html" | "link" | "email" | "export";
}

export function ShareDebateModal({
  isOpen,
  onClose,
  topic,
  messages,
  verdict,
  summary,
  treaty,
  defaultTab = "html"
}: ShareDebateModalProps) {
  const [shareId, setShareId] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedRichHtml, setCopiedRichHtml] = useState<boolean>(false);
  const [copiedRawHtml, setCopiedRawHtml] = useState<boolean>(false);
  const [downloadedHtmlSuccess, setDownloadedHtmlSuccess] = useState<boolean>(false);
  const [nativeShareSuccess, setNativeShareSuccess] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"html" | "link" | "email" | "export">(defaultTab);
  const [canNativeShare, setCanNativeShare] = useState<boolean>(false);
  const [canShareFiles, setCanShareFiles] = useState<boolean>(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !!navigator.share) {
      setCanNativeShare(true);
      if (typeof File !== "undefined" && navigator.canShare) {
        try {
          const testFile = new File(["test"], "test.html", { type: "text/html" });
          if (navigator.canShare({ files: [testFile] })) {
            setCanShareFiles(true);
          }
        } catch {
          setCanShareFiles(false);
        }
      }
    }
  }, []);

  // Génère ou récupère l'identifiant de partage lors de l'ouverture
  useEffect(() => {
    if (!isOpen) return;

    const generateShareLink = async () => {
      setIsGeneratingLink(true);
      try {
        const payload = {
          topic,
          messages,
          verdict,
          summary,
          treaty,
          closedAt: new Date().toISOString(),
        };

        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          const sid = data.shareId;
          setShareId(sid);
          
          const origin = window.location.origin;
          const url = `${origin}/?share=${sid}`;
          setShareUrl(url);
        } else {
          // Fallback : lien direct basé sur l'URL courante
          const fallbackId = `debat-${Date.now().toString(36)}`;
          setShareId(fallbackId);
          setShareUrl(`${window.location.origin}/?share=${fallbackId}`);
        }
      } catch {
        const fallbackId = `debat-${Date.now().toString(36)}`;
        setShareId(fallbackId);
        setShareUrl(`${window.location.origin}/?share=${fallbackId}`);
      } finally {
        setIsGeneratingLink(false);
      }
    };

    generateShareLink();
  }, [isOpen, topic, messages, verdict, summary, treaty]);

  if (!isOpen) return null;

  const winnerName = getWinnerDisplayName(verdict?.winnerId);
  const cleanFilename = `Debat_IA_${topic.title.slice(0, 35).replace(/[^a-zA-Z0-9]/g, "_")}.html`;

  // Obtenir le contenu HTML complet du débat
  const getFullHtmlContent = () => {
    return generateStandaloneHtmlDocument(topic, messages, verdict, summary, treaty, shareUrl);
  };

  // Construction du texte de compte-rendu pour le presse-papier ou l'email
  const generateFormattedSummary = () => {
    let text = `🏛️ IADÉBAT — COMPTE-RENDU DE DÉBAT\n`;
    text += `Thème : ${topic.title}\n`;
    text += `Catégorie : ${topic.category}\n`;
    text += `Date : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}\n`;
    text += `Nombre d'interventions : ${messages.length}\n\n`;

    if (verdict) {
      text += `🏆 VERDICT DU JURY SUPRÊME :\n`;
      text += `Vainqueur : ${winnerName}\n`;
      if (verdict.winnerReason) text += `Motif : ${verdict.winnerReason}\n`;
      if (verdict.keyCitation) text += `Citation clé : « ${verdict.keyCitation} »\n`;
      text += `\n`;
    }

    if (summary) {
      text += `📋 SYNTHÈSE DES ÉCHANGES :\n${summary}\n\n`;
    }

    text += `🔗 Consulter le débat complet en ligne avec toutes les répliques des IA :\n${shareUrl || window.location.href}\n`;
    return text;
  };

  // Téléchargement immédiat du fichier HTML
  const handleDownloadHtml = () => {
    const htmlContent = getFullHtmlContent();
    downloadHtmlFile(cleanFilename, htmlContent);
    setDownloadedHtmlSuccess(true);
    setTimeout(() => setDownloadedHtmlSuccess(false), 3000);
  };

  // Envoi direct du fichier HTML via Web Share API
  const handleSendHtmlFileNative = async () => {
    const htmlContent = getFullHtmlContent();
    const title = `IADébat : ${topic.title}`;
    const desc = `Procès-verbal officiel du débat contradictoire entre IA sur "${topic.title}". Vainqueur : ${winnerName}.`;

    const shared = await shareHtmlFileNative(cleanFilename, htmlContent, title, desc);
    if (shared) {
      setNativeShareSuccess(true);
      setTimeout(() => setNativeShareSuccess(false), 3000);
    } else {
      // Si l'appareil ne supporte pas l'envoi de fichier par l'API native, on télécharge le fichier
      handleDownloadHtml();
    }
  };

  // Copie au format HTML riche dans le presse-papier (Word, Gmail, Outlook, Docs)
  const handleCopyRichHtml = async () => {
    try {
      const richHtml = generateRichHtmlForClipboard(topic, messages, verdict, summary, treaty, shareUrl);
      const plainText = generateFormattedSummary();

      if (typeof ClipboardItem !== "undefined" && navigator.clipboard && navigator.clipboard.write) {
        const htmlBlob = new Blob([richHtml], { type: "text/html" });
        const textBlob = new Blob([plainText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          })
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }

      setCopiedRichHtml(true);
      setTimeout(() => setCopiedRichHtml(false), 3000);
    } catch {
      // Fallback
      await navigator.clipboard.writeText(generateFormattedSummary());
      setCopiedRichHtml(true);
      setTimeout(() => setCopiedRichHtml(false), 3000);
    }
  };

  // Copie du code source HTML brut
  const handleCopyRawHtml = async () => {
    const htmlContent = getFullHtmlContent();
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopiedRawHtml(true);
      setTimeout(() => setCopiedRawHtml(false), 2500);
    } catch {}
  };

  // Ouvrir le fichier HTML dans un nouvel onglet pour le tester
  const handleOpenHtmlNewTab = () => {
    const htmlContent = getFullHtmlContent();
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Copie du lien direct
  const handleCopyLink = async () => {
    const urlToCopy = shareUrl || `${window.location.origin}/?share=${shareId}`;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  // Copie du texte brut
  const handleCopyTextReport = async () => {
    const text = generateFormattedSummary();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {}
  };

  // Partage natif simple de lien
  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `IADébat : ${topic.title}`,
        text: `Découvrez le résultat du débat opposant les grandes IA sur : "${topic.title}". Vainqueur : ${winnerName}.`,
        url: shareUrl || window.location.href,
      });
    } catch {}
  };

  // Envoi par email (mailto)
  const handleSendEmail = () => {
    const subject = encodeURIComponent(`[IADébat] Résultat du débat : « ${topic.title} »`);
    const bodyContent = generateFormattedSummary();
    const body = encodeURIComponent(bodyContent);
    const to = recipientEmail ? encodeURIComponent(recipientEmail.trim()) : "";
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  // Email avec suggestion d'attachement de fichier HTML
  const handleEmailWithHtmlInstruction = () => {
    handleDownloadHtml();
    setTimeout(() => {
      handleSendEmail();
    }, 500);
  };

  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(
      `🏛️ *IADébat* : Grand débat entre IA sur « ${topic.title} »\n🏆 Vainqueur : ${winnerName}\n\n👉 Lis l'intégralité du débat et le verdict ici :\n${shareUrl || window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Confrontation dialectique passionnante entre les grandes IA sur « ${topic.title} » ! Découvre le verdict du jury et la synthèse ici :`
    );
    const url = encodeURIComponent(shareUrl || window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=IADebat,IA,Philosophie`, "_blank");
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(shareUrl || window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const handleDownloadMarkdown = () => {
    let md = `# ${topic.title}\n\n`;
    md += `> **Catégorie** : ${topic.category}  \n`;
    md += `> **Date de session** : ${new Date().toLocaleDateString("fr-FR")}  \n`;
    md += `> **Lien permanent du débat** : ${shareUrl || window.location.href}\n\n`;
    md += `## Problématique\n\n${topic.description}\n\n`;

    if (verdict) {
      md += `## 🏆 Verdict du Jury Suprême\n\n`;
      md += `- **Grand Vainqueur** : **${winnerName}**\n`;
      md += `- **Motivation du jury** : ${verdict.winnerReason}\n`;
      if (verdict.keyCitation) md += `- **Citation fondatrice** : « *${verdict.keyCitation}* »\n`;
      md += `\n`;
    }

    if (summary) {
      md += `## 📋 Synthèse Exécutive\n\n${summary}\n\n`;
    }

    md += `## 🎙️ Transcription des Interventions\n\n`;
    messages.forEach((m, idx) => {
      md += `### #${idx + 1} — ${m.agentName} (${m.agentRole}) — ${m.time}\n\n`;
      md += `${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IADebat-${topic.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0c10] border border-white/15 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f5c4]/20 via-blue-500/20 to-purple-500/20 border border-[#00f5c4]/40 flex items-center justify-center text-[#00f5c4] shadow-sm">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Partager & Envoyer le Débat</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#00f5c4]/15 text-[#00f5c4] border border-[#00f5c4]/30">
                  Fichier HTML & Partage
                </span>
              </h2>
              <p className="text-xs text-gray-400 truncate max-w-xs sm:max-w-md">
                {topic.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Fermer la fenêtre"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Onglets */}
        <div className="flex border-b border-white/10 bg-black/40 px-3 sm:px-5 pt-2 gap-1 sm:gap-2 text-xs font-semibold overflow-x-auto">
          {/* Onglet 1 : Fichier HTML (Envoi & Copie) */}
          <button
            onClick={() => setActiveTab("html")}
            className={`pb-2.5 px-2.5 sm:px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "html"
                ? "border-[#00f5c4] text-[#00f5c4] font-bold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-[#00f5c4]" />
            <span>Fichier HTML (Envoi & Copie)</span>
          </button>

          {/* Onglet 2 : Lien direct & Réseaux */}
          <button
            onClick={() => setActiveTab("link")}
            className={`pb-2.5 px-2.5 sm:px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "link"
                ? "border-[#00f5c4] text-[#00f5c4] font-bold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Lien en ligne</span>
          </button>

          {/* Onglet 3 : Envoyer par email */}
          <button
            onClick={() => setActiveTab("email")}
            className={`pb-2.5 px-2.5 sm:px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "email"
                ? "border-[#00f5c4] text-[#00f5c4] font-bold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-mail direct</span>
          </button>

          {/* Onglet 4 : Markdown & Texte */}
          <button
            onClick={() => setActiveTab("export")}
            className={`pb-2.5 px-2.5 sm:px-3 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === "export"
                ? "border-[#00f5c4] text-[#00f5c4] font-bold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown / Texte</span>
          </button>
        </div>

        {/* Corps de la modal selon l'onglet */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">

          {/* ──── ONGLET 1 : FICHIER HTML (ENVOI & COPIER-COLLER) ──── */}
          {activeTab === "html" && (
            <div className="space-y-4">
              
              {/* Carte informative principale */}
              <div className="bg-gradient-to-r from-[#00f5c4]/10 via-blue-900/20 to-purple-900/10 border border-[#00f5c4]/30 rounded-xl p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00f5c4] flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-[#00f5c4]" />
                    <span>Fichier HTML Autonome & Interactif</span>
                  </span>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-gray-300">
                    {messages.length} interventions · Verdict inclus
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Envoyez ou téléchargez ce fichier HTML complet. Tout destinataire peut l'ouvrir en un double-clic dans n'importe quel navigateur (Chrome, Safari, Edge, Firefox), sans connexion Internet, et y retrouvera des <strong>boutons interactifs pour copier l'ensemble du débat, copier des répliques individuelles, filtrer par IA ou imprimer en PDF</strong>.
                </p>
              </div>

              {/* Bloc d'actions prioritaires pour envoyer et copier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* 1. Envoyer le fichier HTML (Web Share API) */}
                <div className="bg-black/60 border border-white/10 hover:border-[#00f5c4]/40 rounded-xl p-3.5 flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-[#00f5c4] font-bold text-xs mb-1">
                      <Send className="w-4 h-4" />
                      <span>Envoyer le Fichier HTML</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug mb-3">
                      {canShareFiles 
                        ? "Ouvre le partage natif (AirDrop, Mail, WhatsApp, Messages) avec le fichier HTML en pièce jointe."
                        : "Télécharge le fichier HTML (.html) prêt à être transmis par e-mail, messagerie ou clé USB."
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleSendHtmlFileNative}
                    className="w-full py-2.5 px-3 rounded-lg bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#00f5c4]/20 cursor-pointer transition-all"
                  >
                    {nativeShareSuccess ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Partage lancé !</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{canShareFiles ? "Envoyer le fichier HTML" : "Télécharger le fichier HTML"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. Télécharger le fichier HTML direct */}
                <div className="bg-black/60 border border-white/10 hover:border-blue-400/40 rounded-xl p-3.5 flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
                      <Download className="w-4 h-4" />
                      <span>Télécharger (.html)</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug mb-3">
                      Enregistre le document sur votre appareil avec le nom <code>{cleanFilename}</code>.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadHtml}
                    className="w-full py-2.5 px-3 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {downloadedHtmlSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                        <span className="text-emerald-300">Fichier téléchargé !</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger le document HTML</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Section Spéciale : COPIER-COLLER POUR DOCUMENTS & MAILS */}
              <div className="bg-[#12141e] border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copier-Coller Immédiat (Format Enrichi & Brut)</span>
                  </div>
                  <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                    Word · Docs · Gmail · Outlook
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Cliquez ci-dessous pour copier le débat directement dans votre presse-papier. En collant (<kbd className="bg-black/50 px-1 py-0.5 rounded border border-white/10 text-[10px]">Ctrl+V</kbd> ou <kbd className="bg-black/50 px-1 py-0.5 rounded border border-white/10 text-[10px]">Cmd+V</kbd>) dans votre traitement de texte ou votre boîte mail, <strong>toutes les cartes des orateurs, les couleurs et les mentions du verdict sont parfaitement conservées</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCopyRichHtml}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                      copiedRichHtml
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold"
                        : "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {copiedRichHtml ? (
                      <>
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        <span>Format enrichi copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier en HTML enrichi (Word/Gmail)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopyRawHtml}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                      copiedRawHtml
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold"
                        : "bg-white/5 hover:bg-white/10 border-white/15 text-gray-200"
                    }`}
                    title="Copie le code source HTML complet pour l'insérer dans un blog ou un site web"
                  >
                    {copiedRawHtml ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Code source copié !</span>
                      </>
                    ) : (
                      <>
                        <FileCode className="w-3.5 h-3.5 text-gray-400" />
                        <span>Copier le code source HTML</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bouton pour tester et prévisualiser dans un nouvel onglet */}
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#00f5c4] shrink-0" />
                  <span>Envie de vérifier le rendu du fichier avant de l'envoyer ?</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleOpenHtmlNewTab}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvrir & tester le fichier HTML</span>
                  </button>
                </div>
              </div>

              {/* Guide rapide d'envoi par e-mail avec fichier joint */}
              <div className="border border-white/10 rounded-xl p-3.5 bg-[#090a0f] space-y-2">
                <div className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#00f5c4]" />
                  <span>Comment l'envoyer par e-mail à vos contacts :</span>
                </div>
                <div className="text-[11px] text-gray-400 space-y-1 pl-1 leading-relaxed">
                  <div>1. Cliquez sur <strong>« Télécharger le document HTML »</strong> pour obtenir le fichier.</div>
                  <div>2. Cliquez sur <strong>« Ouvrir mon logiciel e-mail »</strong> : votre message sera pré-rempli avec le sujet et le résumé officiel.</div>
                  <div>3. Glissez-déposez le fichier <code>.html</code> téléchargé en pièce jointe, puis envoyez !</div>
                </div>
                <button
                  onClick={handleEmailWithHtmlInstruction}
                  className="mt-1 text-xs text-[#00f5c4] hover:underline flex items-center gap-1 font-bold cursor-pointer bg-transparent border-none p-0"
                >
                  <span>→ Télécharger et ouvrir mon logiciel e-mail en 1 clic</span>
                </button>
              </div>

            </div>
          )}

          {/* ──── ONGLET 2 : LIEN EN LIGNE & RÉSEAUX ──── */}
          {activeTab === "link" && (
            <div className="space-y-4">
              {/* Carte lien direct */}
              <div className="bg-black/60 border border-white/10 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#00f5c4] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Lien permanent du débat partagé</span>
                  </label>
                  {isGeneratingLink && (
                    <span className="text-[11px] text-gray-400 animate-pulse">Génération du lien sécurisé...</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl || "Génération du lien en cours..."}
                    className="flex-1 bg-[#15171e] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 select-all focus:outline-none focus:border-[#00f5c4]/60"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                      copiedLink
                        ? "bg-emerald-500 text-black font-extrabold"
                        : "bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-bold shadow-md shadow-[#00f5c4]/20"
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Toute personne ouvrant ce lien accèdera directement à la transcription interactive de ce débat, au verdict du jury et à la synthèse officielle.
                </p>
              </div>

              {/* Bouton Partage Natif Mobile / Système si supporté */}
              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Partager via les applications de votre appareil (AirDrop, SMS, Messageries...)</span>
                </button>
              )}

              {/* Boutons de Partage Réseaux & Messageries */}
              <div>
                <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2.5">
                  Partager instantanément sur :
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="p-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleShareTwitter}
                    className="p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-sky-400" />
                    <span>X (Twitter)</span>
                  </button>

                  <button
                    onClick={handleShareLinkedIn}
                    className="p-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-600/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <span>LinkedIn</span>
                  </button>

                  <button
                    onClick={handleCopyTextReport}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    title="Copie le texte complet du débat prêt à être collé dans Discord, Slack ou Teams"
                  >
                    {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    <span>{copiedText ? "Copié !" : "Discord / Slack"}</span>
                  </button>
                </div>
              </div>

              {/* Aperçu Synthétique */}
              <div className="bg-[#12141a] border border-white/5 rounded-xl p-3 text-xs space-y-1.5">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Aperçu de la session partagée</span>
                </div>
                <div className="text-gray-200 font-medium">
                  {topic.title}
                </div>
                <div className="text-gray-400 text-[11px] flex items-center gap-2">
                  <span>{messages.length} répliques d'IA</span>
                  <span>•</span>
                  <span>Vainqueur désigné : <strong className="text-amber-400">{winnerName}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* ──── ONGLET 3 : ENVOYER PAR EMAIL ──── */}
          {activeTab === "email" && (
            <div className="space-y-4">
              <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Adresse e-mail du destinataire (facultatif)
                  </label>
                  <input
                    type="email"
                    placeholder="collegue@exemple.com, equipe@entreprise.fr..."
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    className="w-full bg-[#15171e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f5c4]/60"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={handleSendEmail}
                    className="flex-1 bg-[#00f5c4] hover:bg-[#00e0b0] text-black font-extrabold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ouvrir dans mon logiciel e-mail</span>
                  </button>
                  <button
                    onClick={handleCopyRichHtml}
                    className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {copiedRichHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRichHtml ? "Format enrichi copié !" : "Copier le texte enrichi pour e-mail"}</span>
                  </button>
                </div>
              </div>

              {/* Aperçu du contenu du mail */}
              <div className="bg-[#12141c] border border-white/10 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Contenu textuel pré-rédigé du message :
                </div>
                <div className="bg-black/50 p-3 rounded-lg text-[11px] font-mono text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border border-white/5">
                  {generateFormattedSummary()}
                </div>
              </div>
            </div>
          )}

          {/* ──── ONGLET 4 : TÉLÉCHARGEMENT & MARKDOWN ──── */}
          {activeTab === "export" && (
            <div className="space-y-3.5">
              <p className="text-xs text-gray-300">
                Vous pouvez également exporter et archiver le compte-rendu sous format Markdown ou texte brut :
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Rapport Markdown */}
                <div className="bg-black/50 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between hover:border-purple-400/40 transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                      <FileText className="w-4 h-4" />
                      <span>Rapport Markdown (.md)</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      Idéal pour Notion, Obsidian, GitHub, ou intégration dans vos wikis et bases de connaissances.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="w-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger (.md)</span>
                  </button>
                </div>

                {/* Procès-verbal HTML */}
                <div className="bg-black/50 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between hover:border-[#00f5c4]/40 transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-[#00f5c4] font-bold text-xs">
                      <FileCode className="w-4 h-4" />
                      <span>Procès-Verbal HTML (.html)</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      Fichier HTML complet avec boutons de copie interactifs, filtres par IA et mode impression PDF.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadHtml}
                    className="w-full bg-[#00f5c4]/15 hover:bg-[#00f5c4]/25 border border-[#00f5c4]/40 text-[#00f5c4] text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger (.html)</span>
                  </button>
                </div>
              </div>

              {/* Copie directe Presse-papier texte brut */}
              <div className="bg-[#12141d] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-gray-200">Copier le texte brut formaté</div>
                  <div className="text-[11px] text-gray-400">Pour coller rapidement dans un document Word ou Bloc-notes.</div>
                </div>
                <button
                  onClick={handleCopyTextReport}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00f5c4]" />
            <span>Document autonome · Format prêt à copier-coller</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}

