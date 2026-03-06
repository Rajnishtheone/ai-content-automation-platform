FROM node:20-slim AS base
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y openssl libssl-dev
RUN npm install --legacy-peer-deps --workspaces
RUN npx prisma generate --schema packages/database/prisma/schema.prisma
ENV NODE_ENV=production
CMD ["node", "app.js"]
