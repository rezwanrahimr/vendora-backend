.PHONY: studio seed migrate generate reset

studio:
	@echo "🎨 Starting Prisma Studio..."
	npx prisma studio

seed:
	@echo "🌱 Seeding database..."
	npm run seed

migrate:
	@echo "🚀 Running migrations..."
	npx prisma migrate dev

generate:
	@echo "⚙️  Generating Prisma client..."
	npx prisma generate

reset:
	@echo "🔄 Resetting database and seeding..."
	npx prisma migrate reset && npx prisma db seed