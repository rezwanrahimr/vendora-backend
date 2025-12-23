import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as packageJson from '../package.json';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    credentials: true,
    origin: ['http://localhost:5173'],
  });

  // Serve static files using express.static directly
  // __dirname is dist/src, so we need to go up two levels to reach project root
  app.use('/uploads', express.static(join(__dirname, '..', '..', 'uploads')));


  const options = new DocumentBuilder()
    .setTitle(packageJson.name)
    .setDescription(packageJson.description)
    .setVersion(packageJson.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'JWT',
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('doc', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically convert payloads to DTO instances
     
    }),
  );

  // Apply response interceptor globally
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Apply exception filter globally
  app.useGlobalFilters(new HttpExceptionFilter());

  // Add global API versioning prefix (excludes static files)
  app.setGlobalPrefix('api/v1', {
    exclude: ['/uploads/*path'],
  });

  await app.listen(process.env.PORT || 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
});
