import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthRefreshToken } from './entities/auth-refresh-token.entity';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DecodedJwt } from '../interfaces/decoded-jwt.interface';

@Injectable()
export class AuthRefreshTokensService {
  private readonly logger = new Logger(AuthRefreshTokensService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(AuthRefreshToken)
    private readonly authRefreshTokenRepository: Repository<AuthRefreshToken>,
  ) {}

  async createRefreshToken(
    userId: number,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthRefreshToken> {
    const refreshToken = this.authRefreshTokenRepository.create({
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
      isRevoked: false,
    });

    return this.authRefreshTokenRepository.save(refreshToken);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.authRefreshTokenRepository.update(
      { token },
      { isRevoked: true },
    );
  }

  async findValidRefreshToken(
    filters: Partial<Omit<AuthRefreshToken, 'isRevoked' | 'expiresAt'>>,
  ): Promise<AuthRefreshToken | null> {
    return this.authRefreshTokenRepository.findOne({
      where: {
        ...filters,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async generateToken(sub: number): Promise<string> {
    return await this.jwtService.signAsync(
      { sub },
      {
        expiresIn: this.configService.get<number>(
          'REFRESH_TOKEN_EXPIRATION',
          86400000,
        ),
      },
    );
  }

  async validateToken(token: string): Promise<DecodedJwt> {
    return await this.jwtService.verifyAsync<DecodedJwt>(token);
  }

  extractTokenFromCookie(request: Request): { refreshToken?: string } {
    return {
      refreshToken: request.cookies?.refreshToken as string | undefined,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async deleteOldTokens(): Promise<void> {
    this.logger.log('Deleting old refresh tokens...');

    await this.authRefreshTokenRepository.delete({
      expiresAt: LessThanOrEqual(new Date()),
    });
  }
}
