/** Une requête annulée volontairement n'est pas une panne : on la distingue. */
export function isAbort(error: any): boolean {
  return error?.name === "AbortError";
}

/** Tronque sur une frontière de mot, et n'ajoute les points de suspension que si nécessaire. */
export function excerpt(text: string, maxLength: number): string {
  const clean = text.trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
