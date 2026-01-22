import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisModule as NestRedisModule } from '@nestjs-redis/client';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestRedisModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        options: {
          url: configService.getOrThrow<string>(
            'REDIS_URL',
            'redis://localhost:6379',
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
