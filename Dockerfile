# syntax=docker/dockerfile:1
# Misma base Linux para construir e instalar las dependencias nativas de ejecución.
ARG NODE_IMAGE=node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
COPY package.json package-lock.json .npmrc .node-version ./
RUN node -e "if (process.version !== 'v' + require('node:fs').readFileSync('.node-version', 'utf8').trim()) process.exit(1)" \
    && npm ci

FROM dependencies AS build
COPY . .
# Incluye preparación del catálogo, compilación, pruebas y control de arquitectura.
RUN npm run check

FROM ${NODE_IMAGE} AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ARG VCS_REF=unrecorded
LABEL org.opencontainers.image.revision=${VCS_REF}
LABEL org.opencontainers.image.source=https://github.com/adriancapilla/karta3
# Predeterminados de ejecución; no dominio, secretos ni modo de Pruebas en el bundle.
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json /app/.node-version ./
COPY --from=build --chown=node:node /app/dist-server ./dist-server
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/barajas ./barajas
# Punto de montaje separado B21. No activa recogida ni guarda estado jugable.
RUN mkdir -p /var/lib/karta3/statistics && chown node:node /var/lib/karta3/statistics && chmod 0700 /var/lib/karta3/statistics
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/decks', {signal: AbortSignal.timeout(3000)}).then(r => {if (!r.ok) process.exit(1)}).catch(() => process.exit(1))"
CMD ["node", "dist-server/server/main.js"]
