/**
 * staticApi.ts — permet à IA Débat de tourner SANS serveur Node
 * (hébergement statique : alphabette.fr/apps/iadebat/, OVH Perso).
 *
 * En mode statique (build avec VITE_ALPHABETTE_STATIC=1), server.ts est
 * compilé pour le navigateur grâce aux remplaçants de static/shims/ (express,
 * fs, path…) : chaque appel /api/... est traité par le même code que le
 * serveur, dans la page. Les clés IA sont celles que l'utilisateur saisit
 * (en-têtes x-*-api-key) ; archives et partages sont gardés dans ce navigateur.
 * Sans ce mode, rien ne change.
 */
const STATIQUE = (import.meta as any).env?.VITE_ALPHABETTE_STATIC === '1';
const fetchNatif = window.fetch.bind(window);

if (STATIQUE) {
  let pret: Promise<typeof import('./shims/express')> | null = null;
  const charger = () => {
    // server.ts lit process.env / process.cwd() : on lui fournit un « process »
    // vide (aucune clé côté serveur, ce sont celles de l'utilisateur qui servent).
    const g = globalThis as any;
    g.process ??= { env: {}, cwd: () => '' };
    g.process.env ??= {};
    g.process.cwd ??= () => '';
    return (pret ??= import('../server').then(() => import('./shims/express')));
  };

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      const { traiter } = await charger();
      const url = new URL(input, window.location.origin);
      const reponse = await traiter((init?.method || 'GET').toUpperCase(), url, init);
      if (reponse) return reponse;
      return new Response(JSON.stringify({ error: 'Fonction indisponible dans la version hébergée sans serveur.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Appel direct à Anthropic depuis le navigateur : en-tête exigé par l'API.
    const cible = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (cible.startsWith('https://api.anthropic.com/')) {
      const headers = new Headers(init?.headers);
      headers.set('anthropic-dangerous-direct-browser-access', 'true');
      return fetchNatif(input, { ...init, headers });
    }
    return fetchNatif(input, init);
  };
}

export {};
