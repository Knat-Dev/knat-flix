FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY server.ts .
RUN npm run build

FROM docker:cli

RUN apk add --no-cache bash curl git rsync nodejs

WORKDIR /app
COPY --from=builder /app/dist/server.js .
COPY deploy.sh /deploy/deploy.sh
RUN chmod +x /deploy/deploy.sh

EXPOSE 9000
ENTRYPOINT []
CMD ["node", "server.js"]
