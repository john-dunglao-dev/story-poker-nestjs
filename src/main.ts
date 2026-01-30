import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisSocketIoAdapterPlugin } from './_plugins/redis-socket-io-adapter.plugin';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const redisIoAdapter = new RedisSocketIoAdapterPlugin(app);
  const configService = app.get(ConfigService);

  await redisIoAdapter.connectToRedis(
    configService.getOrThrow<string>('REDIS_URL'),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.use(
    cookieParser(configService.getOrThrow<string>('COOKIE_PARSER_SECRET')),
  );

  app.useWebSocketAdapter(redisIoAdapter);

  app.enableCors({
    origin: configService.getOrThrow<string>('CORS_ALLOWED_ORIGINS').split(','),
    credentials: true,
  });

  await app.listen(process.env.API_PORT ?? 3000);
}
bootstrap();
