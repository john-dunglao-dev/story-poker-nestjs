import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

type UserSearchParams = Pick<
  Partial<User>,
  'name' | 'email' | 'id' | 'isActive'
>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);

    const saved = await this.usersRepository.save(user);

    this.eventEmitter.emit('user.created.next.email', {
      email: saved.email,
      name: saved.name,
    });

    return saved;
  }

  async findAll() {
    return this.usersRepository.find();
  }

  async findOne(params: UserSearchParams) {
    return await this.usersRepository.findOneByOrFail({ ...params });
  }

  async findOneWithHiddenFields(params: UserSearchParams) {
    return await this.usersRepository
      .createQueryBuilder('users')
      .addSelect(['users.password', 'users.updatedAt', 'users.deletedAt'])
      .where(params)
      .getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne({ id });
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  remove(id: number) {
    return this.usersRepository.softDelete(id);
  }
}
