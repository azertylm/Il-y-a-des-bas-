# Mettre IADÉBAT en ligne

L'application n'est **pas un site statique** : un serveur Express relaie les
appels aux modèles et sert le build client depuis le même processus. Il lui
faut donc un hébergeur Node, pas un hébergeur de fichiers statiques.

```
npm ci && npm run build   # produit dist/ (client + serveur bundlé)
npm start                 # sert dist/ sur $PORT
```

## Variables d'environnement

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `GEMINI_API_KEY` | non | Clé serveur. Sans elle, l'application démarre en mode secours local et le signale visiblement. |
| `PORT` | non | Port d'écoute. La plupart des hébergeurs l'imposent ; défaut `3000`. |
| `NODE_ENV` | oui en production | Doit valoir `production`, sinon le serveur monte Vite au lieu de servir le build. `npm start` le positionne. |
| `ARCHIVES_FILE` | non | Chemin du fichier d'archives. À pointer vers un disque persistant. |
| `MODEL_GEMINI` … `MODEL_GROK` | non | Surcharge des identifiants de modèles. |
| `GEMINI_BASE_URL` | non | Route les appels Gemini vers une passerelle interne. |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | non | Limite de débit par client (défaut 40 requêtes / minute). |
| `GENERATION_MAX_RETRIES` | non | Nombre de reprises sur 429 (défaut 2). |

**Ne mettez jamais `GEMINI_API_KEY` dans un fichier versionné.** Elle se
renseigne dans le tableau de bord de l'hébergeur.

## Option A — Render (le plus court)

Le dépôt contient `render.yaml`.

1. [render.com](https://render.com) → **New** → **Blueprint**
2. Sélectionnez ce dépôt : la configuration est lue automatiquement
3. Renseignez `GEMINI_API_KEY` quand Render la demande (ou laissez vide pour
   tester en mode secours)
4. **Apply**

Le plan gratuit met le service en veille après quinze minutes d'inactivité :
la première visite suivante met environ trente secondes à répondre.

## Option B — Docker (Railway, Fly.io, Cloud Run, Scaleway, un VPS…)

Le `Dockerfile` est autonome et fonctionne partout.

```bash
docker build -t iadebat .
docker run -p 3000:3000 -e GEMINI_API_KEY=votre_cle iadebat
```

Pour conserver les archives entre deux déploiements, montez un volume sur
`/data` — le conteneur y écrit déjà (`ARCHIVES_FILE=/data/archives.json`).

```bash
docker run -p 3000:3000 -v iadebat-data:/data iadebat
```

## Option C — Un VPS avec Node

```bash
git clone https://github.com/azertylm/Il-y-a-des-bas-.git && cd Il-y-a-des-bas-
npm ci && npm run build
GEMINI_API_KEY=votre_cle PORT=3000 npm start
```

Placez ensuite un reverse proxy (Caddy, nginx) devant pour le HTTPS, et un
gestionnaire de processus (`systemd`, `pm2`) pour le redémarrage automatique.

## Ce à quoi il faut s'attendre

- **Sans clé API**, l'application fonctionne : elle sert des textes de secours
  pré-rédigés, tous marqués « Secours local ». C'est utile pour montrer
  l'interface, pas pour juger la qualité des débats.
- **Les archives sont des fichiers**, pas une base de données. Sans disque
  persistant, elles disparaissent à chaque redéploiement. Elles sont
  cloisonnées par navigateur (`x-client-id`), pas protégées par un compte :
  quiconque forge cet en-tête peut lire les archives correspondantes.
- **Les clés API saisies dans l'interface** transitent par le serveur à chaque
  requête et ne sont conservées que dans l'onglet du visiteur.
- **La limite de débit est en mémoire** : elle se réinitialise au redémarrage
  et ne se partage pas entre plusieurs instances.
