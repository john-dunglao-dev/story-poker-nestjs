import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthAccessTokensService } from '../auth-access-tokens/auth-access-tokens.service';
import { AuthRefreshTokensService } from '../auth-refresh-tokens/auth-refresh-tokens.service';
import { UsersService } from 'src/users/users.service';
import { DecodedJwt } from '../interfaces/decoded-jwt.interface';

@Injectable()
export class AuthTokensService {
  private readonly logger = new Logger(AuthTokensService.name);

  constructor(
    private readonly authAccessTokensService: AuthAccessTokensService,
    private readonly authRefreshTokensService: AuthRefreshTokensService,
    private readonly usersService: UsersService,
  ) {}

  async rotateAccessToken(
    accessToken?: string,
    refreshToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    this.logger.log('Rotating access token');
    this.logger.debug(`Access Token: ${accessToken}`);
    this.logger.debug(`Refresh Token: ${refreshToken}`);

    if (!accessToken || !refreshToken) {
      this.logger.error('Access token or refresh token not provided');
      throw new UnauthorizedException('Invalid tokens.');
    }

    // decode access token payload (may be expired)
    const decoded =
      await this.authAccessTokensService.validateToken(accessToken);

    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Invalid access token.');
    }

    // validate refresh token
    const existingRefreshToken =
      await this.authRefreshTokensService.findValidRefreshToken({
        token: refreshToken,
        ipAddress,
        userAgent,
      });

    if (!existingRefreshToken) {
      this.logger.error('Refresh token not found or is invalid');
      throw new UnauthorizedException('Invalid tokens.');
    }

    let refreshPayload: DecodedJwt;
    try {
      refreshPayload =
        await this.authRefreshTokensService.validateToken(refreshToken);
    } catch {
      this.logger.error('Invalid refresh token');
      throw new UnauthorizedException('Invalid token.');
    }

    if (refreshPayload.sub !== decoded.sub) {
      this.logger.error(
        'Refresh token subject does not match access token subject',
      );
      throw new UnauthorizedException('Invalid token.');
    }

    // fetch user
    const user = await this.usersService.findOne({ id: decoded.sub });

    if (!user) {
      this.logger.error(`User not found: ${decoded.sub}`);
      throw new UnauthorizedException('Invalid token.');
    }

    // issue new access token (and optionally rotate refresh token)
    const newAccessToken = await this.authAccessTokensService.generateToken(
      user.id,
    );

    return { accessToken: newAccessToken };
  }
}
