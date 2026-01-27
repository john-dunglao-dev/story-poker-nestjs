import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomsSessionService } from './rooms-session.service';

type RoomSearchParams = Pick<
  Partial<Room>,
  'id' | 'name' | 'slug' | 'createdAt'
>;

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly roomsSessionService: RoomsSessionService,
  ) {}

  async create(createRoomDto: CreateRoomDto) {
    const room = this.roomRepository.create(createRoomDto);

    const saved = await this.roomRepository.save(room);
    await this.roomsSessionService.createSession(saved.slug);

    return saved;
  }

  findAll(params: RoomSearchParams = {}) {
    return this.roomRepository.find({ where: { ...params } });
  }

  findOne(params: RoomSearchParams) {
    return this.roomRepository.findOneByOrFail({ ...params });
  }

  update(id: number, updateRoomDto: UpdateRoomDto) {
    return this.roomRepository.update(id, updateRoomDto);
  }

  remove(id: number) {
    return this.roomRepository.delete(id);
  }

  slugExists(slug: string) {
    return this.roomRepository.exists({ where: { slug } });
  }
}
