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
import { Logger } from '@nestjs/common';
import { JoinRoomDto } from './dto/join-room.dto';
import { WsRoomsService } from './ws-rooms.service';
import { ClientSocketOverride } from './overrides/client-socket.overrides';

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

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: ClientSocketOverride,
    @MessageBody() data: JoinRoomDto,
  ): Promise<void> {
    const { name, slug } = data;
    await this.wsRoomsService.join(client, slug, name);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: ClientSocketOverride,
  ): Promise<void> {
    await this.wsRoomsService.leave(client);
  }

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

  @SubscribeMessage('startVoting')
  handleStartVoting(
    @ConnectedSocket() client: ClientSocketOverride,
    @MessageBody() data: { id: number },
  ) {
    this.wsRoomsService.reset(data.id.toString());
  }

  @SubscribeMessage('submitVote')
  handleSubmitVote(
    @ConnectedSocket() client: ClientSocketOverride,
    @MessageBody() data: { vote: string },
  ) {
    this.wsRoomsService.vote(client, data.vote);
  }

  @SubscribeMessage('showVotes')
  handleShowVotes(@ConnectedSocket() client: ClientSocketOverride) {
    this.wsRoomsService.reveal(client);
  }
}
