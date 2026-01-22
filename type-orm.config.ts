import { register } from 'tsconfig-paths';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Register tsconfig paths so src/* imports resolve correctly
register({
  baseUrl: __dirname,
  paths: {
    'src/*': ['src/*'],
  },
});

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  host: configService.getOrThrow<string>('DB_HOST'),
  port: parseInt(configService.getOrThrow<string>('DB_PORT'), 10),
  username: configService.getOrThrow<string>('DB_USERNAME'),
  password: configService.getOrThrow<string>('DB_PASSWORD'),
  database: configService.getOrThrow<string>('DB_NAME'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/_database/migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
});
