FROM node:20-alpine AS build
WORKDIR /app
COPY server/package.json ./
COPY package-lock.json ./
RUN npm install
COPY server/. ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/.env.example ./
EXPOSE 5000
CMD ["node", "dist/index.js"]
