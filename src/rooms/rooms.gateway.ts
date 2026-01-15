import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Server } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Logger } from '@nestjs/common';
import { JoinRoomDto } from './dto/join-room.dto';

@WebSocketGateway()
export class RoomsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(RoomsGateway.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomsService: RoomsService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket server initialized');
  }

  @SubscribeMessage('createRoom')
  create(@MessageBody() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @SubscribeMessage('findAllRooms')
  findAll() {
    return this.roomsService.findAll();
  }

  @SubscribeMessage('findOneRoom')
  findOne(@MessageBody() id: number) {
    return this.roomsService.findOne(id);
  }

  @SubscribeMessage('updateRoom')
  update(@MessageBody() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(updateRoomDto.id, updateRoomDto);
  }

  @SubscribeMessage('removeRoom')
  remove(@MessageBody() id: number) {
    return this.roomsService.remove(id);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() data: JoinRoomDto): void {
    const { name, id } = data;
    this.server.to(`room-${id}`).emit('user-joined', { name, id });
  }
}
