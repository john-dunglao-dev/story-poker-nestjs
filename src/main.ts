import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisSocketIoAdapterPlugin } from './_plugins/redis-socket-io-adapter.plugin';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const redisIoAdapter = new RedisSocketIoAdapterPlugin(app);
  const configService = app.get(ConfigService);

  await redisIoAdapter.connectToRedis(
    configService.get<string>('REDIS_HOST') ?? 'localhost',
    configService.get<number>('REDIS_PORT') ?? 6379,
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(process.env.API_PORT ?? 3000);
}
bootstrap();
