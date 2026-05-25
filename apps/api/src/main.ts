import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.API_CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    credentials: true,
    origin: allowedOrigins,
  });
  app.setGlobalPrefix('api');

  const port = Number(process.env.API_PORT ?? 4001);
  await app.listen(port);
}

void bootstrap();
