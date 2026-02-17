import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { IS_PUBLIC_KEY } from 'src/_decorators/public.decorator';
import { ClientSocketOverride } from 'src/rooms/overrides/client-socket.overrides';
import { DecodedJwt } from '../interfaces/decoded-jwt.interface';

@Injectable()
export class WsHostAuthGuard {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }

    const wsHost = context.switchToWs();
    const client = wsHost.getClient<ClientSocketOverride>();

    // const token = this.extractTokenFromHeader(client);
    const token = this.extractAuthTokenFromClient(client);

    if (!token) {
      throw new WsException('No token provided');
    }

    try {
      await this.jwtService.verifyAsync<DecodedJwt>(token);
      // You can attach the payload to the request object if needed
    } catch {
      throw new WsException('Invalid or expired token');
    }

    return true;
  }

  private extractAuthTokenFromClient(
    client: ClientSocketOverride,
  ): string | undefined {
    const authToken = client.handshake?.auth?.token as string | undefined;
    return authToken;
  }

  private extractTokenFromHeader(
    client: ClientSocketOverride,
  ): string | undefined {
    const [type, token] =
      client.handshake.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private isPublic(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
}
