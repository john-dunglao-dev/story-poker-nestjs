import { RoomState } from '../types/room-state.type';
import { ParticipantDto } from './participant.dto';

export class SessionRoomDto {
  roomSlug: string;
  state: RoomState;
  participants: Record<string, ParticipantDto>;
}
