FROM node:22 AS base

WORKDIR /app

COPY backend/package*.json /app/

RUN npm ci

FROM base AS dev

COPY backend /app
COPY shared /shared

FROM dev AS build

RUN npm run build

FROM node:22 AS prod

COPY --from=build /app/package*.json /app/

WORKDIR /app

RUN npm ci --only=prod

COPY --from=build /app/build /app/build
COPY --from=build /app/data /app/data
COPY --from=build /app/tests/lib/service-mocks.js /app/tests/lib/service-mocks.js
COPY --from=build /app/tests/data/GeoLite2-Country-Test.mmdb /app/tests/data/GeoLite2-Country-Test.mmdb

CMD ["node", "build/server.js"]
