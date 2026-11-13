# syntax=docker/dockerfile:1

# ---------- Estágio 1: build ----------
FROM node:25-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---------- Estágio 2: dependências de produção ----------
FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- Estágio 3: runtime ----------
FROM node:25-alpine AS runtime
ENV NODE_ENV=production
ARG APP_VERSION=0.0.0-dev
ENV APP_VERSION=${APP_VERSION}
WORKDIR /app
# Segurança: aplica correções do Alpine e remove npm/yarn (não são necessários para executar a API)
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=deps  --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
# Boa prática: não executar como root
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/health || exit 1
CMD ["node", "dist/server.js"]
