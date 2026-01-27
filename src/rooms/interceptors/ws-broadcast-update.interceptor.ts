import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ClientSocketOverride } from '../overrides/client-socket.overrides';
import { WsRoomsService } from '../ws-rooms.service';

@Injectable()
export class WsBroadcastUpdateInterceptor implements NestInterceptor {
  constructor(private readonly wsRoomsService: WsRoomsService) {}

  // Interceptor implementation has been removed
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const wsHost = context.switchToWs();
    const client = wsHost.getClient<ClientSocketOverride>();
    const roomSlug = client.data.roomSlug!;

    return next.handle().pipe(
      tap(() => {
        void this.wsRoomsService.broadcastRoomSessionUpdate(roomSlug);
      }),
    );
  }
}
