import React, { useState, useEffect } from 'react';
import {
  Cloud,
  FolderSync,
  FileText,
  Trash2,
  ExternalLink,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  LogOut,
  Sparkles,
  Layers,
  FileCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
} from '../services/googleDriveAuth';
import {
  DriveFileItem,
  getOrCreateIadebatFolder,
  uploadTextFileToDrive,
  listIadebatFiles,
  downloadFileContent,
  deleteDriveFile,
} from '../services/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDebateData: {
    topicTitle: string;
    topicDescription: string;
    messages: Array<{
      agentName: string;
      agentId: string;
      content: string;
      timestamp: number;
    }>;
    verdict?: any;
    summary?: string;
  };
  onImportDebateTopic?: (title: string, description: string) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentDebateData,
  onImportDebateTopic,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'scope_error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Destructive delete confirmation modal state
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // File preview
  const [previewContent, setPreviewContent] = useState<{ name: string; content: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Initialize Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files when token is available and modal is open
  useEffect(() => {
    if (isOpen && token) {
      loadDriveFiles(token);
    }
  }, [isOpen, token]);

  const loadDriveFiles = async (accessToken: string) => {
    setIsLoadingFiles(true);
    setStatusMessage(null);
    try {
      const fId = await getOrCreateIadebatFolder(accessToken);
      setFolderId(fId);
      const driveFiles = await listIadebatFiles(accessToken, fId);
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Erreur chargement fichiers Drive:', err);
      if (
        err?.code === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' ||
        err?.message?.includes('Permissions Google Drive') ||
        err?.message?.includes('insufficient authentication scopes') ||
        err?.message?.includes('insufficientPermissions')
      ) {
        setStatusMessage({
          type: 'scope_error',
          text: "Autorisations Google Drive manquantes : Votre session Google actuelle ne dispose pas des droits d'accès aux fichiers Google Drive.",
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Erreur lors de la communication avec Google Drive : ${err.message || err}`,
        });
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async (forceConsent: boolean = true) => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn(forceConsent);
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        await loadDriveFiles(res.accessToken);
        setStatusMessage({
          type: 'success',
          text: `Connexion réussie ! Connecté en tant que ${res.user.displayName || res.user.email}`,
        });
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        // User closed the popup, no error alert needed
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setStatusMessage({
          type: 'error',
          text: `La fenêtre contextuelle de connexion a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up pour cette page.`,
        });
        return;
      }
      console.error('Erreur de connexion:', err);
      setStatusMessage({
        type: 'error',
        text: `La connexion Google Drive a échoué : ${err.message || 'Vérifiez vos autorisations'}`,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setUser(null);
      setToken(null);
      setFiles([]);
      setStatusMessage({
        type: 'success',
        text: 'Déconnexion réussie de Google Drive.',
      });
    } catch (err: any) {
      console.error('Erreur déconnexion:', err);
    }
  };

  const handleExportCurrentDebate = async () => {
    if (!token) {
      setStatusMessage({ type: 'error', text: 'Veuillez vous connecter à Google Drive au préalable.' });
      return;
    }

    if (!currentDebateData.messages || currentDebateData.messages.length === 0) {
      setStatusMessage({ type: 'error', text: 'Le débat actuel ne contient aucun message à exporter.' });
      return;
    }

    setIsExporting(true);
    setStatusMessage(null);

    try {
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const cleanTitle = (currentDebateData.topicTitle || 'Debat-IADÉBAT')
        .replace(/[^a-zA-Z0-9À-ÿ-_ ]/g, '')
        .trim()
        .slice(0, 40);
      const fileName = `IADEBAT_${cleanTitle}_${dateStr}.md`;

      // Build comprehensive markdown content
      let md = `# 🏛️ IADÉBAT — Retranscription Officielle de Séance\n\n`;
      md += `**Sujet** : ${currentDebateData.topicTitle}\n\n`;
      md += `**Problématique** : ${currentDebateData.topicDescription}\n\n`;
      md += `**Date d'archivage** : ${new Date().toLocaleString('fr-FR')}\n\n`;
      md += `**Participants** : ${Array.from(new Set(currentDebateData.messages.map((m) => m.agentName))).join(', ')}\n\n`;
      md += `---\n\n## 📜 Déroulement des Interventions\n\n`;

      currentDebateData.messages.forEach((msg, idx) => {
        const time = new Date(msg.timestamp).toLocaleTimeString('fr-FR');
        md += `### ${idx + 1}. [${time}] **${msg.agentName}**\n\n`;
        md += `${msg.content}\n\n`;
        md += `---\n\n`;
      });

      if (currentDebateData.verdict) {
        md += `## ⚖️ Verdict & Arbitrage du Tribunal\n\n`;
        md += `**Vainqueur proclamé** : ${currentDebateData.verdict.winner || 'Non spécifié'}\n\n`;
        md += `**Décision** : ${currentDebateData.verdict.decision || ''}\n\n`;
        if (currentDebateData.verdict.breakdown) {
          md += `### Scores d'Éloquence :\n`;
          Object.entries(currentDebateData.verdict.breakdown).forEach(([k, v]) => {
            md += `- **${k}** : ${v}/100\n`;
          });
          md += `\n`;
        }
      }

      if (currentDebateData.summary) {
        md += `## 📑 Synthèse Analytique & Consensus\n\n`;
        md += `${currentDebateData.summary}\n\n`;
      }

      md += `\n*Document généré automatiquement par IADÉBAT — Le Sénat des IA.*\n`;

      const targetFolderId = folderId || (await getOrCreateIadebatFolder(token));
      const uploadedFile = await uploadTextFileToDrive({
        fileName,
        content: md,
        mimeType: 'text/markdown',
        accessToken: token,
        folderId: targetFolderId,
      });

      setStatusMessage({
        type: 'success',
        text: `Débat sauvegardé avec succès dans Google Drive : "${uploadedFile.name}" !`,
      });

      await loadDriveFiles(token);
    } catch (err: any) {
      console.error('Erreur export Drive:', err);
      setStatusMessage({
        type: 'error',
        text: `Échec de la sauvegarde sur Google Drive : ${err.message || err}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenPreview = async (file: DriveFileItem) => {
    if (!token) return;
    setIsLoadingPreview(true);
    try {
      const content = await downloadFileContent(file.id, token);
      setPreviewContent({ name: file.name, content });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Impossible de charger le contenu du fichier : ${err.message || err}`,
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete || !token) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id, token);
      setStatusMessage({
        type: 'success',
        text: `Le fichier "${fileToDelete.name}" a été définitivement supprimé de votre Google Drive.`,
      });
      setFileToDelete(null);
      await loadDriveFiles(token);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Échec de la suppression : ${err.message || err}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="google-drive-modal-card"
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Google Drive Archives & Synchronisation
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                  Workspace
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sauvegardez vos débats, verdicts et traités directement sur votre compte Google Drive personnel.
              </p>
            </div>
          </div>
          <button
            id="close-google-drive-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-sm flex flex-col sm:flex-row items-start gap-3 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : statusMessage.type === 'scope_error'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                )}
                <div className="flex-1 space-y-2">
                  <div>{statusMessage.text}</div>
                  {statusMessage.type === 'scope_error' && (
                    <div>
                      <button
                        onClick={() => handleSignIn(true)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Accorder l'accès Google Drive</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-white text-xs underline self-start sm:self-auto cursor-pointer"
              >
                Fermer
              </button>
            </div>
          )}

          {/* User Auth Section */}
          {!user ? (
            <div className="p-8 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Cloud className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-semibold text-white">Connexion à votre espace Google Drive</h3>
                <p className="text-xs text-slate-400">
                  Connectez-vous pour exporter en un clic vos retranscriptions de débats, accords diplomatiques et
                  verdicts dans un dossier dédié sur votre Google Drive.
                </p>
              </div>

              {/* Official Google Sign-in Button */}
              <div className="pt-2 flex justify-center">
                <button
                  id="google-sign-in-btn"
                  onClick={handleSignIn}
                  disabled={isLoggingIn}
                  className="group relative inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-white text-slate-800 font-medium text-sm shadow-md hover:shadow-lg hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isLoggingIn ? 'Connexion en cours...' : 'Se connecter avec Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connected User Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      {user.displayName || 'Utilisateur Google'}
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="refresh-drive-files-btn"
                    onClick={() => token && loadDriveFiles(token)}
                    disabled={isLoadingFiles}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs flex items-center gap-1.5 transition-colors"
                    title="Actualiser les fichiers"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                    <span>Actualiser</span>
                  </button>
                  <button
                    id="logout-google-btn"
                    onClick={handleSignOut}
                    className="p-2 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>

              {/* Action: Export Current Debate */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-blue-400" />
                    Sauvegarder la session active dans Drive
                  </div>
                  <p className="text-xs text-slate-400">
                    Sujet actuel :{' '}
                    <span className="text-blue-300 font-medium italic">
                      "{currentDebateData.topicTitle || 'Aucun débat sélectionné'}"
                    </span>{' '}
                    ({currentDebateData.messages?.length || 0} messages)
                  </p>
                </div>

                <button
                  id="export-current-debate-btn"
                  onClick={handleExportCurrentDebate}
                  disabled={isExporting || !currentDebateData.messages || currentDebateData.messages.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <FolderSync className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
                  <span>{isExporting ? 'Sauvegarde en cours...' : 'Sauvegarder dans Drive'}</span>
                </button>
              </div>

              {/* File List Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Documents archivés dans le dossier "IADÉBAT" ({files.length})
                  </h4>
                  {folderId && (
                    <a
                      href={`https://drive.google.com/drive/folders/${folderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                    >
                      <span>Ouvrir le dossier Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {isLoadingFiles ? (
                  <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                    <span>Chargement de vos fichiers Google Drive...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs text-slate-400">Aucun fichier IADÉBAT trouvé sur votre Google Drive.</p>
                    <p className="text-[11px] text-slate-500">
                      Cliquez sur "Sauvegarder dans Drive" ci-dessus pour archiver votre premier débat !
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-200 truncate">{file.name}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>
                                Modifié le{' '}
                                {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('fr-FR') : 'Récemment'}
                              </span>
                              {file.size && <span>• {(parseInt(file.size, 10) / 1024).toFixed(1)} Ko</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenPreview(file)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
                            title="Aperçu & lecture du document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                              title="Ouvrir dans Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs transition-colors"
                            title="Supprimer de Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Preview Box */}
          {previewContent && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="text-xs font-semibold text-white flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Aperçu : {previewContent.name}</span>
                </div>
                <button
                  onClick={() => setPreviewContent(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Fermer
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar text-xs text-slate-300 font-mono bg-slate-900/80 p-3 rounded-lg whitespace-pre-wrap">
                {previewContent.content}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Google Drive v3 API • Synchronisation sécurisée</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Mandatory Destructive Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div
            id="delete-confirmation-dialog"
            className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Confirmation de suppression</h3>
              <p className="text-xs text-slate-300">
                Êtes-vous absolument sûr de vouloir supprimer le fichier suivant de votre compte Google Drive ?
              </p>
              <div className="mt-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-red-300 truncate">
                {fileToDelete.name}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Cette action est irréversible et supprimera définitivement l'archive sélectionnée de votre Google Drive.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="cancel-delete-drive-file-btn"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                id="confirm-delete-drive-file-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/30 transition-all flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Suppression...' : 'Supprimer définitivement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
