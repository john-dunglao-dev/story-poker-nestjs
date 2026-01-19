import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
      name: saved.username,
    });

    return saved;
  }

  async findAll() {
    return this.usersRepository.find();
  }

  async findOne(
    params: Pick<Partial<User>, 'username' | 'email' | 'id' | 'isActive'>,
  ) {
    return await this.usersRepository.findOneBy({ ...params });
  }

  async findOneWithHiddenFields(
    params: Pick<Partial<User>, 'username' | 'email' | 'id'>,
  ) {
    return await this.usersRepository
      .createQueryBuilder('users')
      .addSelect(['users.password', 'users.updatedAt', 'users.deletedAt'])
      .where(params)
      .getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne({ id });

    if (!user) {
      throw new NotFoundException('Attempted to update a non-existing user.');
    }

    Object.assign(user, updateUserDto);

    return this.usersRepository.save(user);
  }

  remove(id: number) {
    return this.usersRepository.softDelete(id);
  }
}
