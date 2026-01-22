import { Cache } from 'cache-manager';
import { RedisClientType } from 'redis';

export interface RedisStore {
  name: 'redis';
  getClient: () => RedisClientType;
  isCacheableValue: (value: unknown) => boolean;
}

export interface RedisCache extends Cache {
  store: RedisStore;
}

export interface RedisCacheClient extends Cache {
  store: {
    client: RedisClientType;
  };
}
