import { Inject, Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { RoomsService } from './rooms.service';
import { ClientSocketOverride } from './overrides/client-socket.overrides';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class WsRoomsService {
  private server: Server;
  private readonly logger = new Logger(WsRoomsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly roomsService: RoomsService,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async join(client: ClientSocketOverride, roomSlug: string, name: string) {
    this.logger.debug(`User ${name} is joining room-${roomSlug}`);

    await client.join(`room-${roomSlug}`);
    client.data.roomSlug = roomSlug;
    client.data.name = name;
    this.server.to(`room-${roomSlug}`).emit('userJoined', { name });
  }

  async leave(client: ClientSocketOverride) {
    const roomSlug = client.data.roomSlug;
    const name = client.data.name;

    this.logger.debug(`User ${name} is leaving room-${roomSlug}`);

    await client.leave(`room-${roomSlug}`);
    delete client.data.roomSlug;
    delete client.data.name;
    this.server.to(`room-${roomSlug}`).emit('userLeft', { name });
  }

  async kick(
    roomSlug: string,
    targetClient: ClientSocketOverride,
    targetName: string,
  ) {
    this.logger.debug(`Kicking user ${targetName} from room-${roomSlug}`);

    await targetClient.leave(`room-${roomSlug}`);
    this.server.to(`room-${roomSlug}`).emit('userKicked', { name: targetName });
  }

  vote(client: ClientSocketOverride, vote: string) {
    const name = client.data.name;
    const roomSlug = client.data.roomSlug;

    this.logger.debug(`User ${name} voted in room-${roomSlug}: ${vote}`);

    this.server.to(`room-${roomSlug}`).emit('userVoted', { name });
  }

  reveal(client: ClientSocketOverride) {
    const roomSlug = client.data.roomSlug;

    this.logger.debug(`Revealing votes in room-${roomSlug}`);

    this.server.to(`room-${roomSlug}`).emit('votesRevealed', {});
  }

  reset(roomSlug: string) {
    this.logger.debug(`Resetting votes in room-${roomSlug}`);

    this.server.to(`room-${roomSlug}`).emit('votesReset');
  }
}
