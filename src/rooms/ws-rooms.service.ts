import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { RoomsService } from './rooms.service';
import { ClientSocketOverride } from './overrides/client-socket.overrides';
import { VotesService } from 'src/votes/votes.service';
import { ResultsService } from 'src/results/results.service';
import { RedisService } from 'src/redis/redis.service';
import { Transactional } from 'typeorm-transactional-decorator';
import { WsException } from '@nestjs/websockets';
import { Room } from './entities/room.entity';
import { VoteData } from 'src/votes/interfaces/vote-data.interface';

@Injectable()
export class WsRoomsService {
  private server: Server;
  private readonly logger = new Logger(WsRoomsService.name);

  constructor(
    private readonly roomsService: RoomsService,
    private readonly votesService: VotesService,
    private readonly resultsService: ResultsService,
    private readonly redisService: RedisService,
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

    await client.join(`room-${roomSlug}`);
    client.data.roomSlug = roomSlug;
    client.data.name = name;
    client.data.id = client.id;
    client.data.room = room;
    this.server.to(`room-${roomSlug}`).emit('userJoined', { name });
  }

  async leave(client: ClientSocketOverride) {
    const roomSlug = client.data.roomSlug;
    const name = client.data.name;

    this.logger.debug(`User ${name} is leaving room-${roomSlug}`);

    await client.leave(`room-${roomSlug}`);
    delete client.data.roomSlug;
    delete client.data.name;
    await this.redisService.deleteKeys(`votes:${roomSlug}:${client.id}`);

    this.server.to(`room-${roomSlug}`).emit('userLeft', { name });
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
    const name = client.data.name;
    const roomSlug = client.data.roomSlug;
    const clientId = client.id;

    this.logger.debug(`User ${name} voted in room-${roomSlug}: ${vote}`);

    // store vote in cache
    await this.redisService.runCommand(
      'SET',
      `votes:${roomSlug}:${clientId}`,
      JSON.stringify({ name, vote }),
    );

    this.server.to(`room-${roomSlug}`).emit('userVoted', { name });
  }

  @Transactional()
  async reveal(client: ClientSocketOverride, topic: string = 'New Topic') {
    const roomSlug = client.data.roomSlug;

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

    this.server.to(`room-${roomSlug}`).emit('votesRevealed', { votes });
    this.logger.debug(
      `Votes revealed in room-${roomSlug} for result-${result.id}`,
    );
  }

  async reset(roomSlug: string) {
    this.logger.debug(`Resetting votes in room-${roomSlug}`);

    // clear votes from cache
    await this.redisService.deleteKeys(`votes:${roomSlug}:*`);

    this.server.to(`room-${roomSlug}`).emit('votesReset');
  }
}
