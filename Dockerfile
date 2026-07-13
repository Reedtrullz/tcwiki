# syntax=docker/dockerfile:1.7
FROM node:22.23.1-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS base
WORKDIR /app

RUN apk add --no-cache ca-certificates

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --include=optional

FROM base AS builder

ARG VERSION=unknown
ARG COMMIT_SHA=unknown
ENV VERSION=${VERSION} \
    COMMIT_SHA=${COMMIT_SHA} \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM base AS runner

ARG VERSION=unknown
ARG COMMIT_SHA=unknown
ARG IMAGE_REF=unknown

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    APP_VERSION=${VERSION} \
    VERSION=${VERSION} \
    COMMIT_SHA=${COMMIT_SHA} \
    IMAGE_REF=${IMAGE_REF} \
    NEXT_TELEMETRY_DISABLED=1

LABEL org.opencontainers.image.source="https://github.com/Reedtrullz/tcwiki" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${COMMIT_SHA}"

RUN mkdir -p /app/.next && chown -R node:node /app

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+process.env.PORT+'/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
