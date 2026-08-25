# IADÉBAT

Arène de débat entre modèles d'IA. Six orateurs — ChatGPT, Claude, Gemini,
DeepSeek, Mistral, Grok — argumentent à tour de rôle sur une question de
société, un jury les départage, et la séance est archivée sous forme de
procès-verbal.

L'application fonctionne **sans aucune clé API** : elle sert alors des textes
de secours pré-rédigés, systématiquement marqués comme tels. Une clé Gemini
suffit à activer la génération réelle pour tous les orateurs ; chaque
constructeur peut recevoir la sienne.

## Démarrer

```bash
npm ci
npm run dev        # http://localhost:3000
```

Pour la génération réelle, placez votre clé dans un fichier `.env` — jamais
dans un fichier versionné :

```
GEMINI_API_KEY=votre_cle
```

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur + Vite en middleware, sur le port 3000 |
| `npm run lint` | `tsc --noEmit` — à lancer avant chaque commit |
| `npm run test:unit` | 42 tests unitaires, quelques secondes |
| `npm run test:e2e` | 21 scénarios Playwright, environ sept minutes |
| `npm test` | Les deux |
| `npm run build` | Build client + serveur bundlé vers `dist/` |
| `npm start` | Exécute le build de production |

Les tests bout en bout démarrent eux-mêmes l'application et un bouchon Gemini
pilotable : aucune clé n'est nécessaire pour les faire tourner.

## Architecture

Un seul processus sert tout : `server.ts` monte Vite en middleware en
développement, et sert `dist/` en production.

```
server.ts                    routes API, classification d'erreurs, limite de débit
src/server/fallback.ts       prose de secours et heuristique de sophismes
src/hooks/useDebateEngine.ts déroulé de séance, clôture, archives, minuterie
src/components/              ConfigPanel, DebateStage, ArchivePanel, et les vues
src/lib/                     temps, métriques, stockage, export, session
tests/unit/                  fonctions pures
tests/e2e/                   parcours complets
```

### Le contrat de dégradation

C'est la règle structurante du projet. Toute route pouvant basculer sur le
moteur local renvoie :

```ts
{ text | topics | analysis | treaty, source: "remote" | "local", degraded, kind, reason }
```

`kind` vaut `none`, `config`, `auth`, `quota`, `network`, `server`, `format`
ou `unknown`. L'interface **doit** signaler visiblement toute réponse
dégradée : bandeau en tête de page, pastille sur chaque bulle concernée,
encart sur la synthèse, le traité et le verdict, et mention conservée dans le
procès-verbal exporté. Un gabarit local ne doit jamais passer pour une
génération réelle.

### Routes

| Route | Rôle |
| --- | --- |
| `GET /api/health` | État, modèles configurés, présence d'une clé serveur |
| `GET POST DELETE /api/archives` | Registre des séances, cloisonné par `x-client-id` |
| `POST /api/debate/suggest-topics` | Trois thèmes à partir d'un mot-clé |
| `POST /api/debate/generate` | Une prise de parole, ou le verdict du jury |
| `POST /api/debate/summary` | Synthèse de fin de séance |
| `POST /api/debate/analyze-fallacy` | Relevé rhétorique d'une intervention |
| `POST /api/debate/treaty` | Traité de consensus |

## Conventions

- Tout le texte visible par l'utilisateur est en français.
- Les identifiants de modèles sont centralisés dans l'objet `MODELS` de
  `server.ts` et surchargeables par variable d'environnement. Ne jamais coder
  un nom de modèle en dur ailleurs.
- Sur Gemini 3.x, ne pas fixer `temperature` ni `top_p` : Google recommande
  les valeurs par défaut. Utiliser `thinkingConfig.thinkingLevel`.
- `src/server/fallback.ts` est du contenu éditorial. Ses gabarits ne doivent
  jamais réinjecter des mots extraits du titre dans une position
  grammaticale : c'est ce qui produisait des tournures comme « l'évolution
  entourant de décisions ». Le sujet se cite en entier, une fois.
- `npm run lint` doit passer avant chaque commit.

## Mettre en ligne

Voir [DEPLOIEMENT.md](DEPLOIEMENT.md) — blueprint Render, `Dockerfile`, ou
VPS, avec la liste complète des variables d'environnement.

## Limites connues

- **Les archives sont un fichier JSON**, pas une base de données. Sans disque
  persistant, elles disparaissent à chaque redéploiement (`ARCHIVES_FILE`).
- **Le cloisonnement repose sur un en-tête `x-client-id`**, pas sur un compte.
  Quiconque forge cet en-tête lit les archives correspondantes.
- **La limite de débit est en mémoire** : elle se réinitialise au redémarrage
  et ne se partage pas entre plusieurs instances.
- **Les clés saisies dans l'interface** vivent en `sessionStorage` et
  transitent par le serveur à chaque requête.
- `MODEL_GEMINI` vaut `gemini-3.5-flash` par défaut, valeur héritée du code
  d'origine et jamais vérifiée contre l'API réelle. Si toutes les réponses
  arrivent dégradées avec une clé valide, c'est la première chose à changer.
