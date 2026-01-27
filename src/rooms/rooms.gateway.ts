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
import { WsAttendanceGuard } from './guards/ws-attendance.guard';
import { WsIsHostGuard } from './guards/ws-is-host.guard';
import { WsBroadcastUpdateInterceptor } from './interceptors/ws-broadcast-update.interceptor';

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

  async handleConnection(@ConnectedSocket() client: ClientSocketOverride) {
    this.logger.debug(`Client connected: ${client.id}`);
    await this.wsRoomsService.handleHostConnection(client);
  }

  handleDisconnect(@ConnectedSocket() client: ClientSocketOverride) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  // ! Do not add WsBroadcastUpdateInterceptor here, it will cause double broadcasts
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: ClientSocketOverride,
    @MessageBody() data: JoinRoomDto,
  ): Promise<void> {
    const { name, slug } = data;
    await this.wsRoomsService.join(client, slug, name);
  }

  @UseGuards(WsAttendanceGuard)
  @UseInterceptors(WsBroadcastUpdateInterceptor)
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: ClientSocketOverride,
  ): Promise<void> {
    await this.wsRoomsService.leave(client);
  }

  @UseGuards(WsAttendanceGuard, WsIsHostGuard)
  @UseFilters(AttendanceWsException)
  @UseInterceptors(WsBroadcastUpdateInterceptor)
  @SubscribeMessage('kick_user')
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
  @UseInterceptors(WsBroadcastUpdateInterceptor)
  @SubscribeMessage('start_voting')
  async handleStartVoting(@ConnectedSocket() client: ClientSocketOverride) {
    await this.wsRoomsService.reset(client.data.roomSlug!);
  }

  @UseGuards(WsAttendanceGuard)
  @UseFilters(AttendanceWsException)
  @UseInterceptors(WsBroadcastUpdateInterceptor)
  @SubscribeMessage('submit_vote')
  async handleSubmitVote(
    @ConnectedSocket() client: ClientSocketOverride,
    @MessageBody() data: { vote: string },
  ) {
    await this.wsRoomsService.vote(client, data.vote);
  }

  @UseGuards(WsAttendanceGuard, WsIsHostGuard)
  @UseFilters(AttendanceWsException)
  @UseInterceptors(WsBroadcastUpdateInterceptor)
  @SubscribeMessage('show_votes')
  async handleShowVotes(@ConnectedSocket() client: ClientSocketOverride) {
    await this.wsRoomsService.reveal(client);
    await this.wsRoomsService.reset(client.data.roomSlug!);
  }
}
