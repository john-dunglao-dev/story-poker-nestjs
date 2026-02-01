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

    if (!refreshToken) {
      this.logger.error('Access token or refresh token not provided');
      throw new UnauthorizedException('Invalid tokens.');
    }

    // validate refresh token
    const existingRefreshToken =
      await this.authRefreshTokensService.findValidRefreshToken({
        token: refreshToken,
        ipAddress,
        userAgent,
      });

    if (!existingRefreshToken) {
      this.logger.error('Refresh token not found or is invalid', {
        refreshToken,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid tokens.');
    }

    const decoded =
      await this.authRefreshTokensService.validateToken(refreshToken);

    if (decoded.sub !== existingRefreshToken.userId) {
      this.logger.error(
        `Refresh token user ID does not match token subject: ${decoded.sub} !== ${existingRefreshToken.userId}`,
      );
      throw new UnauthorizedException('Invalid tokens.');
    }

    // revoke existing refresh token
    await this.authRefreshTokensService.revokeRefreshToken(refreshToken);

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
}
