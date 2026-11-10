/** Fichiers du serveur (archives, partages, comptes) rangés dans le navigateur. */
const cle = (p: unknown) => `iadebat-fichier:${String(p).split('/').pop()}`;
export function existsSync(p: unknown): boolean {
  try { return localStorage.getItem(cle(p)) !== null; } catch { return false; }
}
export function readFileSync(p: unknown): string {
  const v = localStorage.getItem(cle(p));
  if (v === null) throw new Error(`Fichier introuvable : ${String(p)}`);
  return v;
}
export function writeFileSync(p: unknown, donnees: unknown): void {
  localStorage.setItem(cle(p), String(donnees));
}
export default { existsSync, readFileSync, writeFileSync };
