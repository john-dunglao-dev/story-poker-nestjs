import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

type RoomSearchParams = Pick<
  Partial<Room>,
  'id' | 'name' | 'slug' | 'createdAt'
>;

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  create(createRoomDto: CreateRoomDto) {
    const room = this.roomRepository.create(createRoomDto);
    return this.roomRepository.save(room);
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
