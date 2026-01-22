import { Injectable } from '@nestjs/common';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { Repository } from 'typeorm';
import { Result } from './entities/result.entity';
import { InjectRepository } from '@nestjs/typeorm';

type ResultSearchParams = Pick<Partial<Result>, 'id' | 'roomId' | 'createdAt'>;

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Result)
    private readonly resultsRepository: Repository<Result>,
  ) {}

  async create(createResultDto: CreateResultDto) {
    const result = this.resultsRepository.create(createResultDto);
    return this.resultsRepository.save(result);
  }

  async findAll(params: ResultSearchParams = {}) {
    return this.resultsRepository.find({ where: { ...params } });
  }

  async findOne(params: ResultSearchParams) {
    return this.resultsRepository.findOneByOrFail({ ...params });
  }

  async update(id: number, updateResultDto: UpdateResultDto) {
    const result = await this.findOne({ id });
    Object.assign(result, updateResultDto);
    return this.resultsRepository.save(result);
  }

  async remove(id: number) {
    return this.resultsRepository.delete(id);
  }
}
