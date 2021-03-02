FROM node:14 AS dev

WORKDIR /app

COPY frontend /app
COPY backend /backend
COPY .eslintrc-common.js /
COPY shared /shared

RUN npm ci

WORKDIR /backend
RUN npm ci

WORKDIR /app
RUN npm run build

FROM nginx AS prod

WORKDIR /app

COPY --from=dev /app/dist /app

