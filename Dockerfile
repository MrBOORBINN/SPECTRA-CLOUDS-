FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json vite.config.ts index.html ./
RUN npm install

COPY src ./src
COPY backend ./backend
COPY server.ts metadata.json ./

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY backend ./backend
COPY server.ts tsconfig.json ./

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
