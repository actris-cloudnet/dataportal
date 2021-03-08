FROM node:10 AS dev

ENV TZ="Europe/Helsinki"

WORKDIR /app

COPY backend /app
COPY shared /shared

RUN npm ci
RUN npm run build

FROM node:14 AS prod

WORKDIR /app

RUN npm ci --only=prod

COPY --from=dev /app/build /app/build
COPY --from=dev /app/scripts /app/scripts

CMD ["npm", "start"]
