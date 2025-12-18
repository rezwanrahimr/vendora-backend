# Project Structure

## Folder Organization

```
src/
├── modules/              # Feature modules
│   ├── auth/            # Authentication module
│   │   ├── dto/         # Data Transfer Objects
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/           # User management module
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── vendors/         # Vendor-specific features
│       ├── vendors.controller.ts
│       ├── vendors.service.ts
│       └── vendors.module.ts
├── common/              # Shared resources
│   ├── decorators/      # Custom decorators
│   ├── guards/          # Route guards
│   ├── filters/         # Exception filters
│   └── enums/           # Enums
├── config/              # Configuration files
├── prisma.service.ts    # Prisma database service
└── main.ts              # Application entry point
```

## User Types

The application supports 3 user types:

1. **ADMIN** - Full access to all features
2. **VENDOR** - Business users with additional profile information
3. **USER** - Regular users

## Authentication Endpoints

### Register a regular user
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "USER"
}
```

### Register a vendor
```http
POST /auth/register/vendor
Content-Type: application/json

{
  "email": "vendor@example.com",
  "password": "password123",
  "name": "Jane Smith",
  "businessName": "Smith's Store",
  "businessAddress": "123 Main St, City",
  "phoneNumber": "+1234567890",
  "taxId": "12-3456789",
  "description": "We sell great products"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## User Management Endpoints

```http
GET    /users          # Get all users
GET    /users/:id      # Get user by ID
PATCH  /users/:id      # Update user
DELETE /users/:id      # Delete user
```

## Vendor Management Endpoints

```http
GET    /vendors              # Get all vendors
GET    /vendors/:id          # Get vendor by ID
PATCH  /vendors/:id/profile  # Update vendor profile
PATCH  /vendors/:id/verify   # Verify a vendor (admin only)
```

## Setup Instructions

**IMPORTANT: PowerShell script execution is disabled on your system. You need to use CMD or Git Bash for npm commands.**

1. Open **CMD** or **Git Bash** (not PowerShell) and install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

3. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

4. Start the development server:
   ```bash
   npm run start:dev
   ```

## Next Steps

1. **Add JWT Authentication**: Implement JWT tokens for secure API access
2. **Add Validation**: Install `class-validator` and `class-transformer` for DTO validation
3. **Add Swagger**: Install `@nestjs/swagger` for API documentation
4. **Implement Role Guards**: Protect routes based on user roles
5. **Add Email Verification**: Implement email verification for new users
6. **Password Reset**: Add forgot password functionality
