FROM node:14 AS base

WORKDIR /app

COPY frontend/package*.json /app/

RUN npm ci

WORKDIR /backend

COPY backend/package*.json /backend/
RUN npm ci

WORKDIR /shared

COPY shared/package*.json /shared/
RUN npm ci


FROM base AS dev

WORKDIR /app

COPY frontend /app
COPY backend /backend
COPY .eslintrc-common.js /
COPY shared /shared

RUN npm run build

FROM nginx AS prod

WORKDIR /app

COPY --from=dev /app/dist /app

