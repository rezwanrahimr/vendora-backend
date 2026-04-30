.PHONY: studio seed migrate generate reset docker-build docker-push docker-up docker-down docker-restart

studio:
	@echo "🎨 Starting Prisma Studio..."
	npx prisma studio

seed:
	@echo "🌱 Seeding database..."
	npm run seed

migrate:
	@echo "🚀 Running migrations ..."
	npx prisma migrate dev && npx prisma generate

generate:
	@echo "⚙️  Generating Prisma client..."
	npx prisma generate

reset:
	@echo "🔄 Resetting database and seeding..."
	npx prisma migrate reset && npx prisma db seed


docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t softvence/vendora-backend:latest .

docker-push:
	@echo "🚀 Pushing Docker image..."
	docker push softvence/vendora-backend:latest

docker-up:
	@echo "📦 Starting containers..."
	docker compose up -d

docker-down:
	@echo "🛑 Stopping containers..."
	docker compose down

docker-restart:
	@echo "🔄 Restarting containers..."
	docker compose down && docker compose up -d --force-recreate


docker-release:
	@echo "🚀 Building and pushing Docker image..."
	docker build -t softvence/vendora-backend:latest .
	docker push softvence/vendora-backend:latest