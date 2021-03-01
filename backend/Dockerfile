FROM node:14 AS test

WORKDIR /app

COPY backend /app
COPY shared /shared

RUN npm install
RUN npm run build

FROM node:14 AS dev

WORKDIR /app

COPY --from=test /app/package*.json ./
COPY --from=test /app/tsconfig.json ./
COPY --from=test /app/ormconfig.yml ./

COPY --from=test /app/build /app/build
COPY --from=test /app/src /app/src
COPY --from=test /shared /shared

RUN npm install --only=prod

FROM node:14 AS prod

WORKDIR /app

COPY --from=test node_modules /app/node_modules
COPY --from=test build /app/build

CMD ["npm", "start"]
