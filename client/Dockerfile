# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package.json ./
COPY package-lock.json ./
RUN npm install --production=false
COPY client/. ./
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
