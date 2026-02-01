import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class AuthCookiesService {
  private readonly logger = new Logger(AuthCookiesService.name);

  constructor(private readonly configService: ConfigService) {}

  setCookieToResponse(
    response: Response,
    name: string,
    value: string,
    options: Record<string, any> = {},
  ): void {
    const refreshTokenExpiration = this.configService.get<number>(
      'REFRESH_TOKEN_EXPIRATION',
      60 * 5, // default to 5 minutes
    );

    const cookieOptions: Record<string, any> = {
      ...this.getCookieOptions(),
      maxAge: refreshTokenExpiration * 1000,
      ...options,
    };

    this.logger.debug(
      `Setting cookie options: ${JSON.stringify(cookieOptions)}`,
    );

    response.cookie(name, value, cookieOptions);
    this.logger.debug(`Set cookie: ${name}: ${value}`);
  }

  clearCookieFromResponse(
    response: Response,
    name: string,
    options: Record<string, any> = {},
  ): void {
    response.clearCookie(name, { ...this.getCookieOptions(), ...options });
    this.logger.debug(`Cleared cookie: ${name}`);
  }

  private getCookieOptions(): Record<string, any> {
    const secure = this.configService.get<string>('COOKIE_SECURE') === 'true';
    const sameSite = this.configService.get<string>(
      'COOKIE_SAME_SITE',
      'strict',
    );
    const domain = this.configService.get<string>('COOKIE_DOMAIN');

    return {
      path: '/',
      domain,
      httpOnly: true,
      secure,
      sameSite,
    };
  }
}
