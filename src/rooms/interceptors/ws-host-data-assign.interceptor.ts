import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClientSocketOverride } from '../overrides/client-socket.overrides';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class WsHostDataAssignInterceptor implements NestInterceptor {
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
      await this.authService.validateToken(token).then((payload) => {
        client.data.host = { username: payload.username };
      });
    }

    return next.handle();
  }

  private extractHeaderToken(client: ClientSocketOverride): string | undefined {
    const authHeader = client.handshake.headers?.authorization ?? '';
    const [type, token] = authHeader.split(' ');
    return type !== 'Bearer' || !token ? undefined : token;
  }
}
