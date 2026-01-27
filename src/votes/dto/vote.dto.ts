import { OmitType } from '@nestjs/mapped-types';
import { CreateVoteDto } from './create-vote.dto';

export class VoteDto extends OmitType(CreateVoteDto, ['resultId']) {}
