import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as packageJson from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // !TODO : need to check auth guard for swagger doc access
  const options = new DocumentBuilder()
    .setTitle(packageJson.name)
    .setDescription(packageJson.description)
    .setVersion(packageJson.version)
    .addSecurity('JWT', {
      type: 'apiKey', // apiKey type for raw token
      in: 'header', // send in header
      name: 'Authorization', // header name
    })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('doc', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      authAction: {
        JWT: {
          name: 'Authorization',
          schema: { type: 'apiKey', in: 'header', name: 'Authorization' },
          value: 'your-test-token-here', 
        },
      },
    },
  });

  // Add global API versioning prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
});
