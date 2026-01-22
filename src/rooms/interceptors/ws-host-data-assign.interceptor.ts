import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClientSocketOverride } from '../overrides/client-socket.overrides';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class WsHostDataAssignInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WsHostDataAssignInterceptor.name);

  constructor(private readonly authService: AuthService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Implementation of room check logic goes here.
    const wsHost = context.switchToWs();
    const client = wsHost.getClient<ClientSocketOverride>();

    const token = this.extractHeaderToken(client);

    if (token) {
      try {
        await this.authService.validateToken(token).then((payload) => {
          client.data.host = { username: payload.username };

          this.logger.log(
            'Token validated in WebSocket connection for host data assignment',
            payload.username,
          );
        });
      } catch {
        this.logger.warn(
          'Invalid or expired token provided in WebSocket connection',
          token,
        );
      }
    }

    return next.handle();
  }

  private extractHeaderToken(client: ClientSocketOverride): string | undefined {
    const authHeader = client.handshake.headers?.authorization ?? '';
    const [type, token] = authHeader.split(' ');
    return type !== 'Bearer' || !token ? undefined : token;
  }
}
