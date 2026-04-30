# -----------------------------
# 1. Builder Stage
# -----------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Prisma + build dependencies
RUN apk add --no-cache openssl

# Copy dependency files first (better caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Dummy DB URL (kept as requested)
ENV DATABASE_URL="database_url_placeholder"

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build


# -----------------------------
# 2. Production Stage
# -----------------------------
FROM node:24-alpine AS runner

WORKDIR /app

# Runtime dependencies for Prisma
RUN apk add --no-cache openssl

# Keep dummy DB (as requested)
ENV DATABASE_URL="database_url_placeholder"
ENV NODE_ENV=production

# Copy dependency files first
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy built output + prisma schema + Prisma config
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Generate Prisma client in runtime (after deps installed)
RUN npx prisma generate

EXPOSE 5000

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]