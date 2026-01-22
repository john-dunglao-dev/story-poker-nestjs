import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ClientSocketOverride } from 'src/rooms/overrides/client-socket.overrides';

@Injectable()
export class WsAttendanceGuard {
  private readonly logger = new Logger(WsAttendanceGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const wsHost = context.switchToWs();
    const client = wsHost.getClient<ClientSocketOverride>();

    if (!client.data.roomSlug) {
      this.logger.warn(
        `Access denied for client ${client.id}: No room joined.`,
      );
      throw new WsException('No room joined.');
    }

    return true;
  }
}
