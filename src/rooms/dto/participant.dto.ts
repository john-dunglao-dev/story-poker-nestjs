import { VoteDto } from './vote.dto';

export class ParticipantDto {
  name: string;
  connected: boolean;
  vote?: VoteDto;
}
