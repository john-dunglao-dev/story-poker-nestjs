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
import { RoomsSessionService } from './rooms-session.service';
import slugify from 'slugify';
import { CreateVoteDto } from 'src/votes/dto/create-vote.dto';
import { parse } from 'cookie';
import { AuthAccessTokensService } from 'src/auth/auth-access-tokens/auth-access-tokens.service';

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
    private readonly authAccessTokensService: AuthAccessTokensService,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async handleHostConnection(client: ClientSocketOverride) {
    this.logger.debug(`Host connection check: ${client.id}`);

    const token = this.extractHeaderToken(client);

    if (token) {
      try {
        const payload = await this.authAccessTokensService.validateToken(token);
        client.data.host = { id: payload.sub };

        this.logger.log(
          'Token validated in WebSocket connection for host data assignment',
          payload.sub,
        );
      } catch {
        this.logger.debug('Connected client is not a host', token);
      }
    } else {
      this.logger.debug('No token provided in WebSocket connection');
    }
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
      ...(client.data ?? {}),
      name,
      nameSlug,
      roomSlug,
      id: client.id,
      room,
    });
    await this.roomsSessionService.joinParticipant(roomSlug, name, nameSlug);
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
    const session = await this.roomsSessionService.getSession(roomSlug);
    const participants = Object.keys(session.participants);
    const votes: CreateVoteDto[] = [];

    for (const participantSlug of participants) {
      const participant = session.participants[participantSlug];
      votes.push(
        this.votesService.fromVoteDto(
          {
            name: participant.name,
            slug: participantSlug,
            value: participant.vote?.value || null,
          },
          result.id,
        ),
      );
    }

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
    if (session.state !== 'revealed') {
      this.roomsSessionService.hideVotes(session);
    }
    this.server.to(`room-${roomSlug}`).emit('room_update', session);
  }

  private deleteClientData(client: ClientSocketOverride) {
    const dummy: ClientSocketData = {} as ClientSocketData;
    const keys = Object.keys(dummy) as Array<keyof ClientSocketData>;
    for (const key of keys) {
      delete client.data[key];
    }
  }

  private extractHeaderToken(client: ClientSocketOverride): string | undefined {
    const authHeader = client.handshake.headers?.authorization ?? '';
    const [type, token] = authHeader.split(' ');
    return type !== 'Bearer' || !token ? undefined : token;
  }

  private extractCookieToken(client: ClientSocketOverride): string | undefined {
    const cookies = client.handshake.headers?.cookie;

    if (!cookies) {
      return undefined;
    }

    const parsedCookies = parse(cookies);
    return parsedCookies?.accessToken;
  }
}
