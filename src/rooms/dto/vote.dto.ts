import { PickType } from '@nestjs/mapped-types';
import { CreateVoteDto } from 'src/votes/dto/create-vote.dto';

export class VoteDto extends PickType(CreateVoteDto, ['value']) {}
