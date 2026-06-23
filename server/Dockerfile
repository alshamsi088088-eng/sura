FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install --workspace=server

COPY server/tsconfig.json ./server/
COPY server/. ./
WORKDIR /app/server
RUN npm run build

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install --workspace=server --production && \
    npm dedupe

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/schema.prisma ./
EXPOSE 5000
WORKDIR /app/server
CMD ["node", "dist/index.js"]
