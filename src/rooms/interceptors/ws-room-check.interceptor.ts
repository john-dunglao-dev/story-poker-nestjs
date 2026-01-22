import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClientSocketOverride } from '../overrides/client-socket.overrides';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsRoomCheckInterceptor implements NestInterceptor {
  // This interceptor can be expanded to include methods that check
  // if a client is part of a room before allowing certain actions.

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    // Implementation of room check logic goes here.
    const wsHost = context.switchToWs();
    const client = wsHost.getClient<ClientSocketOverride>();

    if (!client.data.roomSlug) {
      throw new WsException('Client is not part of the room.');
    }

    return next.handle();
  }
}
