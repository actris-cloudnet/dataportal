FROM node:10 AS base

WORKDIR /app

COPY backend/package*.json /app/

RUN npm ci

FROM base AS dev

ENV TZ="Europe/Helsinki"

COPY backend /app
COPY .eslintrc-common.js /
COPY shared /shared

FROM dev AS build

RUN npm run build

FROM node:10 AS prod

WORKDIR /app

COPY --from=build /app/package*.json /app/

RUN npm ci --only=prod

COPY --from=build /app/build /app/build
COPY --from=build /app/scripts /app/scripts
COPY --from=build /app/tests/lib/service-mocks.js /app/tests/lib/service-mocks.js

CMD ["npm", "start"]