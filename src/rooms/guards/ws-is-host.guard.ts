import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ClientSocketOverride } from 'src/rooms/overrides/client-socket.overrides';

@Injectable()
export class WsIsHostGuard {
  private readonly logger = new Logger(WsIsHostGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const wsHost = context.switchToWs();
    const client = wsHost.getClient<ClientSocketOverride>();

    if (!client.data.host || !client.data.host?.id) {
      this.logger.warn(
        `Access denied for client ${client.id}: No host information found.`,
      );
      throw new WsException('No host information found.');
    }

    return true;
  }
}
