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
import { Server } from 'socket.io';
import { Logger, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { JoinRoomDto } from './dto/join-room.dto';
import { WsRoomsService } from './ws-rooms.service';
import { ClientSocketOverride } from './overrides/client-socket.overrides';
import { AttendanceWsException } from './filters/attendance-ws-exception.filter';
import { WsHostDataAssignInterceptor } from './interceptors/ws-host-data-assign.interceptor';
import { WsAttendanceGuard } from './guards/ws-attendance.guard';
import { WsIsHostGuard } from './guards/ws-is-host.guard';

@WebSocketGateway()
export class RoomsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  constructor(private readonly wsRoomsService: WsRoomsService) {}

  afterInit() {
    this.logger.log('WebSocket server initialized');
    this.wsRoomsService.setServer(this.server);
  }

  handleConnection(@ConnectedSocket() client: ClientSocketOverride) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: ClientSocketOverride) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @UseInterceptors(WsHostDataAssignInterceptor)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: ClientSocketOverride,
    @MessageBody() data: JoinRoomDto,
  ): Promise<void> {
    const { name, slug } = data;
    await this.wsRoomsService.join(client, slug, name);
  }

  @UseGuards(WsAttendanceGuard)
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: ClientSocketOverride,
  ): Promise<void> {
    await this.wsRoomsService.leave(client);
  }

  @UseGuards(WsAttendanceGuard, WsIsHostGuard)
  @UseFilters(AttendanceWsException)
  @SubscribeMessage('kickUser')
  async handleKickUser(
    @ConnectedSocket() client: ClientSocketOverride,
    @MessageBody()
    data: { roomSlug: string; targetClientId: string; targetName: string },
  ): Promise<void> {
    const { roomSlug, targetClientId, targetName } = data;
    const targetClient = this.server.sockets.sockets.get(targetClientId);
    if (targetClient) {
      await this.wsRoomsService.kick(roomSlug, targetClient, targetName);
    }
  }

  @UseGuards(WsAttendanceGuard, WsIsHostGuard)
  @UseFilters(AttendanceWsException)
  @SubscribeMessage('startVoting')
  async handleStartVoting(@ConnectedSocket() client: ClientSocketOverride) {
    await this.wsRoomsService.reset(client.data.roomSlug!);
  }

  @UseGuards(WsAttendanceGuard)
  @UseFilters(AttendanceWsException)
  @SubscribeMessage('submitVote')
  async handleSubmitVote(
    @ConnectedSocket() client: ClientSocketOverride,
    @MessageBody() data: { vote: string },
  ) {
    await this.wsRoomsService.vote(client, data.vote);
  }

  @UseGuards(WsAttendanceGuard, WsIsHostGuard)
  @UseFilters(AttendanceWsException)
  @SubscribeMessage('showVotes')
  async handleShowVotes(@ConnectedSocket() client: ClientSocketOverride) {
    await this.wsRoomsService.reveal(client);
  }
}
