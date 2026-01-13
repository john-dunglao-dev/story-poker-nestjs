import {
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { type JoinRoomRequest } from './interfaces/room.interfaces';
import { RoomsService } from './rooms.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['storypoker.local'],
  },
})
export class RoomsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  constructor(private readonly roomsService: RoomsService) {}

  afterInit() {
    this.logger.log('WebSocket server initialized');
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() data: JoinRoomRequest): void {
    const { username, roomId } = data;
    this.server.to(roomId).emit('user-joined', { username, roomId });
  }
}
