FROM node:18 AS base

FROM base AS dev

WORKDIR /app

EXPOSE 8080

CMD ["npm", "run", "dev"]

FROM base AS builder

WORKDIR /app
COPY frontend/package*.json /app/
RUN npm ci

WORKDIR /shared
COPY shared/package*.json /shared/
RUN npm ci

WORKDIR /app
COPY frontend /app
COPY shared /shared

ARG BACKEND_URL
ENV VITE_BACKEND_URL=$BACKEND_URL
ENV NODE_ENV=production
RUN npm run build

FROM nginxinc/nginx-unprivileged AS prod
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template

WORKDIR /app
COPY --from=builder /app/dist /app
