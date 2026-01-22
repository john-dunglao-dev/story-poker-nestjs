import { InjectRedis } from '@nestjs-redis/client';
import { Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redisClient: RedisClientType) {}

  async runCommand<T>(
    command: string,
    ...args: Array<string | number>
  ): Promise<T> {
    return (await this.redisClient.sendCommand([
      command,
      ...args.map(String),
    ])) as Promise<T>;
  }

  async fetchArray(key: string): Promise<object[]> {
    const data: object[] = [];
    const keys = await this.redisClient.keys(key);

    for (const k of keys) {
      const values = await this.redisClient.get(k);
      if (values) {
        data.push(JSON.parse(values) as object);
      }
    }

    return data;
  }

  async deleteKeys(pattern: string): Promise<number> {
    const keys = await this.redisClient.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    return this.redisClient.del(keys);
  }
}
