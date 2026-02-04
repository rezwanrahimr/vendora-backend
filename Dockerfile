FROM node:24-alpine AS builder
WORKDIR /app


COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --force

COPY . .

ENV DATABASE_URL=postgres://$PG_USERNAME:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DATABASE?schema=public

RUN npx prisma generate

RUN npm run build


FROM node:24-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

ENV NODE_ENV=production
EXPOSE 3000

# Run migrations and start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
