import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server, ServerOptions } from 'socket.io';

export class RedisSocketIoAdapterPlugin extends IoAdapter {
  private adapter: ReturnType<typeof createAdapter>;
  private logger = new Logger(RedisSocketIoAdapterPlugin.name);

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: 'redis://redis:6379' });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.logger.log('Connected to Redis for Socket.IO adapter');

    this.adapter = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      transports: ['websocket'],
      cors: {
        origin: ['http://storypoker.local'],
      },
    }) as Server;

    server.adapter(this.adapter);

    this.logger.log('Socket.IO server created with Redis adapter');
    return server;
  }
}
