# Use Node.js base image
FROM node:22-alpine

# Set working directory inside container
WORKDIR /app

# Install dependencies (including dev, needed for build + prisma)
COPY package*.json ./

COPY prisma ./prisma/

RUN npm install

# Copy the rest of the code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build app
RUN npm run build

# Expose port
EXPOSE 3000

# Run migrations and start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
