# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev

FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S memora -u 1001 -G nodejs

WORKDIR /app

COPY --from=builder --chown=memora:nodejs /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=memora:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=memora:nodejs /app/dist ./dist

USER memora

EXPOSE 4000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/api/v1/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
