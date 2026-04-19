.PHONY: studio seed migrate generate

studio:
	npx prisma studio

seed:
	npm run seed

migrate:
	npx prisma migrate dev

generate:
	npx prisma generate