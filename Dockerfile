# ─── Étape 1 : construction ──────────────────────────────────────────────────
FROM node:20-slim AS build

WORKDIR /app

# Les dépendances d'abord : cette couche est réutilisée tant que le
# verrou ne change pas.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Étape 2 : exécution ─────────────────────────────────────────────────────
FROM node:20-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Seules les dépendances de production sont embarquées : le serveur bundlé
# les charge en externe (`--packages=external`).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Répertoire des archives : à monter sur un volume pour qu'elles survivent
# aux redéploiements.
RUN mkdir -p /data && chown -R node:node /data
ENV ARCHIVES_FILE=/data/archives.json

USER node
EXPOSE 3000

# `npm start` passerait par cross-env, absent des dépendances de production :
# on appelle directement le serveur, NODE_ENV étant déjà positionné.
CMD ["node", "dist/server.cjs"]
