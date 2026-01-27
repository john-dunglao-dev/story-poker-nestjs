import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { RoomsService } from './rooms.service';
import {
  ClientSocketData,
  ClientSocketOverride,
} from './overrides/client-socket.overrides';
import { VotesService } from 'src/votes/votes.service';
import { ResultsService } from 'src/results/results.service';
import { RedisService } from 'src/redis/redis.service';
import { Transactional } from 'typeorm-transactional-decorator';
import { WsException } from '@nestjs/websockets';
import { Room } from './entities/room.entity';
import { VoteData } from 'src/votes/interfaces/vote-data.interface';
import { RoomsSessionService } from './rooms-session.service';
import slugify from 'slugify';

@Injectable()
export class WsRoomsService {
  private server: Server;
  private readonly logger = new Logger(WsRoomsService.name);

  constructor(
    private readonly roomsService: RoomsService,
    private readonly votesService: VotesService,
    private readonly resultsService: ResultsService,
    private readonly redisService: RedisService,
    private readonly roomsSessionService: RoomsSessionService,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async join(client: ClientSocketOverride, roomSlug: string, name: string) {
    this.logger.debug(`User ${name} is joining room-${roomSlug}`);

    let room: Room;

    try {
      room = await this.roomsService.findOne({ slug: roomSlug });
    } catch {
      this.logger.error(`Room not found: room-${roomSlug}`);
      throw new WsException('Room not found');
    }

    const nameSlug = slugify(name, { lower: true });

    await client.join(`room-${roomSlug}`);
    Object.assign(client.data, {
      name,
      nameSlug,
      roomSlug,
      id: client.id,
      room,
    });
    await this.roomsSessionService.joinParticipant(roomSlug, nameSlug);
    this.server.to(`room-${roomSlug}`).emit('user_joined', { name, nameSlug });
    await this.broadcastRoomSessionUpdate(roomSlug);
  }

  async leave(client: ClientSocketOverride) {
    const roomSlug = client.data.roomSlug!;
    const name = client.data.name!;
    const nameSlug = client.data.nameSlug!;

    this.logger.debug(`User ${name} is leaving room-${roomSlug}`);

    await client.leave(`room-${roomSlug}`);
    this.deleteClientData(client);
    await this.redisService.deleteKeys(`votes:${roomSlug}:${client.id}`);
    await this.roomsSessionService.leaveParticipant(roomSlug, nameSlug);
    this.server.to(`room-${roomSlug}`).emit('user_left', { name, nameSlug });
  }

  async kick(
    roomSlug: string,
    targetClient: ClientSocketOverride,
    targetName: string,
  ) {
    this.logger.debug(`Kicking user ${targetName} from room-${roomSlug}`);

    await this.leave(targetClient);
  }

  async vote(client: ClientSocketOverride, vote: string) {
    const name = client.data.name!;
    const nameSlug = client.data.nameSlug!;
    const roomSlug = client.data.roomSlug!;

    this.logger.debug(`User ${name} voted in room-${roomSlug}: ${vote}`);

    await this.roomsSessionService.vote(roomSlug, nameSlug, vote);
    this.server.to(`room-${roomSlug}`).emit('user_voted', { name, nameSlug });
  }

  @Transactional()
  async reveal(client: ClientSocketOverride, topic: string = 'New Topic') {
    const roomSlug = client.data.roomSlug!;

    this.logger.debug(`Revealing votes in room-${roomSlug}`);

    const room = client.data.room;

    if (!room) {
      this.logger.error(`Room not found in client data: ${roomSlug}`);
      throw new WsException('Room not found');
    }

    // create results entry
    const result = await this.resultsService.create({ roomId: room.id, topic });

    // fetch and create votes from cache
    const votes = await this.redisService
      .fetchArray<VoteData>(`votes:${roomSlug}:*`)
      .then((voteData) =>
        voteData.map((vd) => this.votesService.fromVoteData(vd, result.id)),
      );
    await this.votesService.batchCreate(votes);
    await this.roomsSessionService.updateSessionState(roomSlug, 'revealed');
    await this.roomsSessionService.resetVotes(roomSlug);
    this.server.to(`room-${roomSlug}`).emit('votes_reveal', { votes });
    this.logger.debug(
      `Votes revealed in room-${roomSlug} for result-${result.id}`,
    );
  }

  async reset(roomSlug: string) {
    this.logger.debug(`Resetting votes in room-${roomSlug}`);

    // clear votes from cache
    await this.redisService.deleteKeys(`votes:${roomSlug}:*`);
    await this.roomsSessionService.updateSessionState(roomSlug, 'voting');
    await this.roomsSessionService.resetVotes(roomSlug);
    this.server.to(`room-${roomSlug}`).emit('votes_reset');
  }

  /**
   * @see WsBroadcastUpdateInterceptor
   */
  async broadcastRoomSessionUpdate(roomSlug: string) {
    this.logger.debug(
      `Broadcasting session update for room-${roomSlug} to clients`,
    );

    const session = await this.roomsSessionService.getSession(roomSlug);
    this.server.to(`room-${roomSlug}`).emit('room_update', session);
  }

  private deleteClientData(client: ClientSocketOverride) {
    const dummy: ClientSocketData = {} as ClientSocketData;
    const keys = Object.keys(dummy) as Array<keyof ClientSocketData>;
    for (const key of keys) {
      delete client.data[key];
    }
  }
}
