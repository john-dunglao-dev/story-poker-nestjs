import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { SessionRoomDto } from './dto/session-room.dto';
import { RoomState } from './types/room-state.type';
import { ParticipantDto } from './dto/participant.dto';
import { VoteDto } from './dto/vote.dto';

@Injectable()
export class RoomsSessionService {
  private readonly logger = new Logger(RoomsSessionService.name);

  constructor(private readonly redisService: RedisService) {}

  async createSession(roomSlug: string): Promise<SessionRoomDto> {
    this.logger.debug(`Initializing session state for room-${roomSlug}`);

    const initialSession: SessionRoomDto = {
      roomSlug,
      state: 'voting',
      participants: {},
    };

    await this.redisService.runCommand(
      'JSON.SET',
      `room:${roomSlug}:session`,
      '.',
      JSON.stringify(initialSession),
    );

    return initialSession;
  }

  async getSession(roomSlug: string): Promise<SessionRoomDto> {
    this.logger.debug(`Fetching session state for room-${roomSlug}`);

    const session = await this.redisService.runCommand<string>(
      'JSON.GET',
      `room:${roomSlug}:session`,
      '.',
    );

    const sessionObject: SessionRoomDto = JSON.parse(session) as SessionRoomDto;

    return sessionObject;
  }

  async joinParticipant(
    roomSlug: string,
    participantName: string,
    participantNameSlug: string,
  ): Promise<void> {
    this.logger.debug(
      `Adding participant ${participantNameSlug} to session of room-${roomSlug}`,
    );

    await this.redisService.runCommand(
      'JSON.SET',
      `room:${roomSlug}:session`,
      `.participants.${participantNameSlug}`,
      JSON.stringify({
        name: participantName,
        slug: participantNameSlug,
        connected: true,
        vote: null,
      } as ParticipantDto),
    );
  }

  async leaveParticipant(
    roomSlug: string,
    participantNameSlug: string,
  ): Promise<void> {
    this.logger.debug(
      `Removing participant ${participantNameSlug} from session of room-${roomSlug}`,
    );

    await this.redisService.runCommand(
      'JSON.DEL',
      `room:${roomSlug}:session`,
      `.participants.${participantNameSlug}`,
    );
  }

  async updateSessionState(
    roomSlug: string,
    newState: RoomState,
  ): Promise<void> {
    this.logger.debug(
      `Updating session state for room-${roomSlug} to ${newState}`,
    );

    await this.redisService.runCommand(
      'JSON.SET',
      `room:${roomSlug}:session`,
      '.state',
      `"${newState}"`,
    );
  }

  async vote(
    roomSlug: string,
    participantNameSlug: string,
    value: string,
  ): Promise<void> {
    this.logger.debug(
      `Adding vote for participant ${participantNameSlug} in room-${roomSlug}`,
    );

    await this.redisService.runCommand(
      'JSON.SET',
      `room:${roomSlug}:session`,
      `.participants.${participantNameSlug}.vote`,
      JSON.stringify({ value } as VoteDto),
    );
  }

  async resetVotes(roomSlug: string): Promise<void> {
    this.logger.debug(`Resetting votes for room-${roomSlug}`);

    await this.redisService.runCommand(
      'JSON.SET',
      `room:${roomSlug}:session`,
      '.participants.*.vote',
      'null',
    );
  }

  hideVotes(session: SessionRoomDto): void {
    this.logger.debug(
      `Removing votes from session object for room-${session.roomSlug}`,
    );

    for (const participant of Object.values(session.participants)) {
      if (participant?.vote?.value) {
        participant.vote = {
          value: 'hidden',
        };
      }
    }
  }
}
