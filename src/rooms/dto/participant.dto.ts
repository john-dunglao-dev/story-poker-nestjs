import { VoteDto } from './vote.dto';

export class ParticipantDto {
  name: string;
  slug: string;
  connected: boolean;
  vote?: VoteDto | null;
}
