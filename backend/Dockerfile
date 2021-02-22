FROM node:14

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY ormconfig.yml ./
COPY start.sh ./

COPY src /app/src

RUN npm install
RUN npm run build

EXPOSE 3000


CMD [ "./start.sh" ]
