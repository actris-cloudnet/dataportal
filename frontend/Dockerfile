FROM node:22 AS base

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
ARG MATOMO_HOST
ARG MATOMO_SITE_ID
RUN test -n "$BACKEND_URL" || (echo "BACKEND_URL not set" && false)
ENV VITE_BACKEND_URL=$BACKEND_URL
ENV VITE_MATOMO_HOST=$MATOMO_HOST
ENV VITE_MATOMO_SITE_ID=$MATOMO_SITE_ID
ENV NODE_ENV=production
RUN npm run build

FROM nginxinc/nginx-unprivileged AS prod
WORKDIR /app
COPY --from=builder /app/dist /app
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY frontend/maintenance.html /app
