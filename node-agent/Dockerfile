FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openjdk21-jre-headless bash curl

COPY package.json tsconfig.json ./
RUN npm install

COPY agent.ts ./

CMD ["npx", "tsx", "agent.ts"]
