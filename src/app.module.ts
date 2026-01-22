import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { VotesModule } from './votes/votes.module';
import { ResultsModule } from './results/results.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { RedisModule } from './redis/redis.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional-decorator';

@Module({
  imports: [
    RedisModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow<string>('DB_HOST', 'localhost'),
        port: configService.getOrThrow<number>('DB_PORT', 3306),
        username: configService.getOrThrow<string>('DB_USERNAME', 'username'),
        password: configService.getOrThrow<string>('DB_PASSWORD', 'password'),
        database: configService.getOrThrow<string>('DB_NAME', 'test'),
        autoLoadEntities: true,
        synchronize: false,
        namingStrategy: new SnakeNamingStrategy(),
      }),
      dataSourceFactory: async (options: DataSourceOptions) => {
        const dataSource = new DataSource(options);
        await dataSource.initialize();
        return addTransactionalDataSource(dataSource);
      },
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        stores: [
          new KeyvRedis(
            configService.getOrThrow<string>(
              'REDIS_URL',
              'redis://localhost:6379',
            ),
          ),
        ],
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({
      verboseMemoryLeak: true,
    }),
    RoomsModule,
    UsersModule,
    EmailModule,
    VotesModule,
    ResultsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
