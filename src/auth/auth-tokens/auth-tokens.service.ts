import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthAccessTokensService } from '../auth-access-tokens/auth-access-tokens.service';
import { AuthRefreshTokensService } from '../auth-refresh-tokens/auth-refresh-tokens.service';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthTokensService {
  private readonly logger = new Logger(AuthTokensService.name);

  constructor(
    private readonly authAccessTokensService: AuthAccessTokensService,
    private readonly authRefreshTokensService: AuthRefreshTokensService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async rotateTokens(
    refreshToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    this.logger.log('Rotating access token');
    this.logger.debug(`Refresh Token: ${refreshToken}`);

    await this.authRefreshTokensService.validate(
      refreshToken,
      ipAddress,
      userAgent,
    );

    const decoded = await this.authRefreshTokensService.verify(refreshToken!);

    // revoke existing refresh token
    await this.authRefreshTokensService.revokeRefreshToken(refreshToken!);

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
    const newRefreshToken = await this.authRefreshTokensService.generateToken(
      user.id,
    );

    await this.authRefreshTokensService.createRefreshToken(
      user.id,
      newRefreshToken,
      new Date(
        Date.now() +
          this.configService.get<number>(
            'AUTH_REFRESH_TOKEN_EXPIRATION_MS',
            604800000,
          ),
      ),
      ipAddress,
      userAgent,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async refreshAccessToken(
    refreshToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    this.logger.log('Refreshing access token');
    this.logger.debug(`Refresh Token: ${refreshToken}`);

    await this.authRefreshTokensService.validate(
      refreshToken,
      ipAddress,
      userAgent,
    );

    const decoded = await this.authRefreshTokensService.verify(refreshToken!);

    // fetch user
    const user = await this.usersService.findOne({ id: decoded.sub });

    if (!user) {
      this.logger.error(`User not found: ${decoded.sub}`);
      throw new UnauthorizedException('Invalid token.');
    }

    // issue new access token
    const newAccessToken = await this.authAccessTokensService.generateToken(
      user.id,
    );

    return {
      accessToken: newAccessToken,
    };
  }
}
