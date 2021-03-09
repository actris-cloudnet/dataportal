FROM node:10 AS base

WORKDIR /app

COPY backend/package*.json /app/

RUN npm ci

FROM base AS dev

ENV TZ="Europe/Helsinki"

WORKDIR /app

COPY backend /app
COPY .eslintrc-common.js /
COPY shared /shared

RUN npm run build

FROM node:10 AS prod

WORKDIR /app

RUN npm ci --only=prod

COPY --from=dev /app/build /app/build
COPY --from=dev /app/scripts /app/scripts

CMD ["npm", "start"]
