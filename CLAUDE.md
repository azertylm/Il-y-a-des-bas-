# IADÉBAT — contexte projet

Arène de débat entre modèles d'IA. React 19 + Vite + Tailwind 4 côté client,
Express + `@google/genai` côté serveur, le tout servi par un unique processus
(`server.ts` monte Vite en middleware en dev, sert `dist/` en production).

Lire [README.md](README.md) pour l'architecture et les routes.

## Commandes

```bash
npm run dev        # serveur + Vite sur http://localhost:3000
npm run lint       # tsc --noEmit — à lancer avant chaque commit
npm run test:unit  # 42 tests unitaires, quelques secondes
npm run test:e2e   # 21 scénarios Playwright, environ sept minutes
npm run build      # vite build + esbuild du serveur vers dist/
npm start          # exécute le build de production
```

`GEMINI_API_KEY` se met dans `.env` (jamais dans un fichier versionné).

## Conventions

- Tout le texte visible par l'utilisateur est en français, commentaires et
  messages de commit compris.
- Les identifiants de modèles sont centralisés dans l'objet `MODELS` de
  `server.ts` et surchargeables par variable d'environnement. Ne jamais coder
  un nom de modèle en dur ailleurs.
- Sur Gemini 3.x, ne pas fixer `temperature` ni `top_p` : Google recommande
  les valeurs par défaut. Utiliser `thinkingConfig.thinkingLevel`.
- Toute route qui bascule sur le moteur de secours local doit renvoyer
  `{ …, source: "remote" | "local", degraded, kind, reason }`. **L'interface
  doit signaler visiblement une réponse dégradée : elle ne doit jamais faire
  passer un gabarit local pour une génération réelle.** C'est la règle
  structurante du projet ; `tests/e2e/degradation.spec.ts` en est le filet.
- `src/server/fallback.ts` contient la prose de secours. C'est du contenu
  éditorial : ne pas le réécrire sans demande explicite. Ses gabarits ne
  doivent jamais réinjecter des mots extraits du titre dans une position
  grammaticale — le sujet se cite en entier, une fois.
- Ajouter un test avec chaque correctif. Les régressions déjà couvertes sont
  annotées `// Régression :` dans les tests.

## État

Backend et client sont à jour, découpés et testés. Les huit correctifs client
historiques sont faits, ainsi que le découpage d'`App.tsx` (2227 → 386 lignes)
et cinq fonctionnalités : analyse de sophismes, traité de consensus, export du
procès-verbal en Markdown, recherche d'archives, reprise de séance.

`npm run lint`, `npm run test:unit` et `npm run test:e2e` passent.

### Points ouverts

1. **`MODEL_GEMINI` vaut `gemini-3.5-flash`**, valeur héritée du code
   d'origine, **jamais vérifiée contre l'API réelle**. La nomenclature Google
   va 2.5 puis 3 ; cet identifiant est probablement faux. Si toutes les
   réponses arrivent dégradées avec une clé valide, c'est la cause. Le mode
   réel n'a été validé que contre un bouchon local
   (`tests/fixtures/gemini-stub.mjs`).
2. Le streaming SSE et une route `breaking-news` ont été envisagés, jamais
   écrits.
3. Le `Dockerfile` n'a pas été validé par un build réel : l'accès au registre
   d'images était bloqué depuis l'environnement de développement.
4. Les archives sont un fichier JSON cloisonné par en-tête `x-client-id`, pas
   une base protégée par un compte. La limite de débit est en mémoire, donc
   non partagée entre instances.

## Vérification avant commit

`npm run lint` et `npm run test:unit` doivent passer. Lancer `npm run test:e2e`
avant toute modification touchant au déroulé d'une séance, au contrat de
dégradation ou à la minuterie de cycle.
