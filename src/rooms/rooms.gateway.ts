import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Logger } from '@nestjs/common';
import { JoinRoomDto } from './dto/join-room.dto';
import { WsRoomsService } from './ws-rooms.service';

@WebSocketGateway()
export class RoomsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomsService: RoomsService,
    private readonly wsRoomsService: WsRoomsService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket server initialized');
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
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

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ): Promise<void> {
    const { name, id } = data;
    this.logger.debug(`User ${name} is joining room-${id}`);

    await client.join(`room-${id}`);
    this.server.to(`room-${id}`).emit('userJoined', { name, id });
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ): Promise<void> {
    const { name, id } = data;
    this.logger.debug(`User ${name} is leaving room-${id}`);

    await client.leave(`room-${id}`);
    this.server.to(`room-${id}`).emit('userLeft', { name, id });
  }

  @SubscribeMessage('startVoting')
  handleStartVoting(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: number },
  ) {
    const { id } = data;
    this.logger.debug(`Starting voting in room-${id}`);

    this.server.to(`room-${id}`).emit('votingStarted', { id });
  }

  @SubscribeMessage('submitVote')
  handleSubmitVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: number; vote: string; name: string },
  ) {
    const { id, vote, name } = data;
    this.logger.debug(`User ${name} submitted vote in room-${id}`);

    this.server.to(`room-${id}`).emit('voteSubmitted', { id, vote, name });
  }

  @SubscribeMessage('showVotes')
  handleShowVotes(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: number },
  ) {
    const { id } = data;
    this.logger.debug(`Showing votes in room-${id}`);

    this.server.to(`room-${id}`).emit('votesShown', { id });
  }
}
