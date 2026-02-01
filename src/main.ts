import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisSocketIoAdapterPlugin } from './_plugins/redis-socket-io-adapter.plugin';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const redisIoAdapter = new RedisSocketIoAdapterPlugin(app);
  const configService = app.get(ConfigService);

  await redisIoAdapter.connectToRedis(
    configService.getOrThrow<string>('REDIS_URL'),
  );

  // will automatically validate incoming requests based on DTO decorators
  // strips unknown properties from the request body
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // setup cookie parser middleware
  // enable setting signed cookies to responses
  app.use(
    cookieParser(configService.getOrThrow<string>('COOKIE_PARSER_SECRET')),
  );

  // setup WebSocket adapter with Redis
  app.useWebSocketAdapter(redisIoAdapter);

  // enable CORS
  app.enableCors({
    origin: configService.getOrThrow<string>('CORS_ALLOWED_ORIGINS').split(','),
    credentials: true,
  });

  app.set('trust proxy', true);

  await app.listen(process.env.API_PORT ?? 3000);
}
bootstrap();
