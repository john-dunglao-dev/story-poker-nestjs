import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { DecodedJwt } from '../interfaces/decoded-jwt.interface';

@Injectable()
export class AuthAccessTokensService {
  private readonly logger = new Logger(AuthAccessTokensService.name);

  constructor(private readonly jwtService: JwtService) {}

  extractTokenFromHeader(request: Request): { accessToken?: string } {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    this.logger.debug(`Extracted access token from header: ${authHeader}`);
    return { accessToken: token };
  }

  async generateToken(userId: number): Promise<string> {
    return await this.jwtService.signAsync({ sub: userId });
  }

  async validateToken(token: string): Promise<DecodedJwt> {
    try {
      return await this.jwtService.verifyAsync<DecodedJwt>(token);
    } catch {
      this.logger.error('Failed to validate access token');
      throw new UnauthorizedException('Invalid token.');
    }
  }
}
