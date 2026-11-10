/**
 * Mini-Express pour le navigateur (version hébergée sans serveur).
 * server.ts est compilé tel quel pour le navigateur : ses app.get/post/delete
 * remplissent la table ROUTES, que static/staticApi.ts interroge à la place
 * d'un vrai serveur.
 */
type Handler = (req: any, res: any, next?: () => void) => any;
interface Route { methode: string; motif: RegExp; cles: string[]; handler: Handler }

export const ROUTES: Route[] = [];

function compiler(chemin: string): { motif: RegExp; cles: string[] } {
  if (chemin === '*') return { motif: /^.*$/, cles: [] };
  const cles: string[] = [];
  const source = chemin
    .split('/')
    .map((seg) => (seg.startsWith(':') ? (cles.push(seg.slice(1)), '([^/]+)') : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return { motif: new RegExp(`^${source}/?$`), cles };
}

function enregistrer(methode: string) {
  return (chemin: string | string[], ...handlers: Handler[]) => {
    for (const c of Array.isArray(chemin) ? chemin : [chemin]) {
      if (typeof c !== 'string') continue;
      ROUTES.push({ methode, ...compiler(c), handler: handlers[handlers.length - 1] });
    }
  };
}

function express() {
  return {
    get: enregistrer('GET'),
    post: enregistrer('POST'),
    put: enregistrer('PUT'),
    patch: enregistrer('PATCH'),
    delete: enregistrer('DELETE'),
    use: () => {},
    listen: (_port: unknown, _hote?: unknown, rappel?: () => void) => {
      if (typeof _hote === 'function') (_hote as () => void)();
      else rappel?.();
    },
  };
}
express.json = () => () => {};
express.urlencoded = () => () => {};
express.static = () => () => {};

/** Exécute la route correspondante et renvoie une Response, ou null si aucune route. */
export async function traiter(methode: string, url: URL, init?: RequestInit): Promise<Response | null> {
  const route = ROUTES.find((r) => r.methode === methode && r.motif.test(url.pathname) && !r.motif.test('/__aucune__'));
  if (!route) return null;
  const m = url.pathname.match(route.motif)!;
  const params = Object.fromEntries(route.cles.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
  const headers: Record<string, string> = {};
  new Headers(init?.headers).forEach((v, k) => (headers[k] = v));
  let body: any = {};
  try {
    body = init?.body ? JSON.parse(String(init.body)) : {};
  } catch {}
  const req = { method: methode, path: url.pathname, params, query: Object.fromEntries(url.searchParams), headers, body };

  return new Promise<Response>((resolve) => {
    let statut = 200;
    const res: any = {
      status(n: number) { statut = n; return res; },
      json(corps: unknown) { resolve(new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } })); return res; },
      send(corps: unknown) { resolve(new Response(typeof corps === 'string' ? corps : JSON.stringify(corps), { status: statut })); return res; },
      sendFile() { resolve(new Response('', { status: 404 })); return res; },
      setHeader() { return res; },
      set() { return res; },
      end() { resolve(new Response(null, { status: statut })); return res; },
    };
    Promise.resolve(route.handler(req, res, () => resolve(new Response('', { status: 404 })))).catch((err: any) =>
      resolve(new Response(JSON.stringify({ error: err?.message || 'Erreur interne' }), { status: 500, headers: { 'Content-Type': 'application/json' } })),
    );
  });
}

export default express;
