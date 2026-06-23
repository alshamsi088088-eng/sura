FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm install --legacy-peer-deps
WORKDIR /app/client

COPY tsconfig.json vite.config.ts tailwind.config.js postcss.config.js ./
COPY index.html ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
