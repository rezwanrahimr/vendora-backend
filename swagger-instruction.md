# Swagger Instruction

## **1. Define a DTO (Schema) for Swagger**

Use `@ApiProperty` to document request/response fields:

```ts
// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'Password', example: 'strongPassword123' })
  password: string;
}
```

* `@ApiProperty` adds description, example, and other metadata for Swagger.
* NestJS will automatically generate the schema in Swagger UI.

---

## **2. Setup Swagger in `main.ts`**

Define a **security scheme** for JWT tokens:

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as packageJson from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle(packageJson.name)
    .setDescription(packageJson.description)
    .setVersion(packageJson.version)
    // Define JWT header security globally
    .addSecurity('JWT', {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization', // header for raw JWT
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

---

## **3. Secure endpoints with `@ApiSecurity`**

```ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  // Public endpoint (no auth required)
  @Post('login')
  @ApiOperation({ summary: 'Login with email & password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  login(@Body() body: LoginDto) {
    return { message: 'Logged in', token: 'JWT_TOKEN_HERE' };
  }

  // Protected endpoint
  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('JWT') // Lock icon in Swagger
  @ApiOperation({ summary: 'Get user profile (requires JWT)' })
  getProfile() {
    return { id: 1, email: 'user@example.com', name: 'John Doe' };
  }
}
```

---

## **4. Key Points**

1. **DTO / Schema**

   * Use `@ApiProperty` to describe fields.
   * Swagger auto-generates schemas from your DTOs.

2. **Security (Guard + Lock)**

   * `@ApiSecurity('JWT')` links the endpoint to the JWT security scheme.
   * Users enter the token via the Swagger **Authorize** button.
   * The lock icon appears automatically.

3. **Global vs Per-Endpoint**

   * Define the scheme globally in `main.ts`.
   * Apply `@ApiSecurity('JWT')` **per controller or per route**.

4. **Raw JWT**

   * Use `type: 'apiKey', in: 'header', name: 'Authorization'` for raw JWT (no Bearer prefix).
   * Prefill optional in `swaggerOptions.authAction` for testing.

---

This setup gives you:

* Swagger documentation with **schemas** (LoginDto, etc.)
* **Lock icons** for protected endpoints
* JWT security applied per route or globally

---

If you want, I can also write a **ready-to-copy reusable decorator** for `@ApiSecurity + ApiHeader` so you don’t have to manually add it to every protected controller.

Do you want me to do that?
