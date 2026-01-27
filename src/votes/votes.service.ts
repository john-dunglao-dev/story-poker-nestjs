import { Injectable } from '@nestjs/common';
import { CreateVoteDto } from './dto/create-vote.dto';
import { UpdateVoteDto } from './dto/update-vote.dto';
import { Repository } from 'typeorm';
import { Vote } from './entities/vote.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { VoteDto } from './dto/vote.dto';

type VoteSearchParams = Pick<
  Partial<Vote>,
  'id' | 'resultId' | 'name' | 'createdAt'
>;

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly votesRepository: Repository<Vote>,
  ) {}

  async create(createVoteDto: CreateVoteDto) {
    const vote = this.votesRepository.create(createVoteDto);
    return this.votesRepository.save(vote);
  }

  async batchCreate(createVoteDtos: CreateVoteDto[]) {
    const votes = this.votesRepository.create(createVoteDtos);
    return this.votesRepository.save(votes);
  }

  async findAll(params: VoteSearchParams = {}) {
    if (Object.keys(params).length === 0) {
      return this.votesRepository.find();
    }
    return this.votesRepository.find({ where: { ...params } });
  }

  async findOne(params: VoteSearchParams) {
    return this.votesRepository.findOneOrFail({ where: params });
  }

  async update(id: number, updateVoteDto: UpdateVoteDto) {
    const vote = await this.findOne({ id });

    Object.assign(vote, updateVoteDto);

    return this.votesRepository.save(vote);
  }

  remove(id: number) {
    return this.votesRepository.softDelete(id);
  }

  fromVoteDto(voteDto: VoteDto, resultId: number): CreateVoteDto {
    return {
      ...voteDto,
      resultId,
    };
  }
}
