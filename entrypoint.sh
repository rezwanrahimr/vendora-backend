#!/bin/sh

echo "⏳ Waiting for database..."
echo "DATABASE_URL: $DATABASE_URL"
echo "Current directory: $(pwd)"
echo "Prisma migrations path: $(ls -la prisma/migrations/ 2>/dev/null || echo 'NOT FOUND')"

# Retry loop (important for Docker)
until npx prisma migrate deploy; do
  echo "❌ DB not ready yet, retrying in 3s..."
  sleep 3
done

echo "✅ Migrations applied"

echo "🚀 Starting app..."
node dist/src/main.js